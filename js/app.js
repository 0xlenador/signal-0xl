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
  resetToVIP, parseContractError, weiToUSDC, resetContract, attachAgent
} from './contract.js';
import {
  calculateCommitmentNode, calculateConvictionNode, calculateLegacyNode
} from './nodes.js';
import { renderRanking } from './ranking.js';
import { initNetworkPanel, stopPolling } from './network.js';
import { Cache } from './cache.js';
import { initAppKit, depositFromBase, depositFromArb, spendToArc } from './app-kit.js';

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
  setupNavigation();
  setupWalletListeners();
  setupGlobalButtons();
  showSection('gm-section');

  // Si hay sesión previa en MetaMask, intentar reconectar silenciosamente
  if (hasInjectedProvider() && window.ethereum.selectedAddress) {
    silentReconnect();
  }

  // Inicializar panel de red siempre (no requiere wallet)
  initNetworkPanel('network-container');
});

// ─── Reconexión silenciosa ─────────────────────────────────────────────────

async function silentReconnect() {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      await connectWallet();
    }
  } catch { /* silencioso */ }
}

// ─── Navegación ───────────────────────────────────────────────────────────

function setupNavigation() {
  document.querySelectorAll('[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.getAttribute('data-section');
      showSection(section);
      // Cargar datos de la sección al navegar
      if (section === 'ranking-section') renderRanking('ranking-container', appState.address);
      if (section === 'nodes-section' && appState.address) loadNodesData();
    });
  });
}

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('[data-section]').forEach(b => b.classList.remove('nav-active'));
  document.getElementById(sectionId)?.classList.add('active');
  document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('nav-active');
}

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
    showToast('⚠️ Red incorrecta. Cambia a Arc Testnet.', 'warning');
  });
}

function setupGlobalButtons() {
  // Botón conectar wallet
  document.getElementById('btn-connect-wallet')?.addEventListener('click', handleConnect);
  document.getElementById('btn-connect-wallet-hero')?.addEventListener('click', handleConnect);

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

  // Botón cargar datos de nodos
  document.getElementById('btn-load-nodes')?.addEventListener('click', loadNodesData);

  // Botones de App Kit (Unified Balance)
  document.getElementById('btn-fund-base')?.addEventListener('click', async () => {
    setButtonLoading('btn-fund-base', true, '⌛');
    try { await depositFromBase(); showToast('✅ Depósito desde Base iniciado', 'success'); }
    catch(e) { showToast('❌ Error en depósito', 'error'); }
    setButtonLoading('btn-fund-base', false, 'Depositar desde Base Sepolia');
  });
  document.getElementById('btn-fund-arb')?.addEventListener('click', async () => {
    setButtonLoading('btn-fund-arb', true, '⌛');
    try { await depositFromArb(); showToast('✅ Depósito desde Arb iniciado', 'success'); }
    catch(e) { showToast('❌ Error en depósito', 'error'); }
    setButtonLoading('btn-fund-arb', false, 'Depositar desde Arb Sepolia');
  });
  document.getElementById('btn-bridge-arc')?.addEventListener('click', async () => {
    setButtonLoading('btn-bridge-arc', true, '⌛');
    try { await spendToArc(); showToast('✅ Fondos enviados a Arc Testnet', 'success'); }
    catch(e) { showToast('❌ Error en envío', 'error'); }
    setButtonLoading('btn-bridge-arc', false, 'Traer fondos a Arc Testnet');
  });
}

// ─── Conexión Wallet ───────────────────────────────────────────────────────

