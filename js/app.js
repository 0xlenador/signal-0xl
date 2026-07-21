/**
 * app.js — Signal 0xL
 * Orquestador principal de la dApp.
 * Conecta todos los módulos, maneja la UI y los eventos del usuario.
 */

import { NETWORK, CONSTANTS } from './config.js';
import {
  connectWallet, disconnectWallet, getAddress, isConnected,
  hasInjectedProvider, shortAddress, on as onWallet
} from './wallet.js';
import {
  getUserData, getGMCost, getNodeInstantCost, canActivateByStreak,
  hasGMToday, hasRunestone, doGM, activateNodeInstant, activateNodeByStreak,
  resetToVIP, parseContractError, weiToUSDC, resetContract, attachAgent,
  fetchUserAgents, loadUserDashboardData
} from './contract.js';
import {
  calculateCommitmentNode, calculateConvictionNode, calculateLegacyNode
} from './nodes.js';
import { renderRanking } from './ranking.js';
import { initNetworkPanel, stopPolling, renderNetworkStats } from './network.js';
import { Cache } from './cache.js';
import { initAppKit, depositFromBase, depositFromArb, spendToArc } from './app-kit.js';
import { initI18n, setLanguage, getLanguage, t } from './i18n.js';

// ─── Estado global de la UI ───────────────────────────────────────────────

let appState = {
  address:       null,
  userData:      null,
  gmCost:        null,
  gmDoneToday:   false,
  commitmentData: null,
  convictionData: null,
  legacyData:    null,
};

// ─── Init ─────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  initI18n();
  setupWalletListeners();
  setupGlobalButtons();
  // Cargar datos iniciales
  renderRanking('ranking-container', null, null);

  // Si hay provider inyectado, intentar reconectar silenciosamente (con un pequeño delay por latencia de inyección)
  if (hasInjectedProvider()) {
    setTimeout(silentReconnect, 100);
  }

  // Inicializar panel de red siempre (no requiere wallet)
  initNetworkPanel('dashboard-network-stats');

  // Auto-refresh del ranking cada 30 segundos en background
  setInterval(() => {
    if (document.hidden) return; // Congelar peticiones si la pestaña está minimizada/oculta
    // Solo recargar si la pestaña de ranking esta visible o si queremos que este fresco cuando entren
    Cache.invalidatePrefix('ranking_cf');
    renderRanking('ranking-container', appState.address, appState.userData);
  }, 30000);

  // Reanudar peticiones al instante al volver a la pestaña (Page Visibility API)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      Cache.invalidatePrefix('ranking_cf');
      renderRanking('ranking-container', appState.address, appState.userData);
      // Refrescar el estado de la red
      renderNetworkStats('navbar-network-stats');
    }
  });
});

// ─── Reconexión silenciosa ─────────────────────────────────────────────────

async function silentReconnect() {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts && accounts.length > 0) {
      await connectWallet();
    }
  } catch (err) {
    console.warn('[App] Reconexión silenciosa falló:', err);
  }
}

// ─── Navegación removida (One-Page Dashboard) ────────────────────────────────
// ─── Wallet ────────────────────────────────────────────────────────────────

function setupWalletListeners() {
  onWallet('connected', ({ address }) => {
    appState.address = address;
    updateWalletUI(address);
    loadUserData();
  });

  onWallet('accountChanged', ({ address }) => {
    appState.address = address;
    resetContract();
    Cache.invalidatePrefix('ranking');
    updateWalletUI(address);
    loadUserData();
  });

  onWallet('disconnected', () => {
    appState.address = null;
    appState.userData = null;
    resetContract();
    updateWalletUI(null);
    renderDisconnectedState();
  });

  onWallet('wrongNetwork', () => {
    showToast(`⚠️ ${t('js.error')} Arc Testnet.`, 'warning');
  });
}

