import { useState, useCallback, useRef, useEffect } from 'react';
import { createPublicClient, http, formatUnits, parseUnits } from 'viem';
import { useWriteContract } from 'wagmi';
import { arcTestnet } from '@/lib/wagmi.config';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CONSTANTS } from '@/lib/config';

export interface IUserData {
  totalPoints: number;
  lastGmDay: number;
  currentStreak: number;
  forkLevel: number;
  gmCount: number;
  nodeCommitment: boolean;
  nodeConviction: boolean;
  nodeLegacy: boolean;
  exists: boolean;
  attachedAgentId: number;
  onChainForkLevel: number;
}

export interface IContractCost {
  gmCost: bigint;
  debtCost: bigint;
}

export interface ISignalContractHook {
  fetchUserData: (walletAddress: string | null | undefined) => Promise<IUserData | null>;
  getGMCost: (walletAddress: string | null | undefined, preloadedData?: IUserData | null) => Promise<IContractCost | null>;
  hasGMToday: (walletAddress: string | null | undefined, preloadedData?: IUserData | null) => Promise<boolean>;
  doGM: (payableAmount: bigint) => Promise<boolean>;
  resetToVIP: () => Promise<boolean>;
  activateNodeInstant: (nodeId: number, costWei: bigint) => Promise<boolean>;
  activateNodeByStreak: (nodeId: number) => Promise<boolean>;
  getNodeInstantCost: (nodeId: number, walletAddress: string) => Promise<bigint | null>;
  loading: boolean;
  error: string | null;
}

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error("Unreachable");
}

// Caché para evitar peticiones duplicadas simultáneas al RPC
const requestCache = new Map<string, { promise: Promise<IUserData | null>, timestamp: number }>();

