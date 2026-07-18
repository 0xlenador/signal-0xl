/**
 * wallet.js — Signal 0xL
 * Gestión de conexión wallet (MetaMask / inyectado EIP-1193).
 * Maneja auto-switch a Arc Testnet y eventos de cambio de cuenta/red.
 */

import { NETWORK } from './config.js';
import { ethers } from 'ethers';
// Estado interno del módulo
const state = {
  provider: null,    // ethers.BrowserProvider
  signer: null,      // ethers.Signer
  address: null,     // string (dirección conectada)
  chainId: null,     // number
  connected: false,
  listeners: {},     // callbacks registrados
};

/** Registrar un callback para un evento. */
export function on(event, cb) {
  if (!state.listeners[event]) state.listeners[event] = [];
  state.listeners[event].push(cb);
}

function emit(event, data) {
  (state.listeners[event] || []).forEach(cb => cb(data));
}

/** Devuelve la instancia de ethers importada. */
function getEthers() {
  return ethers;
}

/** Verifica si hay un provider inyectado (MetaMask u otro). */
export function hasInjectedProvider() {
  return typeof window.ethereum !== 'undefined';
}

/**
 * Conecta la wallet del usuario.
 * 1. Solicita acceso a las cuentas (eth_requestAccounts).
 * 2. Verifica o cambia a Arc Testnet.
 * 3. Inicializa provider y signer.
 * @returns {Promise<{address: string, chainId: number}>}
 */
export async function connectWallet() {
  if (!hasInjectedProvider()) {
    throw new Error('No se detectó MetaMask. Instálalo en https://metamask.io');
  }

  const ethers = getEthers();

  // Solicitar cuentas
  await window.ethereum.request({ method: 'eth_requestAccounts' });

  state.provider = new ethers.BrowserProvider(window.ethereum);
  state.signer   = await state.provider.getSigner();
  state.address  = await state.signer.getAddress();

  const network = await state.provider.getNetwork();
  state.chainId = Number(network.chainId);

  // Verificar red correcta
  if (state.chainId !== NETWORK.chainId) {
    await switchToArcTestnet();
  }

  state.connected = true;

  // Registrar listeners globales del provider inyectado
  _setupEventListeners();

  emit('connected', { address: state.address, chainId: state.chainId });
  return { address: state.address, chainId: state.chainId };
}

/**
 * Desconecta la wallet (limpia estado local; no revoca acceso en MetaMask).
 */
export function disconnectWallet() {
  state.provider  = null;
  state.signer    = null;
  state.address   = null;
  state.chainId   = null;
  state.connected = false;
  emit('disconnected', null);
}

/**
 * Solicita a MetaMask cambiar a Arc Testnet.
 * Si la red no existe, la agrega automáticamente.
 */
export async function switchToArcTestnet() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: NETWORK.chainIdHex }],
    });
  } catch (err) {
    // Error 4902: la red no está configurada en MetaMask → agregarla
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId:           NETWORK.chainIdHex,
          chainName:         NETWORK.name,
          nativeCurrency:    NETWORK.nativeCurrency,
          rpcUrls:           NETWORK.rpcUrls,
          blockExplorerUrls: [NETWORK.blockExplorer],
        }],
      });
    } else {
      throw err;
    }
  }

  // Re-inicializar provider/signer tras el cambio de red
  const ethers = getEthers();
  state.provider = new ethers.BrowserProvider(window.ethereum);
  state.signer   = await state.provider.getSigner();
  state.address  = await state.signer.getAddress();
  state.chainId  = NETWORK.chainId;
}

/** Devuelve el signer activo (lanza si no está conectado). */
export function getSigner() {
  if (!state.signer) throw new Error('Wallet no conectada.');
  return state.signer;
}

/** Devuelve el provider activo (lanza si no está conectado). */
export function getProvider() {
  if (!state.provider) throw new Error('Wallet no conectada.');
  return state.provider;
}

/** Devuelve la dirección conectada o null. */
export function getAddress() {
  return state.address;
}

/** Devuelve true si hay wallet conectada y en la red correcta. */
export function isConnected() {
  return state.connected && state.chainId === NETWORK.chainId;
}

/** Obtiene el balance nativo de una dirección (en wei, como BigInt). */
export async function getNativeBalance(address) {
  const provider = getProvider();
  return await provider.getBalance(address);
}

/**
 * Formatea wei → USDC con N decimales.
 * @param {bigint} wei
 * @param {number} [decimals=4]
 */
export function formatUSDC(wei, decimals = 4) {
  const ethers = getEthers();
  return parseFloat(ethers.formatUnits(wei, 18)).toFixed(decimals);
}

/** Abrevia una dirección: 0x1234...abcd */
export function shortAddress(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ─── Listeners de eventos de MetaMask ────────────────────────────────────

function _setupEventListeners() {
  if (!window.ethereum) return;

  // Cambio de cuenta
  window.ethereum.on('accountsChanged', async (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      state.address = accounts[0];
      const ethers = getEthers();
      state.provider = new ethers.BrowserProvider(window.ethereum);
      state.signer   = await state.provider.getSigner();
      emit('accountChanged', { address: state.address });
    }
  });

  // Cambio de red
  window.ethereum.on('chainChanged', (chainIdHex) => {
    state.chainId = parseInt(chainIdHex, 16);
    if (state.chainId !== NETWORK.chainId) {
      emit('wrongNetwork', { chainId: state.chainId });
    } else {
      emit('networkOK', { chainId: state.chainId });
    }
    // Recargar es la práctica recomendada por MetaMask
    window.location.reload();
  });
}
