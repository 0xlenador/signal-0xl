/**
 * network.js — Signal 0xL
 * Panel de monitoreo de la red Arc Testnet.
 * Consume Blockscout /api/v2/stats con caché y polling automático.
 */

import { fetchNetworkStats } from './blockscout.js';
import { CONSTANTS } from './config.js';
import { t, getLanguage } from './i18n.js';
import { renderIcons } from './icons.js';
import Chart from 'chart.js/auto';

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

// ─── ESTADO DE GRÁFICAS (Sparklines 2.0) ────────────────────────────────────
let _domInitialized = false;
const charts = { gas: null, blockTime: null, blocks: null, txs: null };

// Historial de valores crudos (Persistente con LocalStorage)
let history = {
  gas: new Array(20).fill(null),
  blockTime: new Array(20).fill(null),
  blocks: new Array(20).fill(null),
  txs: new Array(20).fill(null)
};

try {
  const savedHistory = localStorage.getItem('signal0xl_networkHistory');
  if (savedHistory) {
    const parsed = JSON.parse(savedHistory);
    if (parsed.gas && parsed.gas.length === 20) {
      history = parsed;
    }
  }
} catch (e) {
  console.warn('No se pudo cargar el historial de la red:', e);
}

const chartColors = {
  gas: '#00E5FF',       // Cyan Neon
  blockTime: '#FF007F', // Magenta
  blocks: '#fb923c',    // Naranja
  txs: '#00E676'        // Verde
};

function createSparkline(ctx, colorHex) {
  // Crear gradiente de fondo
  const gradient = ctx.createLinearGradient(0, 0, 0, 40);
  gradient.addColorStop(0, colorHex + '40'); // 25% opacidad
  gradient.addColorStop(1, colorHex + '00'); // Transparente

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: new Array(20).fill(''),
      datasets: [{
        data: history[Object.keys(chartColors).find(k => chartColors[k] === colorHex)] || new Array(20).fill(null),
        borderColor: colorHex,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        fill: true,
        backgroundColor: gradient
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { display: false },
        y: { 
          display: false,
          grace: '20%' // Margen dinámico arriba y abajo
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { display: false }
      },
      animation: { 
        duration: 800,
        easing: 'easeOutQuart'
      },
      layout: { padding: 0 }
    }
  });
}

