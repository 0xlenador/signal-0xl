import { create } from 'zustand';
import { formatUnits } from 'viem';
import { BLOCKSCOUT, CONSTANTS, NETWORK } from '@/lib/config';
import { fetchWithFallback } from '@/lib/rpcEngine';

// ---------------------------------------------------------------------------
// Types (canonical source — re-exported by hooks/index.ts)
// ---------------------------------------------------------------------------

export interface ICommitmentNode {
  totalTxs: number;
  totalFeePaid: string | null;
  tier: string;
  multiplier: number;
}

export interface IConvictionNode {
  balanceUSDC: string;
  percentageOfSupply: string;
  supplyTotal: number;
  tier: string;
}

export interface ILegacyNode {
  firstTxDate: Date | null;
  lastTxDate: Date | null;
  daysSinceGenesis: number;
  tier: string;
}

interface NodesDataState {
  commitment: ICommitmentNode | null;
  conviction: IConvictionNode | null;
  legacy: ILegacyNode | null;
  isLoading: boolean;
  lastFetchedAt: number;
  walletAddress: string | null;

  fetchNodes: (address: string) => Promise<void>;
  refresh: (address: string) => Promise<void>;
  clear: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 60_000; // 60 seconds — Blockscout data rarely changes
const SERIAL_DELAY_MS = 200; // Delay between sequential Blockscout requests

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Single-flight guard
// ---------------------------------------------------------------------------

let inflightPromise: Promise<void> | null = null;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useNodesDataStore = create<NodesDataState>((set, get) => ({
  commitment: null,
  conviction: null,
  legacy: null,
  isLoading: false,
  lastFetchedAt: 0,
  walletAddress: null,

  fetchNodes: async (address: string) => {
    // Single-flight: deduplicate concurrent calls
    if (inflightPromise) return inflightPromise;

    set({ isLoading: true, walletAddress: address });

    inflightPromise = (async () => {
      try {
        const classicApiUrl = BLOCKSCOUT.baseUrl.replace('/api/v2', '/api');

        // Serialized Blockscout requests with delays to avoid saturating the indexer
        const addressRes = await fetch(`${BLOCKSCOUT.baseUrl}/addresses/${address}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        await sleep(SERIAL_DELAY_MS);

        const countersRes = await fetch(`${BLOCKSCOUT.baseUrl}/addresses/${address}/counters`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        await sleep(SERIAL_DELAY_MS);

        const firstTxRes = await fetch(
          `${classicApiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc`,
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        await sleep(SERIAL_DELAY_MS);

        const lastTxRes = await fetch(
          `${classicApiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1&sort=desc`,
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        // RPC fallback if Blockscout failed
        let rpcBalance = '0';
        let rpcNonce = 0;
        if (!addressRes || !countersRes) {
          try {
            const balRes = await fetchWithFallback(NETWORK.rpcUrls, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_getBalance',
                params: [address, 'latest'],
              }),
            }).then((r) => r.json());

            await sleep(300);

            const nonceRes = await fetchWithFallback(NETWORK.rpcUrls, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 2,
                method: 'eth_getTransactionCount',
                params: [address, 'latest'],
              }),
            }).then((r) => r.json());

            rpcBalance = balRes.result ? BigInt(balRes.result).toString() : '0';
            rpcNonce = nonceRes.result ? parseInt(nonceRes.result, 16) : 0;
          } catch {
            /* ignore fallback errors */
          }
        }

        // --- COMMITMENT NODE ---
        const totalTxs = countersRes?.transactions_count ?? rpcNonce;

        let commitmentTier = 'Beginner';
        let cMultiplier = 1;
        if (totalTxs >= 100) {
          commitmentTier = 'Degen';
          cMultiplier = 3;
        } else if (totalTxs >= 50) {
          commitmentTier = 'Active';
          cMultiplier = 2;
        } else if (totalTxs >= 10) {
          commitmentTier = 'Explorer';
          cMultiplier = 1.5;
        }

        const commitment: ICommitmentNode = {
          totalTxs,
          totalFeePaid: null, // Future: extract from API when available
          tier: commitmentTier,
          multiplier: cMultiplier,
        };

        // --- CONVICTION NODE ---
        const balanceStr = addressRes?.coin_balance ?? rpcBalance;
        const balanceUSDC = parseFloat(formatUnits(BigInt(balanceStr), CONSTANTS.DECIMALS));

        const percentageOfSupply = (balanceUSDC / CONSTANTS.TOTAL_SUPPLY) * 100;
        let convictionTier = 'Observer';
        if (percentageOfSupply >= 1) convictionTier = 'Whale';
        else if (percentageOfSupply >= 0.1) convictionTier = 'Investor';
        else if (percentageOfSupply >= 0.01) convictionTier = 'Holder';

        const conviction: IConvictionNode = {
          balanceUSDC: balanceUSDC.toFixed(4),
          percentageOfSupply: percentageOfSupply.toFixed(6),
          supplyTotal: CONSTANTS.TOTAL_SUPPLY,
          tier: convictionTier,
        };

        // --- LEGACY NODE ---
        let firstTxDate: Date | null = null;
        let lastTxDate: Date | null = null;
        let daysSinceGenesis = 0;
        let legacyBadge = 'Newbie';

        if (firstTxRes?.status === '1' && firstTxRes.result?.length > 0) {
          firstTxDate = new Date(parseInt(firstTxRes.result[0].timeStamp) * 1000);
        }

        if (lastTxRes?.status === '1' && lastTxRes.result?.length > 0) {
          lastTxDate = new Date(parseInt(lastTxRes.result[0].timeStamp) * 1000);
        }

        if (firstTxDate) {
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - firstTxDate.getTime());
          daysSinceGenesis = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        if (daysSinceGenesis >= 365) legacyBadge = 'OG (1 Year+)';
        else if (daysSinceGenesis >= 30) legacyBadge = 'Early Adopter';
        else if (daysSinceGenesis >= 7) legacyBadge = 'Founder (Week 1)';

        const legacy: ILegacyNode = {
          firstTxDate,
          lastTxDate,
          daysSinceGenesis,
          tier: legacyBadge,
        };

        set({
          commitment,
          conviction,
          legacy,
          isLoading: false,
          lastFetchedAt: Date.now(),
        });
      } catch (error) {
        console.error('Error fetching nodes data:', error);
        set({ isLoading: false });
      } finally {
        inflightPromise = null;
      }
    })();

    return inflightPromise;
  },

  refresh: async (address: string) => {
    const { lastFetchedAt, walletAddress } = get();

    // Different wallet: clear stale data and fetch
    if (walletAddress !== address) {
      set({ commitment: null, conviction: null, legacy: null, walletAddress: address });
      return get().fetchNodes(address);
    }

    // Same wallet, fresh data: skip
    if (Date.now() - lastFetchedAt < CACHE_TTL_MS) {
      return;
    }

    // Same wallet, stale data: refetch
    return get().fetchNodes(address);
  },

  clear: () => {
    inflightPromise = null;
    set({
      commitment: null,
      conviction: null,
      legacy: null,
      isLoading: false,
      lastFetchedAt: 0,
      walletAddress: null,
    });
  },
}));
