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
          attachedAgentId: Number(data.attachedAgentId)
        };
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
      return null;
    }
  }, [getReadContract]);

  const getGMCost = useCallback(async (walletAddress) => {
    if (!walletAddress) return null;
    try {
      return await withRetry(async () => {
        const contract = getReadContract();
        const result = await contract.getGMCost(walletAddress);
        return {
          gmCost: result.gmCost,
          debtCost: result.debtCost
        };
      });
    } catch (err) {
      console.error("Error fetching GM cost:", err);
      return null;
    }
  }, [getReadContract]);

  const hasGMToday = useCallback(async (walletAddress) => {
    if (!walletAddress) return false;
    try {
      return await withRetry(async () => {
        const contract = getReadContract();
        return await contract.hasGMToday(walletAddress);
      });
    } catch (err) {
      console.error("Error checking GM today:", err);
      return false;
    }
  }, [getReadContract]);

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