function updateRawData(key, rawVal) {
  // Rellenar array si estaba vacío
  if (history[key][0] === null) {
    history[key].fill(rawVal);
  } else {
    history[key].push(rawVal);
    history[key].shift();
  }
  
  if (charts[key]) {
    charts[key].data.datasets[0].data = history[key];
    charts[key].update();
  }
  
  // Guardar en LocalStorage para persistencia
  try {
    localStorage.setItem('signal0xl_networkHistory', JSON.stringify(history));
  } catch (e) {}
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
    
    // Si es la primera vez, construimos el DOM y los Canvas
    if (!_domInitialized) {
      container.innerHTML = `
        <div class="grid grid-cols-4 gap-2 h-full network-grid">
          <!-- Gas -->
          <div class="flex items-center justify-between bg-surface-1 hover:bg-surface-2 transition-colors p-2 rounded-lg border border-border-light shadow-sm hover:shadow-glow-cyan overflow-hidden">
            <div class="flex flex-col justify-center shrink-0 min-w-[50%]">
              <div class="text-[0.55rem] text-text-muted font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 truncate" title="GAS"><i data-lucide="fuel" class="w-3.5 h-3.5"></i> <span>GAS</span></div>
              <div class="font-mono text-white text-xs font-bold flex items-center h-5 truncate"><span id="val-gas">-</span> <span class="text-[0.65rem] text-text-muted font-sans font-normal ml-1">Gwei</span></div>
            </div>
            <div class="h-8 w-full max-w-[40%] hidden md:block pl-2"><canvas id="chart-gas"></canvas></div>
          </div>
          <!-- Block Time -->
          <div class="flex items-center justify-between bg-surface-1 hover:bg-surface-2 transition-colors p-2 rounded-lg border border-border-light shadow-sm hover:shadow-glow-cyan overflow-hidden">
            <div class="flex flex-col justify-center shrink-0 min-w-[50%]">
              <div class="text-[0.55rem] text-text-muted font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 truncate" title="BLK TIME"><i data-lucide="clock" class="w-3.5 h-3.5"></i> <span>BLK TIME</span></div>
              <div class="font-mono text-white text-xs font-bold flex items-center h-5 truncate"><span id="val-blockTime">-</span> <span class="text-[0.65rem] text-text-muted font-sans font-normal ml-1">s</span></div>
            </div>
            <div class="h-8 w-full max-w-[40%] hidden md:block pl-2"><canvas id="chart-blockTime"></canvas></div>
          </div>
          <!-- Total Blocks -->
          <div class="flex items-center justify-between bg-surface-1 hover:bg-surface-2 transition-colors p-2 rounded-lg border border-border-light shadow-sm hover:shadow-glow-cyan overflow-hidden">
            <div class="flex flex-col justify-center shrink-0 min-w-[50%]">
              <div class="text-[0.55rem] text-text-muted font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 truncate" title="BLOCKS"><i data-lucide="box" class="w-3.5 h-3.5"></i> <span>BLOCKS</span></div>
              <div class="font-mono text-white text-xs font-bold flex items-center h-5 truncate"><span id="val-blocks">-</span></div>
            </div>
            <div class="h-8 w-full max-w-[40%] hidden md:block pl-2"><canvas id="chart-blocks"></canvas></div>
          </div>
          <!-- Tx Today -->
          <div class="flex items-center justify-between bg-surface-1 hover:bg-surface-2 transition-colors p-2 rounded-lg border border-border-light shadow-sm hover:shadow-glow-cyan overflow-hidden">
            <div class="flex flex-col justify-center shrink-0 min-w-[50%]">
              <div class="text-[0.55rem] text-text-muted font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 truncate" title="TXs"><i data-lucide="arrow-right-left" class="w-3.5 h-3.5"></i> <span>TXs</span></div>
              <div class="font-mono text-white text-xs font-bold flex items-center h-5 truncate"><span id="val-txs">-</span></div>
            </div>
            <div class="h-8 w-full max-w-[40%] hidden md:block pl-2"><canvas id="chart-txs"></canvas></div>
          </div>
        </div>
      `;
      
      // Inicializar Chart.js
      charts.gas = createSparkline(document.getElementById('chart-gas').getContext('2d'), chartColors.gas);
      charts.blockTime = createSparkline(document.getElementById('chart-blockTime').getContext('2d'), chartColors.blockTime);
      charts.blocks = createSparkline(document.getElementById('chart-blocks').getContext('2d'), chartColors.blocks);
      charts.txs = createSparkline(document.getElementById('chart-txs').getContext('2d'), chartColors.txs);
      
      // Renderizar iconos de Lucide
      renderIcons();
      
      _domInitialized = true;
    }

    // Actualizar Textos
    const valGas = Number(stats.gasAverage);
    const valBlockTime = Number(stats.averageBlockTime) / 1000;
    const valBlocks = Number(stats.totalBlocks);
    const valTxs = Number(stats.transactionsToday);

    const elGas = document.getElementById('val-gas');
    const elBlockTime = document.getElementById('val-blockTime');
    const elBlocks = document.getElementById('val-blocks');
    const elTxs = document.getElementById('val-txs');

    if (elGas) elGas.textContent = valGas.toFixed(2);
    if (elBlockTime) elBlockTime.textContent = valBlockTime.toFixed(2);
    if (elBlocks) elBlocks.textContent = valBlocks.toLocaleString();
    if (elTxs) elTxs.textContent = valTxs.toLocaleString();

    // Actualizar Gráficas con Datos Crudos
    updateRawData('gas', valGas);
    updateRawData('blockTime', valBlockTime);
    updateRawData('blocks', valBlocks);
    updateRawData('txs', valTxs);

  } catch (err) {
    console.error('[Network] Error al cargar stats:', err);
    if (!_domInitialized) {
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
