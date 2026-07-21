/**
 * network.js — Signal 0xL
 * Panel de monitoreo de la red Arc Testnet.
 * Consume Blockscout /api/v2/stats con caché y polling automático.
 */

import { fetchNetworkStats } from './blockscout.js';
import { CONSTANTS } from './config.js';
import { t, getLanguage } from './i18n.js';

const { NETWORK_POLL_INTERVAL } = CONSTANTS;

let _pollingTimer = null;
let _lastContainerId = null;

// Manejo de Visibility API para pausar polling cuando la pestaña está oculta
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    stopPolling();
  } else {
    if (_lastContainerId) {
      // Al volver, intentamos renderizar (usará caché si aún es válido) y retomamos el polling
      renderNetworkStats(_lastContainerId);
      startPolling(_lastContainerId);
    }
  }
});

/**
 * Inicializa el panel de métricas de red y activa el polling.
 * @param {string} containerId - ID del elemento DOM contenedor
 */
export function initNetworkPanel(containerId) {
  _lastContainerId = containerId;
  renderNetworkStats(containerId); // Primera carga inmediata
  startPolling(containerId);
}

/**
 * Detiene el polling de métricas de red.
 */
export function stopPolling() {
  if (_pollingTimer) {
    clearInterval(_pollingTimer);
    _pollingTimer = null;
  }
}

/**
 * Inicia el polling de métricas de red.
 * @param {string} containerId
 */
export function startPolling(containerId) {
  _lastContainerId = containerId;
  stopPolling();
  _pollingTimer = setInterval(() => renderNetworkStats(containerId), NETWORK_POLL_INTERVAL);
}

/**
 * Renderiza las métricas actuales de la red.
 * @param {string} containerId
 */
export async function renderNetworkStats(containerId) {
  if (document.hidden) return; // Congelar peticiones si la pestaña está oculta
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const stats = await fetchNetworkStats();
    const blockTimeSec = (stats.averageBlockTime / 1000).toFixed(2);
    const txToday = Number(stats.transactionsToday).toLocaleString();
    const totalBlocks = Number(stats.totalBlocks).toLocaleString();
    const gasAvg = Number(stats.gasAverage).toFixed(2);
    container.innerHTML = `
      <div class="grid grid-cols-4 gap-2 h-full">
        <!-- Gas -->
        <div class="flex flex-col bg-surface-1 hover:bg-surface-2 transition-colors p-2 rounded-lg border border-border-light justify-center shadow-sm hover:shadow-glow-cyan">
          <div class="text-[0.55rem] text-text-muted font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 truncate" title="GAS"><span>⛽</span> <span>GAS</span></div>
          <div class="font-mono text-white text-xs font-bold flex items-center h-5 truncate">${gasAvg} <span class="text-[0.65rem] text-text-muted font-sans font-normal ml-1">Gwei</span></div>
        </div>
        <!-- Block Time -->
        <div class="flex flex-col bg-surface-1 hover:bg-surface-2 transition-colors p-2 rounded-lg border border-border-light justify-center shadow-sm hover:shadow-glow-cyan">
          <div class="text-[0.55rem] text-text-muted font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 truncate" title="BLK TIME"><span>⏱️</span> <span>BLK TIME</span></div>
          <div class="font-mono text-white text-xs font-bold flex items-center h-5 truncate">${blockTimeSec} <span class="text-[0.65rem] text-text-muted font-sans font-normal ml-1">s</span></div>
        </div>
        <!-- Total Blocks -->
        <div class="flex flex-col bg-surface-1 hover:bg-surface-2 transition-colors p-2 rounded-lg border border-border-light justify-center shadow-sm hover:shadow-glow-cyan">
          <div class="text-[0.55rem] text-text-muted font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 truncate" title="BLOCKS"><span>📦</span> <span>BLOCKS</span></div>
          <div class="font-mono text-white text-xs font-bold flex items-center h-5 truncate">${totalBlocks}</div>
        </div>
        <!-- Tx Today -->
        <div class="flex flex-col bg-surface-1 hover:bg-surface-2 transition-colors p-2 rounded-lg border border-border-light justify-center shadow-sm hover:shadow-glow-cyan">
          <div class="text-[0.55rem] text-text-muted font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 truncate" title="TXs"><span>🔄</span> <span>TXs</span></div>
          <div class="font-mono text-white text-xs font-bold flex items-center h-5 truncate">${txToday}</div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('[Network] Error al cargar stats:', err);
    const existing = container.querySelector('.network-grid');
    if (!existing) {
      // Solo mostrar error si no hay datos previos
      container.innerHTML = `
        <div class="flex items-center gap-2 px-4 text-accent-error text-xs">
          <span>❌ Error de red</span>
          <button id="btn-retry-network" class="underline hover:text-white">Reintentar</button>
        </div>
      `;
      document.getElementById('btn-retry-network')?.addEventListener('click', () => {
        renderNetworkStats(containerId);
      });
    }
  }
}