function setupGlobalButtons() {
  // Custom Language Switcher
  const langOptions = document.querySelectorAll('.custom-lang-option');
  if (langOptions.length > 0) {
    const updateDisplay = () => {
      const disp = document.getElementById('lang-display');
      const currentLang = getLanguage();
      if (disp) {
        disp.textContent = currentLang === 'en' ? '🇺🇸 EN' : '🇪🇸 ES';
      }
    };
    updateDisplay();

    langOptions.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = e.currentTarget.getAttribute('data-value');
        setLanguage(lang);
        updateDisplay();
        
        // Volver al menu principal automáticamente
        const viewMain = document.getElementById('dropdown-view-main');
        const viewLang = document.getElementById('dropdown-view-lang');
        if (viewMain && viewLang) {
          viewLang.classList.add('hidden');
          viewMain.classList.remove('hidden');
        }
      });
    });

    // Lógica para alternar vistas del dropdown
    const btnOpenLang = document.getElementById('btn-open-lang');
    const btnBackMain = document.getElementById('btn-back-main');
    const viewMain = document.getElementById('dropdown-view-main');
    const viewLang = document.getElementById('dropdown-view-lang');

    if (btnOpenLang && btnBackMain && viewMain && viewLang) {
      btnOpenLang.addEventListener('click', (e) => {
        e.stopPropagation();
        viewMain.classList.add('hidden');
        viewLang.classList.remove('hidden');
      });
      btnBackMain.addEventListener('click', (e) => {
        e.stopPropagation();
        viewLang.classList.add('hidden');
        viewMain.classList.remove('hidden');
      });
    }
  }
  // Botón conectar wallet
  document.getElementById('btn-connect-wallet')?.addEventListener('click', handleConnect);
  document.getElementById('btn-connect-wallet-hero')?.addEventListener('click', handleConnect);

  // Botón desconectar wallet
  document.getElementById('btn-disconnect-wallet')?.addEventListener('click', () => {
    disconnectWallet();
    document.getElementById('wallet-dropdown')?.classList.add('hidden');
  });

  // Ocultar dropdown al hacer click fuera
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('wallet-dropdown');
    const btnConnect = document.getElementById('btn-connect-wallet');
    if (dropdown && !dropdown.classList.contains('hidden')) {
      if (e.target !== btnConnect && !btnConnect.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
        
        // Resetear vista al cerrar
        const viewMain = document.getElementById('dropdown-view-main');
        const viewLang = document.getElementById('dropdown-view-lang');
        if (viewMain && viewLang) {
          viewLang.classList.add('hidden');
          viewMain.classList.remove('hidden');
        }
      }
    }
  });

  // Botón GM
  document.getElementById('btn-gm')?.addEventListener('click', handleGM);

  // Botones de nodos
  document.getElementById('btn-node1-instant')?.addEventListener('click', () => handleNodeInstant(1));
  document.getElementById('btn-node2-instant')?.addEventListener('click', () => handleNodeInstant(2));
  document.getElementById('btn-node3-instant')?.addEventListener('click', () => handleNodeInstant(3));
  document.getElementById('btn-node1-streak')?.addEventListener('click', () => handleNodeByStreak(1));
  document.getElementById('btn-node2-streak')?.addEventListener('click', () => handleNodeByStreak(2));
  document.getElementById('btn-node3-streak')?.addEventListener('click', () => handleNodeByStreak(3));

  // Botón reset a VIP
  document.getElementById('btn-reset-vip')?.addEventListener('click', handleResetVIP);

  // Botones de App Kit eliminados (Unified Balance)
}

// ─── Conexión Wallet ───────────────────────────────────────────────────────

