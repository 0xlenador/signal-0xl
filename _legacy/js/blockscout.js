/**
 * blockscout.js — Signal 0xL
 * Cliente HTTP para Blockscout PRO API v2 con caché integrado.
 * Maneja paginación keyset automática y presupuesto de créditos.
 *
 * Créditos consumidos (plan Free: 100K/día):
 *  - fetchNetworkStats()         → 1 request = 20 créditos
 *  - fetchAllTransactions(addr)  → ~1 request por 50 txs = 20 créditos/pág
 */

import { BLOCKSCOUT, CONSTANTS } from './config.js';
import { Cache } from './cache.js';

const { baseUrl, apiKey } = BLOCKSCOUT;
const { CACHE_TTL } = CONSTANTS;

// ─── Función base de fetch ─────────────────────────────────────────────────

/**
 * Realiza un GET a la Blockscout API con la API key.
 * @param {string} endpoint - Ruta relativa (ej: '/stats')
 * @param {Object} [params={}] - Query params adicionales
 * @returns {Promise<Object>} JSON de respuesta
 */
async function apiGet(endpoint, params = {}) {
  const url = new URL(`${baseUrl}${endpoint}`);
  url.searchParams.set('apikey', apiKey);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Blockscout API error ${response.status}: ${text.slice(0, 200)}`);
  }

  return response.json();
}

// ─── Funciones públicas ────────────────────────────────────────────────────

/**
 * Obtiene estadísticas generales de la red Arc Testnet.
 * TTL caché: 2 minutos.
 * @returns {Promise<{
 *   averageBlockTime: number,  // en ms
 *   gasAverage: number,        // Gwei
 *   gasSlow: number,
 *   gasFast: number,
 *   totalBlocks: string,
 *   totalTransactions: string,
 *   gasUsedToday: string,
 *   transactionsToday: string,
 *   networkUtilization: number
 * }>}
 */
export async function fetchNetworkStats() {
  const cacheKey = 'network_stats';
  const cached = Cache.get(cacheKey);
  if (cached) return cached;

  const raw = await apiGet('/stats');

  const result = {
    averageBlockTime:   raw.average_block_time ?? 0,          // ms
    gasAverage:         raw.gas_prices?.average ?? 0,
    gasSlow:            raw.gas_prices?.slow ?? 0,
    gasFast:            raw.gas_prices?.fast ?? 0,
    totalBlocks:        raw.total_blocks ?? '0',
    totalTransactions:  raw.total_transactions ?? '0',
    gasUsedToday:       raw.gas_used_today ?? '0',
    transactionsToday:  raw.transactions_today ?? '0',
    networkUtilization: raw.network_utilization_percentage ?? 0,
  };

  Cache.set(cacheKey, result, CACHE_TTL.STATS);
  return result;
}



/**
 * Obtiene TODAS las transacciones de una dirección paginando automáticamente.
 * Usa paginación keyset de Blockscout (cursor-based).
 * TTL caché: 1 hora (los datos históricos no cambian).
 *
 * ⚠️ Presupuesto: ~20 créditos por página de 50 txs.
 *   Una wallet con 500 txs = 10 páginas = 200 créditos.
 *
 * @param {string} address - Dirección Ethereum
 * @param {Object} [options]
 * @param {Function} [options.onProgress] - Callback (txsFetched, pageCount)
 * @returns {Promise<Array<{
 *   hash: string,
 *   timestamp: string,     // ISO 8601
 *   gasUsed: string,       // en unidades de gas
 *   gasPrice: string,      // en wei
 *   fee: string,           // en wei (gasUsed * gasPrice)
 *   blockNumber: number,
 *   status: string,        // 'ok' | 'error'
 * }>>}
 */
export async function fetchAllTransactions(address, options = {}) {
  const cacheKey = `txs_${address.toLowerCase()}`;
  const cached = Cache.get(cacheKey);
  if (cached) return cached;

  const { onProgress } = options;
  const allTxs = [];
  let pageParams = null;
  let pageCount = 0;
  const MAX_PAGES = 200; // Límite de seguridad: 200 páginas × 50 txs = 10K txs máximo

  do {
    const params = {};
    if (pageParams) {
      // Cursor de paginación keyset de Blockscout
      if (pageParams.block_number !== undefined) params.block_number = pageParams.block_number;
      if (pageParams.index       !== undefined) params.index       = pageParams.index;
      if (pageParams.items_count !== undefined) params.items_count = pageParams.items_count;
    }

    const data = await apiGet(`/addresses/${address}/transactions`, params);
    pageCount++;

    const items = data.items || [];
    for (const tx of items) {
      allTxs.push(_normalizeTx(tx));
    }

    if (onProgress) onProgress(allTxs.length, pageCount);

    pageParams = data.next_page_params || null;

    // Rate limit: evitar superar 5 RPS (esperar 220ms entre páginas)
    if (pageParams) await _sleep(220);

  } while (pageParams && pageCount < MAX_PAGES);

  Cache.set(cacheKey, allTxs, CACHE_TTL.TXS);
  return allTxs;
}

/**
 * Obtiene únicamente la PRIMERA y la ÚLTIMA transacción de una dirección.
 * Optimizado: solo lee la primera página (última tx) y la última página (primera tx).
 * Consume 20–40 créditos en lugar de hacer paginación completa si ya hay caché de txs.
 *
 * @param {string} address
 * @returns {Promise<{firstTx: Object|null, lastTx: Object|null}>}
 */
export async function fetchFirstAndLastTx(address) {
  // Si ya tenemos todas las txs cacheadas, usarlas
  const allTxs = Cache.get(`txs_${address.toLowerCase()}`);
  if (allTxs && allTxs.length > 0) {
    return {
      firstTx: allTxs[allTxs.length - 1], // La más antigua (último elemento)
      lastTx:  allTxs[0],                  // La más reciente (primer elemento)
    };
  }

  // Obtener solo primera página (tx más reciente) y última (tx más antigua)
  const firstPage = await apiGet(`/addresses/${address}/transactions`);
  const items = firstPage.items || [];

  if (items.length === 0) return { firstTx: null, lastTx: null };

  const lastTx = _normalizeTx(items[0]);

  // Si no hay next_page, la primera página también tiene la más antigua
  if (!firstPage.next_page_params) {
    return {
      firstTx: _normalizeTx(items[items.length - 1]),
      lastTx,
    };
  }

  // Navegar hasta la última página para obtener la tx más antigua
  let pageParams = firstPage.next_page_params;
  let prevPageParams = pageParams;
  let lastPageItems = items;
  const MAX_NAV = 200;
  let nav = 0;

  // Avanzar hasta el final
  while (pageParams && nav < MAX_NAV) {
    const params = {
      block_number: pageParams.block_number,
      index: pageParams.index,
      items_count: pageParams.items_count,
    };
    const page = await apiGet(`/addresses/${address}/transactions`, params);
    const pageItems = page.items || [];
    if (pageItems.length > 0) lastPageItems = pageItems;
    prevPageParams = pageParams;
    pageParams = page.next_page_params || null;
    nav++;
    if (pageParams) await _sleep(220);
  }

  return {
    firstTx: _normalizeTx(lastPageItems[lastPageItems.length - 1]),
    lastTx,
  };
}

/**
 * Obtiene todos los tokens (ERC20/ERC721/ERC1155) de una dirección.
 * @param {string} address
 * @returns {Promise<Array<Object>>}
 */
export async function fetchUserTokens(address) {
  try {
    const data = await apiGet(`/addresses/${address}/tokens`);
    return data.items || [];
  } catch (err) {
    console.error("[fetchUserTokens] Error obteniendo tokens:", err);
    return [];
  }
}

// ─── Helpers internos ──────────────────────────────────────────────────────

/** Normaliza una TX de la API a un objeto uniforme. */
function _normalizeTx(tx) {
  // Blockscout v9+ usa sufijo _hash para direcciones
  return {
    hash:        tx.hash,
    timestamp:   tx.timestamp,
    gasUsed:     String(tx.gas_used ?? tx.gasUsed ?? '0'),
    gasPrice:    String(tx.gas_price ?? tx.gasPrice ?? '0'),
    fee:         _extractFee(tx),
    blockNumber: Number(tx.block_number ?? tx.block ?? 0),
    status:      tx.status ?? 'ok',
    from:        tx.from?.hash ?? tx.from_address_hash ?? tx.from ?? '',
    to:          tx.to?.hash   ?? tx.to_address_hash   ?? tx.to   ?? '',
  };
}

/** Extrae el fee de una TX (puede ser objeto o string en la API). */
function _extractFee(tx) {
  if (!tx.fee) return '0';
  if (typeof tx.fee === 'object') return String(tx.fee.value ?? '0');
  return String(tx.fee);
}

function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
