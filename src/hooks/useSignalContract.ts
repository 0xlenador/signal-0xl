import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useWriteContract, usePublicClient, useAccount, useSwitchChain } from 'wagmi';
import { createPublicClient, custom } from 'viem';
import { supportedChains } from '@/lib/wagmi.config';
import { EVM_NETWORKS, CONTRACT_ABI, CONSTANTS, DEFAULT_CHAIN_ID } from '@/lib/config';
import { useUserDataStore, clearCache } from '@/stores/userDataStore';
import { useNodesDataStore } from '@/stores/nodesDataStore';

// Re-export IUserData from its canonical source so existing imports don't break
export type { IUserData } from '@/stores/userDataStore';

export interface ISignalContractHook {
  doGM: (payableAmount: bigint) => Promise<boolean>;
  resetToVIP: () => Promise<boolean>;
  activateNodeInstant: (nodeId: number, costWei: bigint) => Promise<boolean>;
  activateNodeByStreak: (nodeId: number) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useSignalContract(): ISignalContractHook {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { address, chain } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();

  const activeChainId = useUserDataStore((s) => s.chainId) || DEFAULT_CHAIN_ID;
  const config = EVM_NETWORKS[activeChainId] || EVM_NETWORKS[DEFAULT_CHAIN_ID];
  const contractAddress = config.contractAddress;

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const ensureChain = async () => {
    if (chain?.id !== activeChainId) {
      if (switchChainAsync) {
        await switchChainAsync({ chainId: activeChainId });
      } else {
        throw new Error("Cannot switch network automatically. Please switch it in your wallet.");
      }
    }
  };

  /**
   * Shared post-transaction handler: waits for the receipt, then refreshes
   * the central stores so all components reactively update via Zustand.
   * Replaces the old pattern of dispatching 'signal-data-refresh' events.
   */
  const handlePostTransaction = useCallback(
    async (hash: `0x${string}`, delayMs = 2000) => {
      // 1. Wait for the transaction to be mined using the Injected Wallet if possible
      // Esto previene que waitForTransactionReceipt se quede pegado si los RPC públicos
      // están bloqueados por un Adblocker.
      let receiptFound = false;
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const chainConfig = supportedChains.find(c => c.id === activeChainId) || supportedChains[0];
          const injectedClient = createPublicClient({
            chain: chainConfig,
            transport: custom((window as any).ethereum),
          });
          await injectedClient.waitForTransactionReceipt({ hash });
          receiptFound = true;
        } catch (err) {
          console.warn('[Tx Waiter] Injected wallet failed to get receipt, falling back to public RPC...');
        }
      }

      if (!receiptFound) {
        await publicClient!.waitForTransactionReceipt({ hash });
      }

      // Give the RPC time to index the new state
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      // Invalidate the localStorage cache for this wallet
      if (address) {
        clearCache(address, activeChainId);
      }

      // Refresh the central user data store (single RPC call, deduped)
      await useUserDataStore.getState().refresh();

      // Refresh nodes data (skips if still fresh within 60s TTL)
      if (address) {
        void useNodesDataStore.getState().refresh(address, activeChainId);
      }
    },
    [publicClient, address, activeChainId],
  );

  const doGM = useCallback(
    async (payableAmount: bigint): Promise<boolean> => {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }
      try {
        await ensureChain();
        const hash = await writeContractAsync({
          chainId: activeChainId,
          address: contractAddress as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'doGM',
          value: payableAmount,
        });
        await handlePostTransaction(hash);
        return true;
      } catch (error) {
        const err = error as { shortMessage?: string; message?: string };
        console.warn('doGM transaction failed/rejected:', err.shortMessage || err.message);
        if (isMountedRef.current)
          setError(err.shortMessage || err.message || 'Unknown error');
        return false;
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    },
    [writeContractAsync, handlePostTransaction, contractAddress],
  );

  const resetToVIP = useCallback(async (): Promise<boolean> => {
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
    try {
      await ensureChain();
      const hash = await writeContractAsync({
        chainId: activeChainId,
        address: contractAddress as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'resetToVIP',
      });
      await handlePostTransaction(hash);
      return true;
    } catch (error) {
      const err = error as { shortMessage?: string; message?: string };
      console.warn('resetToVIP transaction failed/rejected:', err.shortMessage || err.message);
      if (isMountedRef.current)
        setError(err.shortMessage || err.message || 'Unknown error');
      return false;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [writeContractAsync, handlePostTransaction, contractAddress]);

  const activateNodeInstant = useCallback(
    async (nodeId: number, costWei: bigint): Promise<boolean> => {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }
      try {
        await ensureChain();
        const hash = await writeContractAsync({
          chainId: activeChainId,
          address: contractAddress as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'activateNodeInstant',
          args: [nodeId],
          value: costWei,
        });
        await handlePostTransaction(hash, 2500);
        return true;
      } catch (error) {
        const err = error as { shortMessage?: string; message?: string };
        console.warn(
          'activateNodeInstant transaction failed/rejected:',
          err.shortMessage || err.message,
        );
        if (isMountedRef.current)
          setError(err.shortMessage || err.message || 'Unknown error');
        return false;
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    },
    [writeContractAsync, handlePostTransaction, contractAddress],
  );

  const activateNodeByStreak = useCallback(
    async (nodeId: number): Promise<boolean> => {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }
      try {
        await ensureChain();
        const hash = await writeContractAsync({
          chainId: activeChainId,
          address: contractAddress as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'activateNodeByStreak',
          args: [nodeId],
          value: CONSTANTS.BASE_GM_COST_WEI,
        });
        await handlePostTransaction(hash, 2500);
        return true;
      } catch (error) {
        const err = error as { shortMessage?: string; message?: string };
        console.warn(
          'activateNodeByStreak transaction failed/rejected:',
          err.shortMessage || err.message,
        );
        if (isMountedRef.current)
          setError(err.shortMessage || err.message || 'Unknown error');
        return false;
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    },
    [writeContractAsync, handlePostTransaction, contractAddress],
  );

  return {
    doGM,
    resetToVIP,
    activateNodeInstant,
    activateNodeByStreak,
    loading,
    error,
  };
}