async function handleConnect() {
  if (appState.address) {
    // Si ya está conectado, alterna el dropdown de desconexión
    const dropdown = document.getElementById('wallet-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
    return;
  }

  if (!hasInjectedProvider()) {
    showToast('❌ MetaMask no detectado. Instálalo en metamask.io', 'error');
    return;
  }

  setButtonLoading('btn-connect-wallet', true, 'Conectando...');
  setButtonLoading('btn-connect-wallet-hero', true, 'Conectando...');

  try {
    await connectWallet();
    showToast('✅ Wallet conectada a Arc Testnet', 'success');
  } catch (err) {
    showToast(`❌ ${err.message}`, 'error');
  } finally {
    const address = getAddress();
    if (address) {
      const hexColor = address.substring(2, 8) || '00e5ff';
      const btnHtml = `
        <img src="https://api.dicebear.com/7.x/identicon/svg?seed=${address}&backgroundColor=${hexColor}" alt="Avatar" class="w-4 h-4 rounded-full shadow-[0_0_5px_rgba(0,229,255,0.5)] border border-accent-primary/50">
        <span>${shortAddress(address)}</span>
      `;
      setButtonLoading('btn-connect-wallet', false, btnHtml);
      setButtonLoading('btn-connect-wallet-hero', false, '🔗 Conectar Wallet');
    } else {
      setButtonLoading('btn-connect-wallet', false, '🔗 Conectar');
      setButtonLoading('btn-connect-wallet-hero', false, '🔗 Conectar Wallet');
    }
  }
}

function updateWalletUI(address) {
  const statusEl  = document.getElementById('wallet-status');
  const heroEl    = document.getElementById('hero-connect-section');
  const mainEl    = document.getElementById('main-app-section');
  const btnConnect = document.getElementById('btn-connect-wallet');
  const networkBadge = document.getElementById('navbar-network-badge');

  if (address) {
    if (btnConnect) {
      const hexColor = address.substring(2, 8) || '00e5ff';
      btnConnect.removeAttribute('data-i18n'); // Proteger de traducciones
      btnConnect.innerHTML = `
        <img src="https://api.dicebear.com/7.x/identicon/svg?seed=${address}&backgroundColor=${hexColor}" alt="Avatar" class="w-4 h-4 rounded-full shadow-[0_0_5px_rgba(0,229,255,0.5)] border border-accent-primary/50">
        <span>${shortAddress(address)}</span>
      `;
      btnConnect.classList.remove('bg-accent-primary', 'hover:bg-accent-primary-dim', 'text-bg-primary', 'shadow-glow-cyan');
      btnConnect.classList.add('bg-surface-1', 'border', 'border-border-light', 'text-text-primary', 'hover:bg-surface-2');
    }
    if (networkBadge) networkBadge.classList.remove('hidden');
    if (networkBadge) networkBadge.classList.add('flex');
    if (statusEl) statusEl.classList.add('connected');
    if (heroEl)   heroEl.classList.add('hidden');
    if (mainEl)   mainEl.classList.remove('hidden');
    // Cargar datos de las demás secciones automáticamente
    loadNodesData();
    renderRanking('ranking-container', address, appState.userData);
  } else {
    if (btnConnect) {
      btnConnect.setAttribute('data-i18n', 'header.connect');
      btnConnect.textContent = t('header.connect');
      btnConnect.classList.remove('bg-surface-1', 'border', 'border-border-light', 'text-text-primary', 'hover:bg-surface-2');
      btnConnect.classList.add('bg-accent-primary', 'hover:bg-accent-primary-dim', 'text-bg-primary', 'shadow-glow-cyan');
    }
    if (networkBadge) networkBadge.classList.add('hidden');
    if (networkBadge) networkBadge.classList.remove('flex');
    if (statusEl) statusEl.classList.remove('connected');
    if (heroEl)   heroEl.classList.remove('hidden');
    if (mainEl)   mainEl.classList.add('hidden');
    
    // Desactivar botones eliminados
  }
}

function renderDisconnectedState() {
  document.getElementById('gm-panel')?.querySelectorAll('.btn').forEach(b => (b.disabled = true));
}

// ─── Cargar datos del usuario ──────────────────────────────────────────────

async function loadUserData() {
  const address = appState.address;
  if (!address) return;

  setLoading('user-data-container', true);

  try {
    // ALTA INGENIERIA: 1 sola llamada Multicall3 para todos los datos del dashboard
    const { userData, gmCost, gmDoneToday } = await loadUserDashboardData(address);

    appState.userData    = userData;
    appState.gmCost      = gmCost;
    appState.gmDoneToday = gmDoneToday;

    renderUserPanel(userData, gmCost, gmDoneToday);
    renderGMButton(userData, gmCost, gmDoneToday);
    renderNodesStatus(userData);
    renderAgentPanel(userData);
  } catch (err) {
    console.error('[App] Error cargando datos de usuario:', err);
    showToast(`⚠️ ${t('js.error')} Loading contract...`, 'warning');
  } finally {
    setLoading('user-data-container', false);
  }
}

// Escuchar cambios de idioma para re-renderizar
window.addEventListener('languageChanged', () => {
  if (appState.userData) {
    renderUserPanel(appState.userData, appState.gmCost, appState.gmDoneToday);
    renderGMButton(appState.userData, appState.gmCost, appState.gmDoneToday);
    renderNodesStatus(appState.userData);
    renderAgentPanel(appState.userData);
    
    if (appState.commitmentData) renderCommitmentData(appState.commitmentData);
    if (appState.convictionData) renderConvictionData(appState.convictionData);
    if (appState.legacyData) renderLegacyData(appState.legacyData);
  }
});

// ─── Renderizar Panel del Usuario ──────────────────────────────────────────

function renderUserPanel(userData, gmCost, gmDoneToday) {
  const container = document.getElementById('user-data-container');
  if (!container) return;

  // Actualizar Header Wallet y Avatar
  if (appState.address) {
    const minifiedWallet = `${appState.address.substring(0,6)}...${appState.address.substring(appState.address.length-4)}`;
    const headerWallet = document.getElementById('header-wallet');
    const headerAvatar = document.getElementById('header-avatar');
    if (headerWallet) headerWallet.textContent = minifiedWallet;
    if (headerAvatar) {
      const hexColor = appState.address.substring(2, 8) || '00e5ff';
      headerAvatar.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${appState.address}&backgroundColor=${hexColor}`;
    }
  }

  const forkLabel = userData.forkLevel <= 1
    ? '<span class="px-3 py-1 bg-surface-2 rounded-full text-[0.65rem] font-bold uppercase text-[#a78bfa] border border-[#a78bfa]/30 shadow-[0_0_10px_rgba(167,139,250,0.15)] flex items-center gap-1"><span>👑</span> VIP</span>'
    : `<span class="badge badge-fork">⚡ B${userData.forkLevel}</span>`;

  const streakDays = userData.currentStreak;

  container.innerHTML = `
    <div class="grid grid-cols-4 gap-2">
      <div class="flex flex-col items-center bg-surface-1 hover:bg-surface-2 transition-colors py-3 px-2 rounded-xl border border-border-light justify-center shadow-sm hover:shadow-glow-cyan">
        <div class="text-[0.55rem] text-text-muted font-semibold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5 w-full"><span>🎖️</span> <span>${t('dashboard.statStatus')}</span></div>
        <div class="text-sm font-bold flex items-center justify-center h-6 w-full">${forkLabel}</div>
      </div>
      <div class="flex flex-col items-center bg-surface-1 hover:bg-surface-2 transition-colors py-3 px-2 rounded-xl border border-border-light justify-center shadow-sm hover:shadow-glow-cyan">
        <div class="text-[0.55rem] text-text-muted font-semibold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5 w-full"><span>🔥</span> <span>${t('dashboard.statStreak')}</span></div>
        <div class="text-lg font-mono font-bold text-white h-6 flex items-center justify-center w-full">${streakDays}</div>
      </div>
      <div class="flex flex-col items-center bg-surface-1 hover:bg-surface-2 transition-colors py-3 px-2 rounded-xl border border-border-light justify-center shadow-sm hover:shadow-glow-cyan">
        <div class="text-[0.55rem] text-text-muted font-semibold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5 w-full"><span>⚡</span> <span>${t('dashboard.statPoints')}</span></div>
        <div class="text-lg font-mono font-bold text-white h-6 flex items-center justify-center w-full">${userData.totalPoints.toLocaleString()}</div>
      </div>
      <div class="flex flex-col items-center bg-surface-1 hover:bg-surface-2 transition-colors py-3 px-2 rounded-xl border border-border-light justify-center shadow-sm hover:shadow-glow-cyan">
        <div class="text-[0.55rem] text-text-muted font-semibold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5 w-full"><span>📡</span> <span title="${t('dashboard.statGms')}">${t('dashboard.statGms')}</span></div>
        <div class="text-lg font-mono font-bold text-white h-6 flex items-center justify-center w-full">${userData.gmCount}</div>
      </div>
    </div>
    ${userData.forkLevel > 1 ? `
    <div class="mt-3 flex items-center justify-between bg-warning/10 border border-warning/30 p-2 rounded text-xs">
      <p class="text-warning mb-0">${t('dashboard.forkInfo', {fork: userData.forkLevel})}</p>
      <button id="btn-reset-vip" class="bg-surface hover:bg-border border border-border-color px-2 py-1 rounded text-white transition-colors">${t('dashboard.btnResetVip')}</button>
    </div>
    ` : ''}
  `;

  // Re-registrar el botón de reset si fue renderizado dinámicamente
  const btnReset = document.getElementById('btn-reset-vip');
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      await handleResetVIP();
    });
  }

  // Configurar botón copiar
  const btnCopy = document.getElementById('btn-copy-wallet');
  if (btnCopy && appState.address) {
    const newBtn = btnCopy.cloneNode(true);
    btnCopy.parentNode.replaceChild(newBtn, btnCopy);
    newBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(appState.address);
      showToast('Wallet copiada', 'success');
    });
  }
}

// ─── Botón GM ──────────────────────────────────────────────────────────────

let gmCountdownInterval = null;

function renderGMButton(userData, gmCost, gmDoneToday) {
  const btn = document.getElementById('btn-gm');
  const txt = document.getElementById('btn-gm-text');
  if (!btn) return;
  const targetTxt = txt || btn;

  if (gmCountdownInterval) {
    clearInterval(gmCountdownInterval);
    gmCountdownInterval = null;
  }

  btn.classList.remove('btn-runestone', 'btn-done');
  
  const runestone = userData.nodeCommitment && userData.nodeConviction && userData.nodeLegacy;
  const svgEl = document.querySelector('.crystal-svg');
  if (svgEl) {
    if (runestone) {
      svgEl.classList.remove('is-inactive');
    } else {
      svgEl.classList.add('is-inactive');
    }
  }

  if (gmDoneToday) {
    btn.disabled = true;
    targetTxt.classList.add('opacity-50');
    
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const diff = tomorrow - now;
      if (diff <= 0) {
        targetTxt.textContent = "GM (REFRESH)";
        const countdownEl = document.getElementById('gm-countdown');
        if (countdownEl) countdownEl.innerHTML = "";
        clearInterval(gmCountdownInterval);
        return;
      }
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
      const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
      const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      targetTxt.textContent = runestone ? "SUPER GM" : "GM";
      const countdownEl = document.getElementById('gm-countdown');
      if (countdownEl) {
        countdownEl.innerHTML = `${h}:${m}:${s}`;
      }
    };
    updateCountdown();
    gmCountdownInterval = setInterval(updateCountdown, 1000);
  } else {
    btn.disabled = false;
    targetTxt.classList.remove('opacity-50');
    targetTxt.textContent = runestone ? "SUPER GM" : "GM";
  }
}

// ─── Handler GM ───────────────────────────────────────────────────────────

async function handleGM() {
  const address = appState.address;
  if (!address) { showToast(t('js.connectFirst'), 'warning'); return; }

  setButtonLoading('btn-gm', true, t('js.loading'));

  try {
    const receipt = await doGM(address);
    showToast(`✅ ${t('js.gmSent')} TX: ${receipt.hash.slice(0, 10)}...`, 'success');

    // Invalidar caché relevante
    Cache.invalidatePrefix(`ranking`);
    appState.gmDoneToday = true;

    // Recargar datos del usuario
    await loadUserData();
  } catch (err) {
    const msg = parseContractError(err);
    showToast(`❌ ${msg}`, 'error');
    console.error('[GM]', err);
  } finally {
    const isSuper = appState.userData && appState.userData.nodeCommitment && appState.userData.nodeConviction && appState.userData.nodeLegacy;
    setButtonLoading('btn-gm', false, isSuper ? 'SUPER GM' : 'GM');
  }
}

// ─── Nodos: Renderizar status ──────────────────────────────────────────────

function renderNodesStatus(userData) {
  const nodes = [
    { id: 1, name: 'Compromiso',  active: userData.nodeCommitment, streak: 3,  icon: '🔬' },
    { id: 2, name: 'Convicción',  active: userData.nodeConviction, streak: 12, icon: '💎' },
    { id: 3, name: 'Legado',      active: userData.nodeLegacy,     streak: 25, icon: '🏛️' },
  ];

  nodes.forEach(node => {
    const indicator = document.getElementById(`node${node.id}-status`);
    if (indicator) {
      if (node.active) {
        indicator.classList.remove('bg-accent-error', 'bg-error', 'bg-text-muted', 'shadow-[0_0_8px_rgba(255,23,68,0.6)]', 'shadow-[0_0_5px_rgba(239,68,68,0.5)]');
        indicator.classList.add('bg-[#4ade80]', 'shadow-[0_0_10px_#4ade80]');
      } else {
        indicator.classList.remove('bg-[#4ade80]', 'shadow-[0_0_10px_#4ade80]', 'bg-success', 'shadow-[0_0_10px_rgba(34,197,94,0.8)]');
        indicator.classList.add('bg-accent-error', 'shadow-[0_0_8px_rgba(255,23,68,0.6)]');
      }
      indicator.title = node.active ? `${node.name}: Activo` : `${node.name}: Inactivo`;
    }

    // Actualizar también los visuales del panel derecho
    const visualDot = document.getElementById(`visual-dot-${node.id}`);
    const satelliteWrapper = document.getElementById(`satellite-node-${node.id}`);
    if (visualDot) {
      if (node.active) {
        visualDot.classList.remove('bg-text-muted');
        visualDot.classList.add('bg-[#4ade80]', 'shadow-[0_0_12px_#4ade80]');
        if (satelliteWrapper) satelliteWrapper.classList.add('is-active');
      } else {
        visualDot.classList.remove('bg-[#4ade80]', 'shadow-[0_0_12px_#4ade80]');
        visualDot.classList.add('bg-text-muted');
        if (satelliteWrapper) satelliteWrapper.classList.remove('is-active');
      }
    }

    const streakEl = document.getElementById(`node${node.id}-streak-needed`);
    if (streakEl) {
      if (node.active) {
        streakEl.style.display = 'none';
      } else {
        streakEl.style.display = 'inline-block';
        streakEl.textContent = t(`nodes.node${node.id}.req`);
        streakEl.classList.remove('text-success', 'bg-success/10');
        streakEl.classList.add('text-warning', 'bg-warning/10');
      }
    }

    const btnStreak = document.getElementById(`btn-node${node.id}-streak`);
    const btnInstant = document.getElementById(`btn-node${node.id}-instant`);
    if (node.active) {
      if (btnStreak) btnStreak.style.display = 'none';
      if (btnInstant) btnInstant.style.display = 'none';
    } else {
      if (btnStreak) btnStreak.style.display = 'inline-block';
      if (btnInstant) btnInstant.style.display = 'inline-block';
    }
  });

  // Runestone indicator
  const runestone = userData.nodeCommitment && userData.nodeConviction && userData.nodeLegacy;
  const runestoneEl = document.getElementById('runestone-status');
  if (runestoneEl) {
    if (runestone) {
      runestoneEl.classList.remove('text-text-muted', 'border-border-color/50');
      runestoneEl.classList.add('text-runestone', 'border-runestone/50', 'shadow-[0_0_15px_rgba(232,121,249,0.3)]');
      runestoneEl.textContent = t('nodes.runestoneActive');
    } else {
      runestoneEl.classList.remove('text-runestone', 'border-runestone/50', 'shadow-[0_0_15px_rgba(232,121,249,0.3)]');
      runestoneEl.classList.add('text-text-muted', 'border-border-color/50');
      runestoneEl.textContent = t('nodes.runestoneInactive');
    }
  }
}

// ─── Cargar datos analíticos de nodos ─────────────────────────────────────

async function loadNodesData() {
  const address = appState.address;
  if (!address) { showToast('Conecta tu wallet primero.', 'warning'); return; }

  // Nodo 1: Compromiso
  setLoading('node1-data', true, 'Analizando transacciones...');
  // Nodo 2: Convicción
  setLoading('node2-data', true, 'Leyendo balance...');
  // Nodo 3: Legado
  setLoading('node3-data', true, 'Buscando primera TX...');

  try {
    // Llamadas secuenciales para no saturar la API ni el RPC
    const commitment = await calculateCommitmentNode(address, (fetched, pages) => {
      const el = document.getElementById('node1-data');
      if (el) el.innerHTML = `<p class="loading-text">📡 Leyendo... ${fetched} txs (pág. ${pages})</p>`;
    });
    const conviction = await calculateConvictionNode(address);
    const legacy = await calculateLegacyNode(address);

    appState.commitmentData = commitment;
    appState.convictionData = conviction;
    appState.legacyData     = legacy;

    renderCommitmentData(commitment);
    renderConvictionData(conviction);
    renderLegacyData(legacy);
  } catch (err) {
    console.error('[Nodes]', err);
    showToast(`❌ Error al cargar datos de nodos: ${err.message}`, 'error');
  }
}

function renderCommitmentData(d) {
  const el = document.getElementById('node1-data');
  if (!el) return;
  const labels = t('js.node1Data');
  el.innerHTML = `
    <div class="grid grid-cols-2 gap-1.5">
      <div class="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
        <span class="text-[0.55rem] text-text-muted uppercase tracking-wider truncate" title="${labels[0]}">${labels[0]}</span>
        <strong class="text-xs text-white truncate">${d.totalTxs.toLocaleString()}</strong>
      </div>
      <div class="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
        <span class="text-[0.55rem] text-text-muted uppercase tracking-wider truncate" title="${labels[1]}">${labels[1]}</span>
        <strong class="text-xs text-white truncate">${d.totalGasUsedFormatted}</strong>
      </div>
      <div class="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
        <span class="text-[0.55rem] text-text-muted uppercase tracking-wider truncate" title="${labels[2]}">${labels[2]}</span>
        <strong class="text-xs text-white truncate">${d.totalFeePaidFormatted}</strong>
      </div>
      <div class="flex flex-col bg-accent-primary/10 px-2 py-1 rounded border border-accent-primary/30">
        <span class="text-[0.55rem] text-accent-primary uppercase tracking-wider truncate" title="${labels[3]}">${labels[3]}</span>
        <strong class="text-xs text-accent-primary font-bold truncate">${t(`js.commitmentTiers.${d.tier.index}`)} <span class="text-[0.55rem] opacity-70">(×${d.tier.multiplier})</span></strong>
      </div>
    </div>
  `;
}

function renderConvictionData(d) {
  const el = document.getElementById('node2-data');
  if (!el) return;
  const labels = t('js.node2Data');
  el.innerHTML = `
    <div class="grid grid-cols-2 gap-1.5">
      <div class="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
        <span class="text-[0.55rem] text-text-muted uppercase tracking-wider truncate" title="${labels[0]}">${labels[0]}</span>
        <strong class="text-xs text-white truncate">${d.balanceUSDC}</strong>
      </div>
      <div class="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
        <span class="text-[0.55rem] text-text-muted uppercase tracking-wider truncate" title="${labels[1]}">${labels[1]}</span>
        <strong class="text-xs text-white truncate">${d.percentageOfSupply}%</strong>
      </div>
      <div class="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
        <span class="text-[0.55rem] text-text-muted uppercase tracking-wider truncate" title="${labels[2]}">${labels[2]}</span>
        <strong class="text-xs text-white truncate">${d.supplyTotal.toLocaleString()}</strong>
      </div>
      <div class="flex flex-col bg-accent-primary/10 px-2 py-1 rounded border border-accent-primary/30">
        <span class="text-[0.55rem] text-accent-primary uppercase tracking-wider truncate" title="${labels[3]}">${labels[3]}</span>
        <strong class="text-xs text-accent-primary font-bold truncate">${d.tier}</strong>
      </div>
    </div>
  `;
}

function renderLegacyData(d) {
  const el = document.getElementById('node3-data');
  if (!el) return;
  if (!d.firstTxTimestamp) {
    el.innerHTML = `<p class="empty-text">${t('js.node3Empty')}</p>`;
    return;
  }
  const labels = t('js.node3Data');
  el.innerHTML = `
    <div class="grid grid-cols-2 gap-1.5">
      <div class="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
        <span class="text-[0.55rem] text-text-muted uppercase tracking-wider truncate" title="${labels[0]}">${labels[0]}</span>
        <strong class="text-xs text-white truncate">${d.firstTxTimestamp.toLocaleDateString(getLanguage())}</strong>
      </div>
      <div class="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
        <span class="text-[0.55rem] text-text-muted uppercase tracking-wider truncate" title="${labels[1]}">${labels[1]}</span>
        <strong class="text-xs text-white truncate">${d.lastTxTimestamp.toLocaleDateString(getLanguage())}</strong>
      </div>
      <div class="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
        <span class="text-[0.55rem] text-text-muted uppercase tracking-wider truncate" title="${labels[2]} (Arc)">${labels[2]}</span>
        <strong class="text-xs text-white truncate">${d.daysSinceGenesis} d</strong>
      </div>
      <div class="flex flex-col bg-accent-primary/10 px-2 py-1 rounded border border-accent-primary/30">
        <span class="text-[0.55rem] text-accent-primary uppercase tracking-wider truncate" title="${labels[4]}">${labels[4]}</span>
        <strong class="text-xs text-accent-primary font-bold truncate">${t(`js.legacyTiers.${d.badge.index}`)} <span class="text-[0.55rem] opacity-70">(×${d.badge.multiplier})</span></strong>
      </div>
    </div>
  `;
}

// ─── Handler Activar Nodo (instantáneo) ───────────────────────────────────

async function handleNodeInstant(nodeId) {
  const address = appState.address;
  if (!address) { showToast('Conecta tu wallet primero.', 'warning'); return; }

  const btnId = `btn-node${nodeId}-instant`;
  setButtonLoading(btnId, true, '⏳ Activando...');

  try {
    const cost = await getNodeInstantCost(nodeId, address);
    const receipt = await activateNodeInstant(nodeId, address);
    showToast(`✅ Nodo ${nodeId} activado. TX: ${receipt.hash.slice(0, 10)}...`, 'success');
    Cache.invalidatePrefix(`ranking`);
    await loadUserData();
  } catch (err) {
    showToast(`❌ ${parseContractError(err)}`, 'error');
    console.error('[NodeInstant]', err);
  } finally {
    setButtonLoading(btnId, false, '⚡ Activar Ahora');
  }
}

// ─── Handler Activar Nodo (por racha) ─────────────────────────────────────

async function handleNodeByStreak(nodeId) {
  const address = appState.address;
  if (!address) { showToast('Conecta tu wallet primero.', 'warning'); return; }

  const btnId = `btn-node${nodeId}-streak`;
  setButtonLoading(btnId, true, '⏳ Activando...');

  try {
    const canActivate = await canActivateByStreak(nodeId, address);
    if (!canActivate) {
      const streakNeeded = { 1: 3, 2: 12, 3: 25 }[nodeId];
      throw new Error(`Necesitas ${streakNeeded} días de racha para este nodo.`);
    }

    const receipt = await activateNodeByStreak(nodeId, address);
    showToast(`✅ Nodo ${nodeId} activado por racha. TX: ${receipt.hash.slice(0, 10)}...`, 'success');
    Cache.invalidatePrefix(`ranking`);
    await loadUserData();
  } catch (err) {
    showToast(`❌ ${parseContractError(err)}`, 'error');
    console.error('[NodeStreak]', err);
  } finally {
    setButtonLoading(btnId, false, '🔥 Activar por Racha');
  }
}

// ─── Handler Reset a VIP ───────────────────────────────────────────────────

async function handleResetVIP() {
  const address = appState.address;
  if (!address) return;

  const confirmed = confirm(
    '⚠️ ¿Confirmas resetear a VIP?\n\nEsto reiniciará tu racha y desactivará todos los nodos. Tu puntaje acumulado se conserva.'
  );
  if (!confirmed) return;

  setButtonLoading('btn-reset-vip', true, '⏳ Reseteando...');

  try {
    const receipt = await resetToVIP();
    showToast(`✅ Racha reseteada a VIP. TX: ${receipt.hash.slice(0, 10)}...`, 'success');
    await loadUserData();
  } catch (err) {
    showToast(`❌ ${parseContractError(err)}`, 'error');
    console.error('[ResetVIP]', err);
  } finally {
    setButtonLoading('btn-reset-vip', false, 'Resetear a VIP');
  }
}

// ─── Panel de Agente (ERC-8004) ───────────────────────────────────────────

async function renderAgentPanel(userData) {
  const container = document.getElementById('agent-ui-container');
  if (!container) return;

  const runestone = userData.nodeCommitment && userData.nodeConviction && userData.nodeLegacy;

  if (!runestone) {
    container.innerHTML = `<p class="empty-text">${t('dashboard.agentReqRunestone')}</p>`;
    return;
  }

  if (userData.attachedAgentId > 0) {
    container.innerHTML = `
      <div class="mt-2 bg-runestone/10 border border-runestone/30 p-3 rounded flex items-center justify-between">
        <div class="flex flex-col">
          <span class="text-[0.65rem] text-text-muted uppercase">${t('dashboard.agentTitle')}</span>
          <span class="text-sm font-bold text-runestone">🤖 ID: ${userData.attachedAgentId}</span>
        </div>
        <div class="text-[0.65rem] text-text-muted max-w-[100px] text-right leading-tight">
          ${t('dashboard.agentActiveDesc')}
        </div>
      </div>
    `;
    return;
  }

  // Estado: Runestone activo pero sin agente. Buscamos agentes en la blockchain.
  container.innerHTML = `<p class="animate-pulse text-xs mt-2">${t('dashboard.agentSearching')}</p>`;
  
  try {
    const userAgents = await fetchUserAgents(appState.address);

    if (userAgents.length === 0) {
      container.innerHTML = `
        <div class="mt-2 flex items-center justify-between bg-surface/30 p-1.5 rounded border border-border-color/30">
          <span class="text-[0.6rem] text-error flex items-center gap-1 cursor-help relative group/tt">
            ⚠️ <span class="hidden sm:inline">No Agents</span>
            <div class="absolute bottom-full left-0 mb-2 w-48 p-2 bg-surface-2 border border-error/50 rounded shadow-xl text-[0.55rem] text-text-muted opacity-0 group-hover/tt:opacity-100 pointer-events-none transition-opacity z-50 text-left normal-case tracking-normal">
              ${t('dashboard.agentNoneFound')}
            </div>
          </span>
          <a href="https://testnet.arcscan.app/address/0x8004A818BFB912233c491871b3d84c89A494BD9e" target="_blank" class="bg-surface hover:bg-border border border-border-color text-white px-2 py-0.5 rounded text-[0.6rem] transition-colors">${t('dashboard.agentRegisterBtn')}</a>
        </div>
      `;
    } else {
      let options = userAgents.map(id => `<option value="${id.toString()}">${t('dashboard.agentOption', { id: id.toString() })}</option>`).join('');
      container.innerHTML = `
        <div class="mt-2">
          <div class="flex gap-2">
            <select id="input-agent-id" class="flex-1 bg-surface border border-border-color rounded text-xs px-2 py-1.5 focus:border-primary outline-none">
              <option value="" disabled selected>${t('dashboard.agentSelectPlaceholder')}</option>
              ${options}
            </select>
            <button id="btn-attach-agent" class="bg-primary/20 hover:bg-primary/40 border border-primary/50 text-primary px-3 py-1.5 rounded text-xs transition-colors whitespace-nowrap">${t('js.attachAgentBtn') || 'Vincular Agente'}</button>
          </div>
        </div>
      `;

      // Bind event
      document.getElementById('btn-attach-agent')?.addEventListener('click', async () => {
        const select = document.getElementById('input-agent-id');
        const agentIdStr = select.value;
        if (!agentIdStr) {
          showToast(t('dashboard.agentSelectWarning'), 'warning');
          return;
        }
        setButtonLoading('btn-attach-agent', true, '⏳...');
        try {
          const agentId = BigInt(agentIdStr);
          const tx = await attachAgent(agentId);
          showToast(`✅ Agente ${agentId.toString()} vinculado! TX: ${tx.hash.slice(0, 10)}...`, 'success');
          await loadUserData();
        } catch (err) {
          showToast(`❌ ${parseContractError(err)}`, 'error');
          console.error('[Agent]', err);
        } finally {
          setButtonLoading('btn-attach-agent', false, t('js.attachAgentBtn') || 'Vincular Agente');
        }
      });
    }
  } catch (error) {
    console.error("Error renderizando dropdown de agentes:", error);
    container.innerHTML = `<p class="text-xs text-error mt-2">${t('dashboard.agentSearchError')}</p>`;
  }
}

// ─── Helpers de UI ─────────────────────────────────────────────────────────

function setButtonLoading(id, loading, label) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  const txt = document.getElementById(id + '-text');
  if (txt) {
    txt.textContent = label;
  } else {
    btn.textContent = label;
  }
}

function setLoading(containerId, loading, msg = 'Cargando...') {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (loading) el.innerHTML = `<p class="loading-text">⏳ ${msg}</p>`;
}

let _toastTimer = null;

function showToast(message, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast toast-${type} show`;

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}
