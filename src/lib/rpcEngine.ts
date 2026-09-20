import { EVM_NETWORKS, SUPPORTED_CHAIN_IDS, DEFAULT_CHAIN_ID, type RpcEndpoint } from './config';

/**
 * RPC Engine — Intelligent endpoint management with availability probing per chain.
 */

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

interface ProbedEndpoint extends RpcEndpoint {
  available: boolean;
}

// Registry grouped by chainId
const HTTP_ENDPOINTS: Record<number, ProbedEndpoint[]> = {};

SUPPORTED_CHAIN_IDS.forEach((chainId) => {
  HTTP_ENDPOINTS[chainId] = EVM_NETWORKS[chainId].httpRpcEndpoints.map((rpc) => ({
    ...rpc,
    available: !!rpc.isMain,
  }));
});

// ---------------------------------------------------------------------------
// Probe System — runs once on client startup
// ---------------------------------------------------------------------------

let probeComplete = false;

async function probeEndpoints(): Promise<void> {
  const allProbes: Promise<void>[] = [];

  SUPPORTED_CHAIN_IDS.forEach((chainId) => {
    HTTP_ENDPOINTS[chainId].forEach((ep) => {
      if (ep.isMain) {
        ep.available = true;
        return;
      }

      const probePromise = (async () => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000);

          const res = await fetch(ep.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
            signal: controller.signal,
          });

          clearTimeout(timeout);
          ep.available = res.ok;
          console.log(`[RPC Probe Chain ${chainId}] ${res.ok ? '✅' : '❌'} ${ep.url} (${ep.rateLimit} req/s)`);
        } catch {
          ep.available = false;
          console.log(`[RPC Probe Chain ${chainId}] ❌ ${ep.url} (blocked or unreachable)`);
        }
      })();

      allProbes.push(probePromise);
    });
  });

  await Promise.allSettled(allProbes);
  probeComplete = true;
  console.log(`[RPC Probe] Complete for all chains.`);
}

// Fire the probe once on client-side module initialization
if (typeof window !== 'undefined') {
  void probeEndpoints();
}

// ---------------------------------------------------------------------------
// HTTP RPC Selection
// ---------------------------------------------------------------------------

/**
 * Returns the single best available HTTP RPC URL for a specific chain.
 */
export function getBestHttpRpc(chainId: number = DEFAULT_CHAIN_ID): string {
  const endpoints = HTTP_ENDPOINTS[chainId] || HTTP_ENDPOINTS[DEFAULT_CHAIN_ID];
  const mainRpcUrl = endpoints.find(r => r.isMain)?.url || EVM_NETWORKS[chainId]?.rpcUrls[0] || '';
  
  if (!probeComplete) return mainRpcUrl;

  const best = endpoints
    .filter((ep) => ep.available)
    .sort((a, b) => b.rateLimit - a.rateLimit);

  return best.length > 0 ? best[0].url : (process.env.NEXT_PUBLIC_PRIVATE_RPC || mainRpcUrl);
}

/**
 * Returns all available HTTP RPCs sorted by rate limit for a specific chain.
 */
export function getAvailableHttpRpcs(chainId: number = DEFAULT_CHAIN_ID): string[] {
  const endpoints = HTTP_ENDPOINTS[chainId] || HTTP_ENDPOINTS[DEFAULT_CHAIN_ID];
  const mainRpcUrl = endpoints.find(r => r.isMain)?.url || EVM_NETWORKS[chainId]?.rpcUrls[0] || '';
  
  let available = [mainRpcUrl];

  if (probeComplete) {
    const sorted = endpoints
      .filter((ep) => ep.available)
      .sort((a, b) => b.rateLimit - a.rateLimit);
    
    if (sorted.length > 0) {
      available = sorted.map((ep) => ep.url);
    }
  }

  const privateRpc = process.env.NEXT_PUBLIC_PRIVATE_RPC;
  if (privateRpc && !available.includes(privateRpc)) {
    available.push(privateRpc);
  }

  return available;
}

// ---------------------------------------------------------------------------
// WebSocket RPC
// ---------------------------------------------------------------------------

const wsIndexes: Record<number, number> = {};

/**
 * Returns the next WebSocket RPC URL in round-robin fashion for a chain.
 */
export function getNextWsRpc(chainId: number = DEFAULT_CHAIN_ID): string {
  const config = EVM_NETWORKS[chainId];
  if (!config) return '';
  const urls = config.wsUrls as readonly string[];
  if (!urls || urls.length === 0) return '';

  if (wsIndexes[chainId] === undefined) wsIndexes[chainId] = 0;
  
  const url = urls[wsIndexes[chainId]];
  wsIndexes[chainId] = (wsIndexes[chainId] + 1) % urls.length;
  return url;
}

// ---------------------------------------------------------------------------
// Fetch with Fallback
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithFallback(
  urls: readonly string[],
  requestOptions?: RequestInit,
): Promise<Response> {
  let lastError: Error | unknown;

  for (const url of urls) {
    try {
      const response = await fetch(url, requestOptions);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`HTTP Error: ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(300);
  }

  throw lastError || new Error('All fallback URLs failed');
}
