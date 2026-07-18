/**
 * config.js — Signal 0xL
 * Configuración central de la dApp: red, contrato, ABI y constantes del sistema.
 */

// ─── Red: Arc Testnet ──────────────────────────────────────────────────────
export const NETWORK = {
  chainId: 5042002,
  chainIdHex: '0x4cef52',
  name: 'Arc Testnet',
  rpcUrls: ['https://rpc.testnet.arc.network'],
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,   // 18 decimales a nivel protocolo (EVM estándar)
  },
  blockExplorer: 'https://testnet.arcscan.app',
};

// ─── Contrato Signal0xL ────────────────────────────────────────────────────
// ⚠️ Actualizar tras desplegar en Remix IDE
export const CONTRACT_ADDRESS = '0x108E51F9af4aF2D8CAa1f41E81b91B84B1304d36';

export const CONTRACT_ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"agentId","type":"uint256"}],"name":"AgentAttached","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newCost","type":"uint256"}],"name":"BaseCostUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"pointsEarned","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"totalPoints","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"streak","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"forkLevel","type":"uint256"},{"indexed":false,"internalType":"bool","name":"superGM","type":"bool"}],"name":"GMDone","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint8","name":"nodeId","type":"uint8"},{"indexed":false,"internalType":"bool","name":"byStreak","type":"bool"}],"name":"NodeActivated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"}],"name":"StreakReset","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdrawn","type":"event"},{"inputs":[{"internalType":"uint8","name":"nodeId","type":"uint8"}],"name":"activateNodeByStreak","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint8","name":"nodeId","type":"uint8"}],"name":"activateNodeInstant","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"agentId","type":"uint256"}],"name":"attachAgent","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"baseGMCost","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint8","name":"nodeId","type":"uint8"},{"internalType":"address","name":"_user","type":"address"}],"name":"canActivateByStreak","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"doGM","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"getCurrentUTCDay","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"getDaysSinceLastGM","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"getGMCost","outputs":[{"internalType":"uint256","name":"gmCost","type":"uint256"},{"internalType":"uint256","name":"debtCost","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint8","name":"nodeId","type":"uint8"},{"internalType":"address","name":"_user","type":"address"}],"name":"getNodeInstantCost","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"count","type":"uint256"}],"name":"getTopUsers","outputs":[{"internalType":"address[]","name":"addrs","type":"address[]"},{"internalType":"uint256[]","name":"points","type":"uint256[]"},{"internalType":"uint256[]","name":"forks","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getUserCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"getUserData","outputs":[{"internalType":"uint256","name":"totalPoints","type":"uint256"},{"internalType":"uint256","name":"lastGmDay","type":"uint256"},{"internalType":"uint256","name":"currentStreak","type":"uint256"},{"internalType":"uint256","name":"forkLevel","type":"uint256"},{"internalType":"uint256","name":"gmCount","type":"uint256"},{"internalType":"bool","name":"nodeCommitment","type":"bool"},{"internalType":"bool","name":"nodeConviction","type":"bool"},{"internalType":"bool","name":"nodeLegacy","type":"bool"},{"internalType":"bool","name":"exists","type":"bool"},{"internalType":"uint256","name":"attachedAgentId","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"offset","type":"uint256"},{"internalType":"uint256","name":"limit","type":"uint256"}],"name":"getUsersPaginated","outputs":[{"internalType":"address[]","name":"addrs","type":"address[]"},{"internalType":"uint256[]","name":"points","type":"uint256[]"},{"internalType":"uint256[]","name":"forks","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"hasGMToday","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"hasRunestone","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"identityRegistry","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"resetToVIP","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_newCost","type":"uint256"}],"name":"setBaseGMCost","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_registry","type":"address"}],"name":"setIdentityRegistry","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"userList","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"users","outputs":[{"internalType":"uint256","name":"totalPoints","type":"uint256"},{"internalType":"uint256","name":"lastGmDay","type":"uint256"},{"internalType":"uint256","name":"currentStreak","type":"uint256"},{"internalType":"uint256","name":"forkLevel","type":"uint256"},{"internalType":"uint256","name":"gmCount","type":"uint256"},{"internalType":"bool","name":"nodeCommitment","type":"bool"},{"internalType":"bool","name":"nodeConviction","type":"bool"},{"internalType":"bool","name":"nodeLegacy","type":"bool"},{"internalType":"bool","name":"exists","type":"bool"},{"internalType":"uint256","name":"attachedAgentId","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];

export const BLOCKSCOUT = {
  baseUrl: `https://testnet.arcscan.app/api/v2`,
  // apiKey: 'proapi_hvdb77oNnlXzBCbJHo1R51S6IzEBfyXGCECbHVL5BaOqQDBDMNpIGw0UuLhy27rmN_dGMp1B', // Opcional/No requerido en arcscan local
};

// ─── Constantes del sistema ────────────────────────────────────────────────
export const CONSTANTS = {
  // Token nativo
  DECIMALS: 18,

  // Paridad: 1 USDC ≈ 1 USD en testnet
  // baseGMCost = 0.01 USD = 0.01 USDC = 1e16 wei
  BASE_GM_COST_WEI: BigInt('10000000000000000'), // 1e16

  // Supply total hardcodeado para Nodo de Convicción
  TOTAL_SUPPLY: 100_000_000, // 100M USDC (valor representativo para testnet)

  // Racha mínima para activar cada nodo
  NODE_STREAK_REQUIREMENTS: { 1: 3, 2: 12, 3: 25 },

  // Costos instantáneos (múltiplos de baseGMCost)
  NODE_INSTANT_MULTIPLIERS: { 1: 51, 2: 126, 3: 501 },

  // Multiplicadores de Legado (según antigüedad de la primera TX)
  LEGACY_MULTIPLIERS: [
    { label: 'Génesis (Día 1)',      maxDays: 1,    multiplier: 3.0  },
    { label: 'Fundador (1ª Semana)', maxDays: 7,    multiplier: 2.5  },
    { label: 'Pionero (1er Mes)',    maxDays: 30,   multiplier: 2.0  },
    { label: 'Veterano (1er Trim.)', maxDays: 90,   multiplier: 1.5  },
    { label: 'Activo',               maxDays: Infinity, multiplier: 1.0 },
  ],

  // Multiplicadores de Compromiso (según número de txs)
  COMMITMENT_TIERS: [
    { label: 'Iniciante',   maxTxs: 50,   multiplier: 1.0  },
    { label: 'Activo',      maxTxs: 200,  multiplier: 1.25 },
    { label: 'Comprometido',maxTxs: 500,  multiplier: 1.5  },
    { label: 'Veterano',    maxTxs: 1000, multiplier: 1.75 },
    { label: 'Élite',       maxTxs: Infinity, multiplier: 2.0 },
  ],

  // TTL de caché (en milisegundos)
  CACHE_TTL: {
    STATS:   2 * 60 * 1000,   // 2 minutos
    PROFILE: 5 * 60 * 1000,   // 5 minutos
    TXS:     60 * 60 * 1000,  // 1 hora
    RANKING: 30 * 1000,       // 30 segundos
  },

  // Intervalo de polling para métricas de red
  NETWORK_POLL_INTERVAL: 30 * 1000, // 30 segundos
};