async function handleConnect() {
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
      setButtonLoading('btn-connect-wallet', false, shortAddress(address));
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

  if (address) {
    if (btnConnect) {
      btnConnect.textContent = shortAddress(address);
      btnConnect.classList.remove('btn-primary');
      btnConnect.classList.add('btn-secondary');
    }
    if (statusEl) statusEl.classList.add('connected');
    if (heroEl)   heroEl.classList.add('hidden');
    if (mainEl)   mainEl.classList.remove('hidden');
    
    // Habilitar App Kit
    initAppKit();
    document.getElementById('btn-fund-base').disabled = false;
    document.getElementById('btn-fund-arb').disabled = false;
    document.getElementById('btn-bridge-arc').disabled = false;
  } else {
    if (btnConnect) {
      btnConnect.textContent = '🔗 Conectar';
      btnConnect.classList.remove('btn-secondary');
      btnConnect.classList.add('btn-primary');
    }
    if (statusEl) statusEl.classList.remove('connected');
    if (heroEl)   heroEl.classList.remove('hidden');
    if (mainEl)   mainEl.classList.add('hidden');
    
    // Desactivar App Kit buttons
    document.getElementById('btn-fund-base').disabled = true;
    document.getElementById('btn-fund-arb').disabled = true;
    document.getElementById('btn-bridge-arc').disabled = true;
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
    // El RPC de Arc Testnet tiene un rate limit muy estricto (~1 req/sec).
    // Usamos llamadas secuenciales con delay para evitar el error -32011 (request limit reached).
    const userData = await getUserData(address);
    await new Promise(r => setTimeout(r, 600));
    const gmCost = await getGMCost(address);
    await new Promise(r => setTimeout(r, 600));
    const gmDoneToday = await hasGMToday(address);

    appState.userData    = userData;
    appState.gmCost      = gmCost;
    appState.gmDoneToday = gmDoneToday;

    renderUserPanel(userData, gmCost, gmDoneToday);
    renderGMButton(userData, gmCost, gmDoneToday);
    renderNodesStatus(userData);
    renderAgentPanel(userData);
  } catch (err) {
    console.error('[App] Error cargando datos de usuario:', err);
    showToast('⚠️ Error al leer el contrato. ¿Está desplegado?', 'warning');
  } finally {
    setLoading('user-data-container', false);
  }
}

// ─── Renderizar Panel del Usuario ──────────────────────────────────────────

function renderUserPanel(userData, gmCost, gmDoneToday) {
  const container = document.getElementById('user-data-container');
  if (!container) return;

  const forkLabel = userData.forkLevel <= 1
    ? '<span class="badge badge-vip">⭐ VIP</span>'
    : `<span class="badge badge-fork">⚡ B${userData.forkLevel}</span>`;

  const streakDays = userData.currentStreak;
  const runestone  = userData.nodeCommitment && userData.nodeConviction && userData.nodeLegacy;

  const totalCostWei = gmCost.total;
  const costDisplay  = weiToUSDC(totalCostWei, 4);
  const debtDisplay  = gmCost.debtCost > BigInt(0) ? `<span class="debt-warn">+ ${weiToUSDC(gmCost.debtCost, 4)} deuda</span>` : '';

  container.innerHTML = `
    <div class="user-stats-grid">
      <div class="stat-item">
        <div class="stat-label">Estado</div>
        <div class="stat-value">${forkLabel}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Racha Activa</div>
        <div class="stat-value">🔥 ${streakDays} días</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Puntaje Total</div>
        <div class="stat-value">⚡ ${userData.totalPoints.toLocaleString()} pts</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">GMs Realizados</div>
        <div class="stat-value">📡 ${userData.gmCount}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Costo GM Actual</div>
        <div class="stat-value">${costDisplay} ${debtDisplay}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Runestone</div>
        <div class="stat-value">${runestone ? '🔮 Activo' : '○ Inactivo'}</div>
      </div>
    </div>
    ${userData.forkLevel > 1 ? `
    <div class="fork-info">
      <p>Estás en bifurcación <strong>B${userData.forkLevel}</strong>. Tu GM cuesta un poco más, pero activar nodos <strong>solo cuesta la tarifa base</strong>.</p>
      <button id="btn-reset-vip" class="btn btn-secondary btn-small">Resetear a VIP</button>
    </div>
    ` : ''}
  `;

  // Re-registrar el botón de reset si fue renderizado dinámicamente
  document.getElementById('btn-reset-vip')?.addEventListener('click', handleResetVIP);
}

// ─── Botón GM ──────────────────────────────────────────────────────────────

