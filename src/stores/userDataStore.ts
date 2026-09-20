import { create } from 'zustand';
import { createPublicClient, http, custom } from 'viem';
import { supportedChains } from '@/lib/wagmi.config';
import { EVM_NETWORKS, CONSTANTS, CONTRACT_ABI, DEFAULT_CHAIN_ID } from '@/lib/config';
import { getAvailableHttpRpcs } from '@/lib/rpcEngine';

// ---------------------------------------------------------------------------
// Types (canonical source — re-exported by hooks/index.ts)
// ---------------------------------------------------------------------------

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

interface UserDataState {
  // Core state
  userData: IUserData | null;
  walletAddress: string | null;
  chainId: number;
  isLoading: boolean;
  lastFetchedAt: number;

  // Derived values (computed from userData, no RPC needed)
  gmCost: bigint;
  debtCost: bigint;
  hasGMToday: boolean;

  // Actions
  setWallet: (address: string | null, chainId?: number) => void;
  refresh: () => Promise<IUserData | null>;
  clear: () => void;
}

// ---------------------------------------------------------------------------
// LocalStorage Cache (warm start)
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 30_000;

function getCacheKey(address: string, chainId: number): string {
  return `signal_userdata_${chainId}_${address.toLowerCase()}`;
}

function readCache(address: string, chainId: number): IUserData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getCacheKey(address, chainId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
      console.log(
        `[Store] ⚡ Warm start from cache (${Math.round((Date.now() - parsed.timestamp) / 1000)}s old)`,
      );
      return parsed.data as IUserData;
    }
  } catch { /* corrupt cache, ignore */ }
  return null;
}

function writeCache(address: string, chainId: number, data: IUserData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getCacheKey(address, chainId), JSON.stringify({ timestamp: Date.now(), data }));
  } catch { /* storage full, ignore */ }
}

export function clearCache(address: string, chainId: number): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getCacheKey(address, chainId));
}

// ---------------------------------------------------------------------------
// Derived Computations (pure math, no RPC)
// ---------------------------------------------------------------------------

function computeDerived(data: IUserData | null): {
  gmCost: bigint;
  debtCost: bigint;
  hasGMToday: boolean;
} {
  if (!data) return { gmCost: 0n, debtCost: 0n, hasGMToday: false };

  const today = Math.floor(Date.now() / 86400000);
  const fork = data.forkLevel === 0 ? 1 : data.forkLevel;
  const baseCost = CONSTANTS.BASE_GM_COST_WEI;

  // GM cost scales with fork level
  let gmCost = baseCost;
  if (fork > 1) {
    gmCost = baseCost + BigInt(fork - 1) * (baseCost / 2n);
  }

  // Debt = missed days × base cost
  let debtCost = 0n;
  if (data.lastGmDay > 0 && today > data.lastGmDay + 1) {
    const missed = BigInt(today - data.lastGmDay - 1);
    debtCost = missed * baseCost;
  }

  return { gmCost, debtCost, hasGMToday: data.lastGmDay === today };
}

/**
 * Applies local fork-level correction: if the user missed days since their
 * last GM, predict the on-chain state that would result from the next
 * interaction (fork level bump, streak reset, nodes deactivated).
 */
function applyForkPrediction(raw: IUserData): IUserData {
  const today = Math.floor(Date.now() / 86400000);
  const corrected = { ...raw };

  if (corrected.lastGmDay > 0 && today > corrected.lastGmDay + 1) {
    corrected.forkLevel += 1;
    corrected.currentStreak = 0;
    corrected.nodeCommitment = false;
    corrected.nodeConviction = false;
    corrected.nodeLegacy = false;
  }

  return corrected;
}

// ---------------------------------------------------------------------------
// Single-flight guard
// ---------------------------------------------------------------------------

