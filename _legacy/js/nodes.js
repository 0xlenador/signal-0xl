/**
 * nodes.js — Signal 0xL
 * Lógica de cálculo off-chain de los 3 Nodos de Análisis.
 * Los datos se obtienen de Blockscout API y el RPC nativo.
 * Los resultados son para DISPLAY; el contrato solo registra si un nodo está ACTIVO.
 */

import { CONSTANTS } from './config.js';
import { fetchAllTransactions, fetchFirstAndLastTx } from './blockscout.js';
import { getNativeBalance } from './wallet.js';
import { ethers } from 'ethers';

const { COMMITMENT_TIERS, LEGACY_MULTIPLIERS, TOTAL_SUPPLY, DECIMALS } = CONSTANTS;

// ─────────────────────────────────────────────────────────────────────────────
// NODO 1: COMPROMISO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula los datos del Nodo de Compromiso para una dirección.
 * Lee el historial completo de transacciones de Blockscout.
 *
 * @param {string} address
 * @param {Function} [onProgress] - Callback de progreso (txsFetched, pages)
 * @returns {Promise<{
 *   totalTxs: number,
 *   totalGasUsed: bigint,
 *   totalGasUsedFormatted: string,
 *   totalFeePaid: bigint,
 *   totalFeePaidFormatted: string,
 *   tier: { label: string, multiplier: number },
 *   isLoading: boolean,
 * }>}
 */
export async function calculateCommitmentNode(address, onProgress) {
  const txs = await fetchAllTransactions(address, { onProgress });

  let totalGasUsed = BigInt(0);
  let totalFeePaid = BigInt(0);

  for (const tx of txs) {
    try {
      totalGasUsed += BigInt(tx.gasUsed || '0');
      totalFeePaid += BigInt(tx.fee || '0');
    } catch {
      // Ignorar txs con valores no parseables
    }
  }

  const tier = getCommitmentTier(txs.length);

  return {
    totalTxs:               txs.length,
    totalGasUsed,
    totalGasUsedFormatted:  Number(totalGasUsed).toLocaleString(),
    totalFeePaid,
    totalFeePaidFormatted:  parseFloat(ethers.formatUnits(totalFeePaid, DECIMALS)).toFixed(6),
    tier,
  };
}

/**
 * Retorna el tier de Compromiso según el número de txs.
 * @param {number} txCount
 * @returns {{ label: string, multiplier: number }}
 */
export function getCommitmentTier(txCount) {
  for (const tier of COMMITMENT_TIERS) {
    if (txCount <= tier.maxTxs) return tier;
  }
  return COMMITMENT_TIERS[COMMITMENT_TIERS.length - 1];
}

// ─────────────────────────────────────────────────────────────────────────────
// NODO 2: CONVICCIÓN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula los datos del Nodo de Convicción.
 * Lee el balance nativo vía RPC y calcula el % vs supply hardcodeado.
 *
 * @param {string} address
 * @returns {Promise<{
 *   balanceRaw: bigint,
 *   balanceUSDC: string,
 *   percentageOfSupply: string,
 *   supplyTotal: number,
 *   tier: string,
 * }>}
 */