function renderGMButton(userData, gmCost, gmDoneToday) {
  const btn = document.getElementById('btn-gm');
  if (!btn) return;

  const runestone = userData.nodeCommitment && userData.nodeConviction && userData.nodeLegacy;
  const isNewUser = !userData.exists;

  if (gmDoneToday) {
    btn.textContent = '✅ GM Enviado Hoy';
    btn.disabled = true;
    btn.classList.remove('btn-runestone');
    btn.classList.add('btn-done');
  } else if (runestone) {
    btn.textContent = '🔮 SUPER GM (Runestone)';
    btn.disabled = false;
    btn.classList.add('btn-runestone');
    btn.classList.remove('btn-done');
  } else {
    const label = isNewUser ? '📡 Enviar Primera Señal (GM)' : '📡 Enviar Señal (GM)';
    btn.textContent = label;
    btn.disabled = false;
    btn.classList.remove('btn-runestone', 'btn-done');
  }
}

// ─── Handler GM ───────────────────────────────────────────────────────────

async function handleGM() {
  const address = appState.address;
  if (!address) { showToast('Conecta tu wallet primero.', 'warning'); return; }

  setButtonLoading('btn-gm', true, '⏳ Enviando señal...');

  try {
    const receipt = await doGM(address);
    showToast(`✅ ¡Señal enviada! TX: ${receipt.hash.slice(0, 10)}...`, 'success');

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
    setButtonLoading('btn-gm', false, '📡 Enviar Señal (GM)');
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
      indicator.className = `node-status-dot ${node.active ? 'active' : 'inactive'}`;
      indicator.title = node.active ? `${node.name}: Activo` : `${node.name}: Inactivo`;
    }

    const streakEl = document.getElementById(`node${node.id}-streak-needed`);
    if (streakEl) {
      streakEl.textContent = node.active
        ? '✅ Activo'
        : `Requiere racha día ${node.streak}`;
    }

    const btnStreak = document.getElementById(`btn-node${node.id}-streak`);
    const btnInstant = document.getElementById(`btn-node${node.id}-instant`);
    if (node.active) {
      if (btnStreak) btnStreak.style.display = 'none';
      if (btnInstant) btnInstant.style.display = 'none';
    } else {
      if (btnStreak) btnStreak.style.display = 'inline-block'; // o 'block'/'inline-flex' según CSS
      if (btnInstant) btnInstant.style.display = 'inline-block';
    }
  });

  // Runestone indicator
  const runestone = userData.nodeCommitment && userData.nodeConviction && userData.nodeLegacy;
  const runestoneEl = document.getElementById('runestone-status');
  if (runestoneEl) {
    runestoneEl.className = `runestone-indicator ${runestone ? 'active' : ''}`;
    runestoneEl.textContent = runestone ? '🔮 RUNESTONE ACTIVO — Super GM habilitado' : '○ Runestone inactivo — Activa los 3 nodos';
  }
}

// ─── Cargar datos analíticos de nodos ─────────────────────────────────────

async function loadNodesData() {
  const address = appState.address;
  if (!address) { showToast('Conecta tu wallet primero.', 'warning'); return; }

  const btn = document.getElementById('btn-load-nodes');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Cargando datos...'; }

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
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔄 Recargar Datos'; }
  }
}

function renderCommitmentData(d) {
  const el = document.getElementById('node1-data');
  if (!el) return;
  el.innerHTML = `
    <div class="node-data-grid">
      <div class="node-data-item"><span>Transacciones totales</span><strong>${d.totalTxs.toLocaleString()}</strong></div>
      <div class="node-data-item"><span>Gas consumido</span><strong>${d.totalGasUsedFormatted}</strong></div>
      <div class="node-data-item"><span>Fees pagadas</span><strong>${d.totalFeePaidFormatted} USDC</strong></div>
      <div class="node-data-item"><span>Tier</span><strong>${d.tier.label} (×${d.tier.multiplier})</strong></div>
    </div>
  `;
}