let inflightPromise: Promise<IUserData | null> | null = null;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUserDataStore = create<UserDataState>((set, get) => ({
  // Initial state
  userData: null,
  walletAddress: null,
  chainId: DEFAULT_CHAIN_ID,
  isLoading: false,
  lastFetchedAt: 0,
  gmCost: 0n,
  debtCost: 0n,
  hasGMToday: false,

  setWallet: (address, chainId = DEFAULT_CHAIN_ID) => {
    const currentAddress = get().walletAddress;
    const currentChain = get().chainId;

    // Same wallet and chain — no-op
    if (address && currentAddress?.toLowerCase() === address.toLowerCase() && currentChain === chainId) return;

    // No wallet — clear everything
    if (!address) {
      get().clear();
      return;
    }

    // New wallet or chain — reset state
    set({
      userData: null,
      walletAddress: address,
      chainId,
      isLoading: true,
      lastFetchedAt: 0,
      gmCost: 0n,
      debtCost: 0n,
      hasGMToday: false,
    });

    // Try warm start from localStorage
    const cached = readCache(address, chainId);
    if (cached) {
      const derived = computeDerived(cached);
      set({ userData: cached, isLoading: false, lastFetchedAt: Date.now(), ...derived });
    }

    // Always fetch fresh data in the background
    void get().refresh();
  },

  refresh: async () => {
    const { walletAddress, chainId } = get();
    if (!walletAddress) return null;

    // Single-flight: deduplicate concurrent calls
    if (inflightPromise) {
      console.log('[Store] ♻️ Deduplicating inflight fetchUserData');
      return inflightPromise;
    }

    set({ isLoading: true });
    
    const config = EVM_NETWORKS[chainId] || EVM_NETWORKS[DEFAULT_CHAIN_ID];
    const contractAddress = config.contractAddress;
    const chainConfig = supportedChains.find(c => c.id === chainId) || supportedChains[0];

    inflightPromise = (async (): Promise<IUserData | null> => {
      // 1. Intentar leer desde la wallet inyectada (Prioridad máxima, sin rate limits)
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          console.log(`[RPC Motor] 🔄 Reading contract via: INJECTED WALLET on Chain ${chainId}`);
          const client = createPublicClient({
            chain: chainConfig,
            transport: custom((window as any).ethereum),
          });

          const data = await client.readContract({
            address: contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'users',
            args: [walletAddress as `0x${string}`],
          });

          console.log(`[RPC Motor] ✅ Success via: INJECTED WALLET`);

          const raw: IUserData = {
            totalPoints: Number(data[0]),
            lastGmDay: Number(data[1]),
            currentStreak: Number(data[2]),
            forkLevel: Number(data[3] === 0n ? 1n : data[3]),
            gmCount: Number(data[4]),
            nodeCommitment: Boolean(data[5]),
            nodeConviction: Boolean(data[6]),
            nodeLegacy: Boolean(data[7]),
            exists: Boolean(data[8]),
            attachedAgentId: Number(data[9] || 0),
            onChainForkLevel: Number(data[3] === 0n ? 1n : data[3]),
          };

          const corrected = applyForkPrediction(raw);
          const derived = computeDerived(corrected);

          writeCache(walletAddress, chainId, corrected);

          set({
            userData: corrected,
            isLoading: false,
            lastFetchedAt: Date.now(),
            ...derived,
          });

          return corrected;
        } catch (err: unknown) {
          const error = err as { shortMessage?: string; message?: string };
          console.warn(
            `[RPC Motor] ❌ Failed INJECTED WALLET: ${error.shortMessage || error.message || 'Error'}, falling back to HTTP RPCs...`
          );
        }
      }

      // 2. Fallback a HTTP RPCs iterativos (El paracaídas)
      const rpcs = getAvailableHttpRpcs(chainId);

      for (const url of rpcs) {
        try {
          console.log(`[RPC Motor] 🔄 Reading contract via: ${url} on Chain ${chainId}`);

          const client = createPublicClient({
            chain: chainConfig,
            transport: http(url),
          });

          const data = await client.readContract({
            address: contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'users',
            args: [walletAddress as `0x${string}`],
          });

          console.log(`[RPC Motor] ✅ Success via: ${url}`);

          const raw: IUserData = {
            totalPoints: Number(data[0]),
            lastGmDay: Number(data[1]),
            currentStreak: Number(data[2]),
            forkLevel: Number(data[3] === 0n ? 1n : data[3]),
            gmCount: Number(data[4]),
            nodeCommitment: Boolean(data[5]),
            nodeConviction: Boolean(data[6]),
            nodeLegacy: Boolean(data[7]),
            exists: Boolean(data[8]),
            attachedAgentId: Number(data[9] || 0),
            onChainForkLevel: Number(data[3] === 0n ? 1n : data[3]),
          };

          const corrected = applyForkPrediction(raw);
          const derived = computeDerived(corrected);

          writeCache(walletAddress, chainId, corrected);

          set({
            userData: corrected,
            isLoading: false,
            lastFetchedAt: Date.now(),
            ...derived,
          });

          return corrected;
        } catch (err: unknown) {
          const error = err as { shortMessage?: string; message?: string };
          console.warn(
            `[RPC Motor] ❌ Failed ${url}: ${error.shortMessage || error.message || 'Network Error'}`,
          );
          // Continue to next RPC
        }
      }

      // All RPCs failed
      console.error('[RPC Motor] All RPCs failed for fetchUserData');
      set({ isLoading: false });
      return null;
    })();

    try {
      return await inflightPromise;
    } finally {
      inflightPromise = null;
    }
  },

  clear: () => {
    inflightPromise = null;
    set({
      userData: null,
      walletAddress: null,
      isLoading: false,
      lastFetchedAt: 0,
      gmCost: 0n,
      debtCost: 0n,
      hasGMToday: false,
    });
  },
}));