export function useSignalContract(): ISignalContractHook {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchUserData = useCallback(async (walletAddress: string | null | undefined): Promise<IUserData | null> => {
    if (!walletAddress) return null;

    const now = Date.now();
    const cached = requestCache.get(walletAddress);
    // Reutilizar la promesa si tiene menos de 3 segundos de antigüedad (deduplicación)
    if (cached && (now - cached.timestamp < 3000)) {
      return cached.promise;
    }

    const promise = (async () => {
      try {
        return await withRetry(async () => {
          const data = await publicClient.readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: CONTRACT_ABI,
            functionName: 'users',
            args: [walletAddress as `0x${string}`],
          });
          
          let totalPoints = Number(data[0]);
          let lastGmDay = Number(data[1]);
          let currentStreak = Number(data[2]);
          let forkLevel = Number(data[3] === 0n ? 1n : data[3]);
          const onChainForkLevel = forkLevel;
          let gmCount = Number(data[4]);
          let nodeCommitment = Boolean(data[5]);
          let nodeConviction = Boolean(data[6]);
          let nodeLegacy = Boolean(data[7]);
          let exists = Boolean(data[8]);
          let attachedAgentId = Number(data[9] || 0);

          const today = Math.floor(Date.now() / 86400000);
          if (lastGmDay > 0 && today > lastGmDay + 1) {
              forkLevel += 1;
              currentStreak = 0;
              nodeCommitment = false;
              nodeConviction = false;
              nodeLegacy = false;
          }

          return {
            totalPoints,
            lastGmDay,
            currentStreak,
            forkLevel,
            gmCount,
            nodeCommitment,
            nodeConviction,
            nodeLegacy,
            exists,
            attachedAgentId,
            onChainForkLevel
          };
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
        return null;
      }
    })(); // Execute the async IIFE to create the promise

    requestCache.set(walletAddress, { promise, timestamp: now });
    return promise;
  }, []);

  const getGMCost = useCallback(async (walletAddress: string | null | undefined, preloadedData: IUserData | null = null): Promise<IContractCost | null> => {
    if (!walletAddress) return null;
    try {
      const data = preloadedData || await fetchUserData(walletAddress);
      if (!data) return null;

      const today = Math.floor(Date.now() / 86400000);
      const fork = data.forkLevel === 0 ? 1 : data.forkLevel;
      const baseCost = CONSTANTS.BASE_GM_COST_WEI;
      
      let gmCost = baseCost;
      if (fork > 1) {
          gmCost = baseCost + (BigInt(fork - 1) * (baseCost / 2n));
      }
      
      let debtCost = 0n;
      if (data.lastGmDay > 0 && today > data.lastGmDay + 1) {
          const missed = BigInt(today - data.lastGmDay - 1);
          debtCost = missed * baseCost;
      }
      
      return { gmCost, debtCost };
    } catch (err) {
      console.error("Error fetching GM cost:", err);
      return null;
    }
  }, [fetchUserData]);

  const hasGMToday = useCallback(async (walletAddress: string | null | undefined, preloadedData: IUserData | null = null): Promise<boolean> => {
    if (!walletAddress) return false;
    try {
      const data = preloadedData || await fetchUserData(walletAddress);
      if (!data || !data.exists) return false;
      const today = Math.floor(Date.now() / 86400000);
      return data.lastGmDay === today;
    } catch (err) {
      console.error("Error checking GM today:", err);
      return false;
    }
  }, [fetchUserData]);

  const doGM = useCallback(async (payableAmount: bigint): Promise<boolean> => {
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'doGM',
        value: payableAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      requestCache.clear();
      window.dispatchEvent(new CustomEvent('signal-data-refresh'));
      return true;
    } catch (error) {
      const err = error as { shortMessage?: string; message?: string };
      console.error("doGM error:", err);
      if (isMountedRef.current) setError(err.shortMessage || err.message || "Error desconocido");
      return false;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [writeContractAsync]);

  const resetToVIP = useCallback(async (): Promise<boolean> => {
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'resetToVIP',
      });
      await publicClient.waitForTransactionReceipt({ hash });
      requestCache.clear();
      window.dispatchEvent(new CustomEvent('signal-data-refresh'));
      return true;
    } catch (error) {
      const err = error as { shortMessage?: string; message?: string };
      console.error("resetToVIP error:", err);
      if (isMountedRef.current) setError(err.shortMessage || err.message || "Error desconocido");
      return false;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [writeContractAsync]);

  const activateNodeInstant = useCallback(async (nodeId: number, costWei: bigint): Promise<boolean> => {
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'activateNodeInstant',
        args: [nodeId],
        value: costWei,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      requestCache.clear();
      window.dispatchEvent(new CustomEvent('signal-data-refresh'));
      return true;
    } catch (error) {
      const err = error as { shortMessage?: string; message?: string };
      console.error("activateNodeInstant error:", err);
      if (isMountedRef.current) setError(err.shortMessage || err.message || "Error desconocido");
      return false;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [writeContractAsync]);

  const activateNodeByStreak = useCallback(async (nodeId: number): Promise<boolean> => {
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'activateNodeByStreak',
        args: [nodeId],
        value: CONSTANTS.BASE_GM_COST_WEI,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      requestCache.clear();
      window.dispatchEvent(new CustomEvent('signal-data-refresh'));
      return true;
    } catch (error) {
      const err = error as { shortMessage?: string; message?: string };
      console.error("activateNodeByStreak error:", err);
      if (isMountedRef.current) setError(err.shortMessage || err.message || "Error desconocido");
      return false;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [writeContractAsync]);

  const getNodeInstantCost = useCallback(async (nodeId: number, walletAddress: string): Promise<bigint | null> => {
    try {
      const data = await fetchUserData(walletAddress);
      const baseCost = CONSTANTS.BASE_GM_COST_WEI;
      
      if (data && data.onChainForkLevel > 1) return baseCost; // B2+ paga solo el costo base
      
      // Costo base (0.01 USDC) + costo especifico del nodo
      if (nodeId === 1) return baseCost + parseUnits("0.5", 18);
      if (nodeId === 2) return baseCost + parseUnits("1.25", 18);
      if (nodeId === 3) return baseCost + parseUnits("5", 18);
      
      return baseCost;
    } catch (err) {
      console.error("Error calculating node instant cost:", err);
      return null;
    }
  }, [fetchUserData]);

  return {
    fetchUserData,
    getGMCost,
    hasGMToday,
    doGM,
    resetToVIP,
    activateNodeInstant,
    activateNodeByStreak,
    getNodeInstantCost,
    loading,
    error
  };
}