function renderConvictionData(d) {
  const el = document.getElementById('node2-data');
  if (!el) return;
  el.innerHTML = `
    <div class="node-data-grid">
      <div class="node-data-item"><span>Balance nativo</span><strong>${d.balanceUSDC} USDC</strong></div>
      <div class="node-data-item"><span>% del supply</span><strong>${d.percentageOfSupply}%</strong></div>
      <div class="node-data-item"><span>Supply total (ref.)</span><strong>${d.supplyTotal.toLocaleString()} USDC</strong></div>
      <div class="node-data-item"><span>Clasificación</span><strong>${d.tier}</strong></div>
    </div>
  `;
}

function renderLegacyData(d) {
  const el = document.getElementById('node3-data');
  if (!el) return;
  if (!d.firstTxTimestamp) {
    el.innerHTML = '<p class="empty-text">No se encontraron transacciones en Arc Testnet.</p>';
    return;
  }
  el.innerHTML = `
    <div class="node-data-grid">
      <div class="node-data-item"><span>Primera TX</span><strong>${d.firstTxTimestamp.toLocaleDateString('es-ES')}</strong></div>
      <div class="node-data-item"><span>Última TX</span><strong>${d.lastTxTimestamp.toLocaleDateString('es-ES')}</strong></div>
      <div class="node-data-item"><span>Días desde génesis</span><strong>${d.daysSinceGenesis}</strong></div>
      <div class="node-data-item"><span>Rango activo</span><strong>${d.rangeDays} días</strong></div>
      <div class="node-data-item span-2"><span>Insignia</span><strong>${d.badge.label} (×${d.badge.multiplier})</strong></div>
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

function renderAgentPanel(userData) {
  const container = document.getElementById('agent-ui-container');
  if (!container) return;

  const runestone = userData.nodeCommitment && userData.nodeConviction && userData.nodeLegacy;

  if (!runestone) {
    container.innerHTML = `<p class="empty-text">❌ Debes activar el Runestone (3 nodos) para interactuar con agentes de IA.</p>`;
    return;
  }

  if (userData.attachedAgentId > 0) {
    container.innerHTML = `
      <div class="stat-item" style="border: 1px solid var(--color-border); padding: 12px; border-radius: 8px; margin-top: 8px; background: rgba(0,0,0,0.2);">
        <div class="stat-label">Agente Vinculado</div>
        <div class="stat-value" style="color: var(--color-runestone);">
          🤖 ID: ${userData.attachedAgentId}
        </div>
        <p style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 8px;">
          Tu Agente de IA está activo y conectado a tu perfil en Signal 0xL.
        </p>
      </div>
    `;
  } else {
    container.innerHTML = `
      <p style="font-size: 0.85rem; margin-bottom: 8px; color: var(--color-text-muted);">
        ¡Runestone activado! Tienes permiso para vincular tu Agente. Asegúrate de haberlo registrado primero en el <a href="https://testnet.arcscan.app/address/0x8004A818BFB912233c491871b3d84c89A494BD9e" target="_blank" style="color: var(--color-primary);">IdentityRegistry de Arc</a>.
      </p>
      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <input type="number" id="input-agent-id" class="input-base" placeholder="Agent ID (ej. 12)" style="flex: 1;" />
        <button id="btn-attach-agent" class="btn btn-primary">Vincular Agente</button>
      </div>
    `;
    
    // Bind event
    document.getElementById('btn-attach-agent')?.addEventListener('click', async () => {
      const input = document.getElementById('input-agent-id');
      const agentId = parseInt(input.value);
      if (isNaN(agentId) || agentId <= 0) {
        showToast('ID de Agente inválido.', 'warning');
        return;
      }
      setButtonLoading('btn-attach-agent', true, 'Vinculando...');
      try {
        const tx = await attachAgent(agentId);
        showToast(`✅ Agente ${agentId} vinculado! TX: ${tx.hash.slice(0, 10)}...`, 'success');
        await loadUserData();
      } catch (err) {
        showToast(`❌ ${parseContractError(err)}`, 'error');
        console.error('[Agent]', err);
      } finally {
        setButtonLoading('btn-attach-agent', false, 'Vincular Agente');
      }
    });
  }
}

// ─── Helpers de UI ─────────────────────────────────────────────────────────

function setButtonLoading(id, loading, label) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = label;
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
