import { useState, useCallback, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/components/Web3Provider';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CONSTANTS, NETWORK } from '@/lib/config';

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

const staticNetwork = ethers.Network.from({
  chainId: NETWORK.chainId,
  name: NETWORK.name
});

let _publicProvider: ethers.JsonRpcProvider | null = null;
function getPublicProvider(): ethers.JsonRpcProvider {
  if (!_publicProvider) {
    _publicProvider = new ethers.JsonRpcProvider(NETWORK.rpcUrls[0], staticNetwork, {
      staticNetwork: staticNetwork
    });
  }
  return _publicProvider;
}

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
  const { signer } = useWeb3();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const getReadContract = useCallback(() => {
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, getPublicProvider());
  }, []);

  const getWriteContract = useCallback(() => {
    if (!signer) return null;
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }, [signer]);

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
        const contract = getReadContract();
        const data = await contract.users(walletAddress);
        
        let totalPoints = Number(data.totalPoints);
        let lastGmDay = Number(data.lastGmDay);
        let currentStreak = Number(data.currentStreak);
        let forkLevel = Number(data[3] === 0n ? 1n : data[3]);
        const onChainForkLevel = forkLevel;
        let gmCount = Number(data.gmCount);
        let nodeCommitment = Boolean(data.nodeCommitment);
        let nodeConviction = Boolean(data.nodeConviction);
        let nodeLegacy = Boolean(data.nodeLegacy);
        let exists = Boolean(data.exists);
        let attachedAgentId = Number(data.attachedAgentId || 0);

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
  }, [getReadContract]);

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
      const contract = getWriteContract();
      if (!contract) throw new Error("No signer available");

      const tx = await contract.doGM({ value: payableAmount });
      await tx.wait();
      return true;
    } catch (error) {
      const err = error as { reason?: string; message?: string };
      console.error("doGM error:", err);
      if (isMountedRef.current) setError(err.reason || err.message || "Error desconocido");
      return false;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [getWriteContract]);

  const resetToVIP = useCallback(async (): Promise<boolean> => {
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const contract = getWriteContract();
      if (!contract) throw new Error("No signer available");

      const tx = await contract.resetToVIP();
      await tx.wait();
      return true;
    } catch (error) {
      const err = error as { reason?: string; message?: string };
      console.error("resetToVIP error:", err);
      if (isMountedRef.current) setError(err.reason || err.message || "Error desconocido");
      return false;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [getWriteContract]);

  const activateNodeInstant = useCallback(async (nodeId: number, costWei: bigint): Promise<boolean> => {
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const contract = getWriteContract();
      if (!contract) throw new Error("No signer available");
      
      const tx = await contract.activateNodeInstant(nodeId, { value: costWei });
      await tx.wait();
      return true;
    } catch (error) {
      const err = error as { reason?: string; message?: string };
      console.error("activateNodeInstant error:", err);
      if (isMountedRef.current) setError(err.reason || err.message || "Error desconocido");
      return false;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [getWriteContract]);

  const activateNodeByStreak = useCallback(async (nodeId: number): Promise<boolean> => {
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const contract = getWriteContract();
      if (!contract) throw new Error("No signer available");
      
      const tx = await contract.activateNodeByStreak(nodeId, { value: CONSTANTS.BASE_GM_COST_WEI });
      await tx.wait();
      return true;
    } catch (error) {
      const err = error as { reason?: string; message?: string };
      console.error("activateNodeByStreak error:", err);
      if (isMountedRef.current) setError(err.reason || err.message || "Error desconocido");
      return false;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [getWriteContract]);

  const getNodeInstantCost = useCallback(async (nodeId: number, walletAddress: string): Promise<bigint | null> => {
    try {
      const data = await fetchUserData(walletAddress);
      const baseCost = CONSTANTS.BASE_GM_COST_WEI;
      
      if (data && data.onChainForkLevel > 1) return baseCost; // B2+ paga solo el costo base
      
      // Costo base (0.01 USDC) + costo especifico del nodo
      if (nodeId === 1) return baseCost + ethers.parseUnits("0.5", 18);
      if (nodeId === 2) return baseCost + ethers.parseUnits("1.25", 18);
      if (nodeId === 3) return baseCost + ethers.parseUnits("5", 18);
      
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