export async function calculateConvictionNode(address) {
  // Balance nativo via RPC (no consume créditos Blockscout)
  const balanceRaw = await getNativeBalance(address);
  const balanceUSDC = parseFloat(ethers.formatUnits(balanceRaw, DECIMALS));

  // % del supply total (supply hardcodeado: 100M USDC)
  const percentageOfSupply = (balanceUSDC / TOTAL_SUPPLY) * 100;
  const percentageStr = percentageOfSupply < 0.000001
    ? '< 0.000001'
    : percentageOfSupply.toFixed(6);

  // Tier informativo
  let tier = 'Observador';
  if (percentageOfSupply >= 1)     tier = 'Ballena 🐋';
  else if (percentageOfSupply >= 0.1) tier = 'Delfín 🐬';
  else if (percentageOfSupply >= 0.01) tier = 'Pez 🐟';
  else if (percentageOfSupply >= 0.001) tier = 'Camarón 🦐';

  return {
    balanceRaw,
    balanceUSDC:        balanceUSDC.toFixed(4),
    percentageOfSupply: percentageStr,
    supplyTotal:        TOTAL_SUPPLY,
    tier,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NODO 3: LEGADO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula los datos del Nodo de Legado.
 * Obtiene la primera y última TX de la dirección en Arc Testnet.
 *
 * @param {string} address
 * @returns {Promise<{
 *   firstTxTimestamp: Date | null,
 *   lastTxTimestamp: Date | null,
 *   firstTxHash: string,
 *   lastTxHash: string,
 *   daysActive: number,       // días entre primera y última tx
 *   daysSinceGenesis: number, // días desde primera tx hasta hoy
 *   badge: { label: string, multiplier: number },
 *   rangeDays: number,        // rango total entre primera y última
 * }>}
 */
export async function calculateLegacyNode(address) {
  const { firstTx, lastTx } = await fetchFirstAndLastTx(address);

  if (!firstTx) {
    return {
      firstTxTimestamp: null,
      lastTxTimestamp:  null,
      firstTxHash:      '',
      lastTxHash:       '',
      daysActive:       0,
      daysSinceGenesis: 0,
      badge:            { label: 'Sin historial', multiplier: 1 },
      rangeDays:        0,
    };
  }

  const firstDate = new Date(firstTx.timestamp);
  const lastDate  = new Date(lastTx.timestamp);
  const now       = new Date();

  const MS_PER_DAY = 86400_000;

  // Días desde la primera TX hasta hoy
  const daysSinceGenesis = Math.floor((now - firstDate) / MS_PER_DAY);

  // Rango activo: días entre primera y última TX
  const rangeDays = Math.floor((lastDate - firstDate) / MS_PER_DAY);

  const badge = getLegacyBadge(daysSinceGenesis);

  return {
    firstTxTimestamp: firstDate,
    lastTxTimestamp:  lastDate,
    firstTxHash:      firstTx.hash,
    lastTxHash:       lastTx.hash,
    daysActive:       rangeDays,
    daysSinceGenesis,
    badge,
    rangeDays,
  };
}

/**
 * Retorna la insignia de Legado según antigüedad de la primera TX.
 * @param {number} daysSinceGenesis - Días desde la primera TX hasta hoy
 * @returns {{ label: string, multiplier: number }}
 */
export function getLegacyBadge(daysSinceGenesis) {
  for (const entry of LEGACY_MULTIPLIERS) {
    if (daysSinceGenesis <= entry.maxDays) return entry;
  }
  return LEGACY_MULTIPLIERS[LEGACY_MULTIPLIERS.length - 1];
}

// ─────────────────────────────────────────────────────────────────────────────
// PUNTAJE ESTIMADO (off-chain, orientativo)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula el puntaje total estimado combinando los multiplicadores de los 3 nodos.
 * Este cálculo es solo orientativo; el puntaje real está on-chain.
 *
 * @param {number} basePoints - Puntos on-chain (totalPoints del contrato)
 * @param {Object} commitmentData - Resultado de calculateCommitmentNode
 * @param {Object} legacyData     - Resultado de calculateLegacyNode
 * @returns {{ estimatedPoints: number, breakdown: Object }}
 */
export function estimateTotalScore(basePoints, commitmentData, legacyData) {
  const commitmentMultiplier = commitmentData?.tier?.multiplier ?? 1;
  const legacyMultiplier     = legacyData?.badge?.multiplier   ?? 1;
  const combinedMultiplier   = commitmentMultiplier * legacyMultiplier;
  const estimatedPoints      = Math.floor(basePoints * combinedMultiplier);

  return {
    estimatedPoints,
    breakdown: {
      basePoints,
      commitmentMultiplier,
      legacyMultiplier,
      combinedMultiplier,
    },
  };
}
