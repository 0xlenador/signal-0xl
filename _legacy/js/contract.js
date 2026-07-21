/**
 * contract.js — Signal 0xL
 * Wrapper sobre el Smart Contract Signal0xL.
 * Provee funciones de lectura (view) y escritura (payable) con manejo de errores.
 */

import { CONTRACT_ADDRESS, CONTRACT_ABI, CONSTANTS, NETWORK } from './config.js';
import { getSigner, getProvider } from './wallet.js';
import { fetchUserTokens } from './blockscout.js';
import { ethers } from 'ethers';

// Caching provider con static network para evitar llamadas auto-detect eth_chainId y rate limits
const staticNetwork = ethers.Network.from({
  chainId: NETWORK.chainId,
  name: NETWORK.name
});

let _publicProvider = null;
function getPublicProvider() {
  if (!_publicProvider) {
    _publicProvider = new ethers.JsonRpcProvider(NETWORK.rpcUrls[0], staticNetwork, {
      staticNetwork: staticNetwork
    });
  }
  return _publicProvider;
}

let _contract = null;
let _readContract = null;

/** Inicializa el contrato con signer (lectura + escritura). */
export function getWriteContract() {
  if (_contract) return _contract;
  _contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, getSigner());
  return _contract;
}

/** Inicializa el contrato solo con provider (lectura, sin wallet). */
function getReadContract() {
  if (_readContract) return _readContract;
  _readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, getPublicProvider());
  return _readContract;
}

