import { NETWORK, HTTP_RPC_ENDPOINTS } from './config';

/**
 * RPC Engine — Intelligent endpoint management with availability probing.
 *
 * On startup, probes each HTTP RPC to determine availability (some are blocked
 * by adblockers). Subsequent reads prefer the fastest available endpoint.
 *
 * Rate limits (confirmed):
 *   rpc.testnet.arc.network       →  1 req/s  (always available)
 *   rpc.blockdaemon.testnet.arc.io → 100 req/s (blocked by adblockers)
 *   rpc.drpc.testnet.arc.io       → 100 req/s (blocked by adblockers)
 *   rpc.quicknode.testnet.arc.io  →   3 req/s  (blocked by adblockers)
 */

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

interface RpcEndpoint {
  url: string;
  rateLimit: number;
  available: boolean;
}

// Build the endpoint registry directly from the unified config
const HTTP_ENDPOINTS: RpcEndpoint[] = HTTP_RPC_ENDPOINTS.map((rpc) => ({
  url: rpc.url,
  rateLimit: rpc.rateLimit,
  // isMain is assumed always available initially, others start as unknown
  available: !!rpc.isMain,
}));

// ---------------------------------------------------------------------------
// Probe System — runs once on client startup
// ---------------------------------------------------------------------------

let probeComplete = false;

async function probeEndpoints(): Promise<void> {
  await Promise.allSettled(
    HTTP_ENDPOINTS.map(async (ep) => {
      // Main RPC is always available, skip the probe for it
      const isMain = HTTP_RPC_ENDPOINTS.find(r => r.url === ep.url)?.isMain;
      if (isMain) {
        ep.available = true;
        return;
      }

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
        console.log(`[RPC Probe] ${res.ok ? '✅' : '❌'} ${ep.url} (${ep.rateLimit} req/s)`);
      } catch {
        ep.available = false;
        console.log(`[RPC Probe] ❌ ${ep.url} (blocked or unreachable)`);
      }
    }),
  );

  probeComplete = true;
  const available = HTTP_ENDPOINTS.filter((ep) => ep.available);
  console.log(
    `[RPC Probe] Complete. ${available.length}/${HTTP_ENDPOINTS.length} endpoints available.`,
  );
}

// Fire the probe once on client-side module initialization
if (typeof window !== 'undefined') {
  void probeEndpoints();
}

// ---------------------------------------------------------------------------
// HTTP RPC Selection
// ---------------------------------------------------------------------------

/**
 * Returns the single best available HTTP RPC URL, preferring higher rate limits.
 * Falls back to the main RPC if the probe hasn't completed yet.
 */
export function getBestHttpRpc(): string {
  const mainRpcUrl = HTTP_RPC_ENDPOINTS.find(r => r.isMain)?.url || NETWORK.rpcUrls[0];
  if (!probeComplete) return mainRpcUrl;

  const best = HTTP_ENDPOINTS
    .filter((ep) => ep.available)
    .sort((a, b) => b.rateLimit - a.rateLimit);

  // Intentamos devolver el mejor gratuito. Si todos fallaron, devolvemos la API privada o el fallback final.
  return best.length > 0 ? best[0].url : (process.env.NEXT_PUBLIC_PRIVATE_RPC || mainRpcUrl);
}

/**
 * Returns all available HTTP RPCs sorted by rate limit (descending).
 * Used for fallback iteration (try fastest first, fall through to slower).
 */
export function getAvailableHttpRpcs(): string[] {
  const mainRpcUrl = HTTP_RPC_ENDPOINTS.find(r => r.isMain)?.url || NETWORK.rpcUrls[0];
  let available = [mainRpcUrl];

  if (probeComplete) {
    const sorted = HTTP_ENDPOINTS
      .filter((ep) => ep.available)
      .sort((a, b) => b.rateLimit - a.rateLimit);
    
    if (sorted.length > 0) {
      available = sorted.map((ep) => ep.url);
    }
  }

  // SIEMPRE que se invoque esta función (en cada refresh), la API Privada 
  // se coloca *al final* del array, asegurando que se intenten los gratuitos primero.
  // NOTA: Actualmente no estamos usando la API Privada.
  // Confiamos en la Wallet inyectada (window.ethereum) como salvavidas principal
  // ya que demostró ser suficiente para evadir Adblockers y CORS. 
  // Sin embargo, dejamos esta lógica intacta para cuando escalemos a miles de DAU.
  const privateRpc = process.env.NEXT_PUBLIC_PRIVATE_RPC;
  if (privateRpc && !available.includes(privateRpc)) {
    available.push(privateRpc);
  }

  return available;
}

// ---------------------------------------------------------------------------
// WebSocket RPC (unchanged — used by NetworkStats singleton)
// ---------------------------------------------------------------------------

let wsIndex = 0;

/**
 * Returns the next WebSocket RPC URL in round-robin fashion.
 */
export function getNextWsRpc(): string {
  const urls = NETWORK.wsUrls as readonly string[];
  if (!urls || urls.length === 0) return '';

  const url = urls[wsIndex];
  wsIndex = (wsIndex + 1) % urls.length;
  return url;
}

// ---------------------------------------------------------------------------
// Fetch with Fallback (unchanged — used for Blockscout RPC fallback)
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a fetch and, if it fails, retries using the next URL in the list.
 * Ideal for Blockscout fallback calls that need sequential retry logic.
 */
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
    // Delay between retries to avoid triggering rate limits on the next RPC
    await sleep(300);
  }

  throw lastError || new Error('All fallback URLs failed');
}
