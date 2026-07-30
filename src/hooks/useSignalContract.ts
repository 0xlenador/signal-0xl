import { useState, useCallback, useRef, useEffect } from 'react';
import { createPublicClient, http, formatUnits, parseUnits } from 'viem';
import { useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { arcTestnet } from '@/lib/wagmi.config';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CONSTANTS } from '@/lib/config';
import { getNextHttpRpc } from '@/lib/rpcEngine';

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

// getPublicClient eliminated in favor of inline instantiation with logging

async function withRetry<T>(fn: () => Promise<T>, retries = 5, delayMs = 300): Promise<T> {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastErr = error;
      console.warn(`[RPC Motor] Bucle de reintento atrapó error. Intento ${i + 1} de ${retries}.`);
      if (i === retries - 1) break;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

export function useSignalContract(): ISignalContractHook {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchUserData = useCallback(async (walletAddress: string | null | undefined): Promise<IUserData | null> => {
    if (!walletAddress) return null;

    const cacheKey = `signal_userdata_${walletAddress.toLowerCase()}`;
    const queryState = queryClient.getQueryState(['userData', walletAddress]);
    
    if (!queryState?.isInvalidated) {
      if (typeof window !== 'undefined') {
         const cachedStr = localStorage.getItem(cacheKey);
         if (cachedStr) {
            try {
               const parsed = JSON.parse(cachedStr);
               const today = Math.floor(Date.now() / 86400000);
               const cacheDay = Math.floor(parsed.timestamp / 86400000);
               if (today === cacheDay) {
                  console.log(`[Cache Motor] ⚡ Datos cargados al instante desde LocalStorage (0ms).`);
                  if (!queryClient.getQueryData(['userData', walletAddress])) {
                     queryClient.setQueryData(['userData', walletAddress], parsed.data);
                  }
                  return parsed.data;
               }
            } catch(e){}
         }
      }
    }

    return queryClient.fetchQuery({
      queryKey: ['userData', walletAddress],
      staleTime: 5000,
      queryFn: async () => {
        try {
          return await withRetry(async () => {
            const url = getNextHttpRpc();
            console.log(`[RPC Motor] 🔄 Probando lectura de contrato con: ${url}`);
            
            const client = createPublicClient({
              chain: arcTestnet,
              transport: http(url),
            });
            
            let data;
            try {
              data = await client.readContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: 'users',
                args: [walletAddress as `0x${string}`],
              });
              console.log(`[RPC Motor] ✅ ÉXITO. Datos cargados vía: ${url}`);
            } catch (err: any) {
              console.warn(`[RPC Motor] ❌ FALLÓ ${url} | Motivo: ${err.shortMessage || err.message || "Network Error"}`);
              throw err;
            }
            
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

            const result = {
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
            
            if (typeof window !== 'undefined') {
              localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: result
              }));
            }
            return result;
          });
        } catch (err) {
          console.error("Error fetching user data:", err);
          return null;
        }
      }
    });
  }, [queryClient]);

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
      await publicClient!.waitForTransactionReceipt({ hash });
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (address) localStorage.removeItem(`signal_userdata_${address.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['userData'] });
      window.dispatchEvent(new CustomEvent('signal-data-refresh'));
      return true;
    } catch (error) {
      const err = error as { shortMessage?: string; message?: string };
      console.warn("doGM transaction failed/rejected:", err.shortMessage || err.message);
      if (isMountedRef.current) setError(err.shortMessage || err.message || "Error desconocido");
      return false;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [writeContractAsync, queryClient]);

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
      await publicClient!.waitForTransactionReceipt({ hash });
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (address) localStorage.removeItem(`signal_userdata_${address.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['userData'] });
      window.dispatchEvent(new CustomEvent('signal-data-refresh'));
      return true;
    } catch (error) {
      const err = error as { shortMessage?: string; message?: string };
      console.warn("resetToVIP transaction failed/rejected:", err.shortMessage || err.message);
      if (isMountedRef.current) setError(err.shortMessage || err.message || "Error desconocido");
      return false;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [writeContractAsync, queryClient]);

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
      await publicClient!.waitForTransactionReceipt({ hash });
      // Pequeño delay para que el RPC indexe el estado
      await new Promise(resolve => setTimeout(resolve, 2500));
      if (address) localStorage.removeItem(`signal_userdata_${address.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['userData'] });
      window.dispatchEvent(new CustomEvent('signal-data-refresh'));
      return true;
    } catch (error) {
      const err = error as { shortMessage?: string; message?: string };
      console.warn("activateNodeInstant transaction failed/rejected:", err.shortMessage || err.message);
      if (isMountedRef.current) setError(err.shortMessage || err.message || "Error desconocido");
      return false;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [writeContractAsync, queryClient]);

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
      await publicClient!.waitForTransactionReceipt({ hash });
      // Pequeño delay para que el RPC indexe el estado
      await new Promise(resolve => setTimeout(resolve, 2500));
      if (address) localStorage.removeItem(`signal_userdata_${address.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['userData'] });
      window.dispatchEvent(new CustomEvent('signal-data-refresh'));
      return true;
    } catch (error) {
      const err = error as { shortMessage?: string; message?: string };
      console.warn("activateNodeByStreak transaction failed/rejected:", err.shortMessage || err.message);
      if (isMountedRef.current) setError(err.shortMessage || err.message || "Error desconocido");
      return false;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [writeContractAsync, queryClient]);

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