/** Invalida la instancia del contrato (útil al cambiar de cuenta). */
export function resetContract() {
  _contract = null;
  _readContract = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function withRetry(fn, retries = 3, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTURA (view / pure)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna los datos completos del usuario desde el contrato.
 * @param {string} address
 * @returns {Promise<{
 *   totalPoints: number,
 *   lastGmDay: number,
 *   currentStreak: number,
 *   forkLevel: number,
 *   gmCount: number,
 *   nodeCommitment: boolean,
 *   nodeConviction: boolean,
 *   nodeLegacy: boolean,
 *   exists: boolean,
 *   attachedAgentId: number,
 * }>}
 */
export async function getUserData(address) {
  return withRetry(async () => {
    const contract = getReadContract();
    const raw = await contract.getUserData(address);
    return {
      totalPoints:    Number(raw.totalPoints),
      lastGmDay:      Number(raw.lastGmDay),
      currentStreak:  Number(raw.currentStreak),
      forkLevel:      Number(raw.forkLevel),
      gmCount:        Number(raw.gmCount),
      nodeCommitment: raw.nodeCommitment,
      nodeConviction: raw.nodeConviction,
      nodeLegacy:     raw.nodeLegacy,
      exists:         raw.exists,
      attachedAgentId: Number(raw.attachedAgentId),
    };
  });
}

/**
 * Carga todos los datos del dashboard de usuario (UserData, GMCost y hasGMToday)
 * en una sola peticion RPC utilizando Multicall3.
 */
export async function loadUserDashboardData(address) {
  return withRetry(async () => {
    const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';
    const multicallAbi = ["function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) public view returns (tuple(bool success, bytes returnData)[] returnData)"];
    
    const publicProvider = getPublicProvider();
    const multicall = new ethers.Contract(MULTICALL3_ADDRESS, multicallAbi, publicProvider);
    const iface = new ethers.Interface(CONTRACT_ABI);

    const calls = [
      { target: CONTRACT_ADDRESS, callData: iface.encodeFunctionData('getUserData', [address]) },
      { target: CONTRACT_ADDRESS, callData: iface.encodeFunctionData('getGMCost', [address]) },
      { target: CONTRACT_ADDRESS, callData: iface.encodeFunctionData('hasGMToday', [address]) }
    ];

    const results = await multicall.tryAggregate(true, calls);

    const userDataRaw = iface.decodeFunctionResult('getUserData', results[0].returnData);
    const gmCostRaw = iface.decodeFunctionResult('getGMCost', results[1].returnData);
    const hasGMTodayRaw = iface.decodeFunctionResult('hasGMToday', results[2].returnData)[0];

    return {
      userData: {
        totalPoints:    Number(userDataRaw.totalPoints),
        lastGmDay:      Number(userDataRaw.lastGmDay),
        currentStreak:  Number(userDataRaw.currentStreak),
        forkLevel:      Number(userDataRaw.forkLevel) === 0 ? 1 : Number(userDataRaw.forkLevel),
        gmCount:        Number(userDataRaw.gmCount),
        nodeCommitment: userDataRaw.nodeCommitment,
        nodeConviction: userDataRaw.nodeConviction,
        nodeLegacy:     userDataRaw.nodeLegacy,
        exists:         userDataRaw.exists,
        attachedAgentId: Number(userDataRaw.attachedAgentId),
      },
      gmCost: {
        gmCost: gmCostRaw.gmCost,
        debtCost: gmCostRaw.debtCost,
        total: gmCostRaw.gmCost + gmCostRaw.debtCost
      },
      gmDoneToday: hasGMTodayRaw
    };
  });
}

/**
 * Retorna el costo del GM y la deuda acumulada en wei.
 * @param {string} address
 * @returns {Promise<{gmCost: bigint, debtCost: bigint, total: bigint}>}
 */
export async function getGMCost(address) {
  return withRetry(async () => {
    const contract = getReadContract();
    const [gmCost, debtCost] = await contract.getGMCost(address);
    return {
      gmCost,
      debtCost,
      total: gmCost + debtCost,
    };
  });
}

/**
 * Costo de activar un nodo al instante (en wei).
 * @param {number} nodeId - 1, 2 o 3
 * @param {string} address
 * @returns {Promise<bigint>}
 */
export async function getNodeInstantCost(nodeId, address) {
  return withRetry(async () => {
    const contract = getReadContract();
    return contract.getNodeInstantCost(nodeId, address);
  });
}

/**
 * Verifica si el usuario ya hizo GM hoy (UTC).
 * @param {string} address
 * @returns {Promise<boolean>}
 */
export async function hasGMToday(address) {
  return withRetry(async () => {
    const contract = getReadContract();
    return contract.hasGMToday(address);
  });
}

/**
 * Verifica si el usuario puede activar un nodo por racha.
 * @param {number} nodeId
 * @param {string} address
 * @returns {Promise<boolean>}
 */
export async function canActivateByStreak(nodeId, address) {
  return withRetry(async () => {
    const contract = getReadContract();
    return contract.canActivateByStreak(nodeId, address);
  });
}

/**
 * Verifica si el usuario tiene Runestone (Super GM) activo.
 * @param {string} address
 * @returns {Promise<boolean>}
 */
export async function hasRunestone(address) {
  const contract = getReadContract();
  return contract.hasRunestone(address);
}

/**
 * Retorna el día UTC actual del contrato.
 * @returns {Promise<number>}
 */
export async function getCurrentUTCDay() {
  const contract = getReadContract();
  return Number(await contract.getCurrentUTCDay());
}

/**
 * Retorna los días transcurridos desde el último GM.
 * @param {string} address
 * @returns {Promise<number>}
 */
export async function getDaysSinceLastGM(address) {
  const contract = getReadContract();
  return Number(await contract.getDaysSinceLastGM(address));
}

// getTopUsers fue movido a la lógica del Cloudflare Worker para escalabilidad, 
// pero mantenemos un fallback on-chain por si el worker falla.
export async function getTopUsersFallback(total) {
  if (!total || total === 0) return [];

  const usersData = [];
  try {
    // 1. Obtenemos direcciones unicas desde Arcscan API
    const res = await fetch(`https://testnet.arcscan.app/api/v2/addresses/${CONTRACT_ADDRESS}/transactions`);
    if (!res.ok) throw new Error("Arcscan API fallo");
    const data = await res.json();
    const addrs = [...new Set(data.items.map(t => t.from.hash))].slice(0, 100); // Limite seguro 100
    
    // 2. Usamos Multicall3 nativo de Arc Testnet para leer a todos de un solo golpe
    const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';
    const multicallAbi = ["function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) public view returns (tuple(bool success, bytes returnData)[] returnData)"];
    
    const publicProvider = getPublicProvider();
    const multicall = new ethers.Contract(MULTICALL3_ADDRESS, multicallAbi, publicProvider);
    
    const iface = new ethers.Interface(CONTRACT_ABI);
    
    // Preparamos las llamadas
    const calls = addrs.map(addr => ({
      target: CONTRACT_ADDRESS,
      callData: iface.encodeFunctionData('getUserData', [addr])
    }));

    // 3. 1 sola peticion RPC para todas las wallets
    const results = await multicall.tryAggregate(false, calls);

    // 4. Decodificamos
    results.forEach((result, i) => {
      if (result.success && result.returnData !== '0x') {
        const decoded = iface.decodeFunctionResult('getUserData', result.returnData);
        const exists = decoded.exists;
        if (exists) {
          usersData.push({
            address: addrs[i],
            points: Number(decoded.totalPoints),
            forkLevel: Number(decoded.forkLevel) === 0 ? 1 : Number(decoded.forkLevel),
            nodeCommitment: decoded.nodeCommitment,
            nodeConviction: decoded.nodeConviction,
            nodeLegacy: decoded.nodeLegacy,
          });
        }
      }
    });

  } catch (error) {
    console.error("Fallback Multicall fallo:", error);
  }
  
  return usersData.sort((a, b) => b.points - a.points);
}

/**
 * Retorna el baseGMCost del contrato en wei.
 * @returns {Promise<bigint>}
 */
export async function getBaseGMCost() {
  const contract = getReadContract();
  return contract.baseGMCost();
}

/**
 * Retorna la cantidad total de usuarios registrados.
 * @returns {Promise<number>}
 */
export async function getUserCount() {
  const contract = getReadContract();
  return Number(await contract.getUserCount());
}

// ─────────────────────────────────────────────────────────────────────────────
// ESCRITURA (transacciones)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Realiza el GM diario.
 * Calcula el costo on-chain y lo envía como msg.value.
 * @param {string} address - Dirección del usuario
 * @returns {Promise<ethers.TransactionReceipt>}
 */
export async function doGM(address) {
  const contract = getWriteContract();

  // Obtener costo actual
  const { total } = await getGMCost(address);

  // Pequeño buffer del 0.5% para evitar errores por bloques intermedios
  const value = total + (total * BigInt(5) / BigInt(1000));

  const tx = await contract.doGM({ value });
  return tx.wait();
}

/**
 * Activa un nodo pagando la tarifa instantánea.
 * @param {number} nodeId - 1, 2 o 3
 * @param {string} address
 * @returns {Promise<ethers.TransactionReceipt>}
 */
export async function activateNodeInstant(nodeId, address) {
  const contract = getWriteContract();
  const cost = await getNodeInstantCost(nodeId, address);
  const tx = await contract.activateNodeInstant(nodeId, { value: cost });
  return tx.wait();
}

/**
 * Activa un nodo por racha (todos los usuarios pagan baseGMCost).
 * @param {number} nodeId - 1, 2 o 3
 * @param {string} address
 * @returns {Promise<ethers.TransactionReceipt>}
 */
export async function activateNodeByStreak(nodeId, address) {
  const contract = getWriteContract();
  // Todos pagan el costo base al activar por racha (tanto B1 como B2+)
  const value = CONSTANTS.BASE_GM_COST_WEI;
  const tx = await contract.activateNodeByStreak(nodeId, { value });
  return tx.wait();
}

/**
 * Resetea la bifurcación a B1 (VIP) y desactiva todos los nodos.
 * @returns {Promise<ethers.TransactionReceipt>}
 */
export async function resetToVIP() {
  const contract = getWriteContract();
  const tx = await contract.resetToVIP();
  return tx.wait();
}

/**
 * Vincula un agente de IA al perfil del usuario.
 * @param {string} agentId - El ID del agente NFT (ERC-8004).
 * @returns {Promise<ethers.TransactionReceipt>}
 */
export async function attachAgent(agentId) {
  const contract = getWriteContract();
  const tx = await contract.attachAgent(agentId);
  return tx.wait();
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formatea un error de contrato o transacción en un mensaje legible.
 * @param {Error} err
 * @returns {string}
 */
export function parseContractError(err) {
  // Reason de revert
  if (err.reason) return err.reason;

  // Mensaje estándar de ethers v6
  if (err.shortMessage) return err.shortMessage;

  // Error de JSON-RPC con data
  const msg = err.message || '';
  const match = msg.match(/reason="([^"]+)"/);
  if (match) return match[1];

  // Signal: prefix en mensajes custom del contrato
  const signalMatch = msg.match(/Signal: ([^"]+)/);
  if (signalMatch) return signalMatch[1];

  // Genérico
  if (msg.includes('insufficient funds')) return 'Fondos insuficientes en tu wallet.';
  if (msg.includes('user rejected'))      return 'Transacción rechazada por el usuario.';

  return 'Error desconocido. Revisa la consola para más detalles.';
}

/**
 * Formatea wei → USDC legible (ej: "0.01 USDC").
 * @param {bigint} wei
 * @param {number} [dp=4]
 */
export function weiToUSDC(wei, dp = 4) {
  return `${parseFloat(ethers.formatUnits(wei, 18)).toFixed(dp)} USDC`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTODETECCIÓN DE AGENTES (OPCIÓN B)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca en la blockchain todos los Agentes (ERC-8004) que posee una wallet.
 * Utiliza los eventos Transfer del IdentityRegistry oficial de Arc.
 * @param {string} address - Dirección de la wallet
 * @returns {Promise<bigint[]>} - Array de IDs de Agentes (como BigInt)
 */
export async function fetchUserAgents(address) {
  try {
    const registryAddr = "0x8004A818BFB912233c491871b3d84c89A494BD9e".toLowerCase();
    const tokens = await fetchUserTokens(address);
    
    // Filtramos los tokens que pertenecen al contrato IdentityRegistry
    const agentTokens = tokens.filter(t => t.token?.address?.toLowerCase() === registryAddr);
    
    if (agentTokens.length === 0) return [];
    
    // Extraemos los IDs, los parseamos a BigInt y ordenamos
    const ownedIds = agentTokens.map(t => BigInt(t.id)).sort((a, b) => (a < b ? -1 : 1));
    return ownedIds;
  } catch (err) {
    console.error("[fetchUserAgents] Error buscando agentes:", err);
    return []; // Retorna vacío si falla la API
  }
}
