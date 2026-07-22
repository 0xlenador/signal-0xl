import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/components/Web3Provider';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CONSTANTS, NETWORK } from '@/lib/config';

const staticNetwork = ethers.Network.from({
  chainId: NETWORK.chainId,
  name: NETWORK.name
});

let _publicProvider = null;
function getPublicProvider() {
  if (!_publicProvider) {
    _publicProvider = new ethers.JsonRpcProvider(NETWORK.rpcUrls[0], staticNetwork, {
      staticNetwork: staticNetwork
    });
  }
  return _publicProvider;
}

async function withRetry(fn, retries = 3, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

export function useSignalContract() {
  const { provider, signer } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getReadContract = useCallback(() => {
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, getPublicProvider());
  }, []);

  const getWriteContract = useCallback(() => {
    if (!signer) return null;
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }, [signer]);

  const fetchUserData = useCallback(async (walletAddress) => {
    if (!walletAddress) return null;
    try {
      return await withRetry(async () => {
        const contract = getReadContract();
        const data = await contract.users(walletAddress);
        return {
          totalPoints: Number(data.totalPoints),
          lastGmDay: Number(data.lastGmDay),
          currentStreak: Number(data.currentStreak),
          forkLevel: Number(data.forkLevel),
          gmCount: Number(data.gmCount),
          nodeCommitment: data.nodeCommitment,
          nodeConviction: data.nodeConviction,
          nodeLegacy: data.nodeLegacy,
          exists: data.exists,
          attachedAgentId: 0 // Hardcoded a 0 por compatibilidad con contrato actual de 9 campos
        };
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
      return null;
    }
  }, [getReadContract]);

  const getGMCost = useCallback(async (walletAddress, preloadedData = null) => {
    if (!walletAddress) return null;
    try {
      // Computar localmente usando la lógica original de la Biblia
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

  const hasGMToday = useCallback(async (walletAddress, preloadedData = null) => {
    if (!walletAddress) return false;
    try {
      // Computar localmente
      const data = preloadedData || await fetchUserData(walletAddress);
      if (!data || !data.exists) return false;
      const today = Math.floor(Date.now() / 86400000);
      return data.lastGmDay === today;
    } catch (err) {
      console.error("Error checking GM today:", err);
      return false;
    }
  }, [fetchUserData]);

  const doGM = useCallback(async (payableAmount) => {
    setLoading(true);
    setError(null);
    try {
      const contract = getWriteContract();
      if (!contract) throw new Error("No signer available");

      const tx = await contract.doGM({ value: payableAmount });
      await tx.wait();
      return true;
    } catch (err) {
      console.error("doGM error:", err);
      setError(err.reason || err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [getWriteContract]);

  return {
    fetchUserData,
    getGMCost,
    hasGMToday,
    doGM,
    loading,
    error
  };
}
