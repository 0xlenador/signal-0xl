/**
 * ranking.js — Signal 0xL
 * Obtiene y renderiza la tabla de ranking de Signal 0xL.
 * Fuente de datos: contrato on-chain (getTopUsers).
 */

import { getUserCount, getTopUsersFallback } from './contract.js';
import { Cache } from './cache.js';
import { CONSTANTS } from './config.js';
import { t } from './i18n.js';
import { renderIcons } from './icons.js';

const { CACHE_TTL } = CONSTANTS;

let lastSuccessfulRanking = null;

export async function fetchRanking() {
  const cacheKey = `ranking_cf`;
  const cached = Cache.get(cacheKey);
  if (cached) return cached;

  let total = 0;
  let users = [];

  try {
    try {
      total = Number(await getUserCount());
    } catch (e) {
      console.warn("Fallo getUserCount, usando fallback de Arcscan...", e);
      total = 1; // Forzar para pasar al fallback de Arcscan
    }

    if (total > 0) {
      console.log("Activando fallback on-chain para obtener el ranking desde Arcscan...");
      users = await getTopUsersFallback(total);
    }

    const result = { users, total: users.length || total };
    Cache.set(cacheKey, result, 60); 
    lastSuccessfulRanking = result; // Guardar copia persistente
    return result;
  } catch (error) {
    console.error("fetchRanking fallo:", error);
    if (lastSuccessfulRanking) {
      console.warn("Sirviendo copia cacheada persistente del ranking tras fallo RPC.");
      return lastSuccessfulRanking;
    }
    throw error;
  }
}

/**
 * Renderiza la tabla de ranking dentro del elemento `containerId`.
 * @param {string} containerId - ID del elemento DOM contenedor
 * @param {string} [currentAddress] - Dirección del usuario conectado (para resaltar)
 */
export async function renderRanking(containerId, currentAddress = null, currentUserData = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Evitar parpadeo si ya hay una tabla renderizada (util para el auto-refresh)
  if (!container.querySelector('.ranking-table')) {
    container.innerHTML = `<p class="loading-text">${t('ranking.loading')}</p>`;
  }

  try {
    const { users, total } = await fetchRanking();

    // -- INYECCIÓN HÍBRIDA (Tiempo Real Local) --
    if (currentAddress && currentUserData && currentUserData.exists) {
      // Buscamos si el usuario ya está en la tabla descargada
      const existingIdx = users.findIndex(u => u.address.toLowerCase() === currentAddress.toLowerCase());
      const realTimePoints = Number(currentUserData.totalPoints);
      const realTimeFork = Number(currentUserData.forkLevel) == 0 ? 1 : Number(currentUserData.forkLevel);
      
      if (existingIdx !== -1) {
        // Si ya está, actualizamos sus puntos
        users[existingIdx].points = realTimePoints;
        users[existingIdx].forkLevel = realTimeFork;
        users[existingIdx].nodeCommitment = currentUserData.nodeCommitment;
        users[existingIdx].nodeConviction = currentUserData.nodeConviction;
        users[existingIdx].nodeLegacy = currentUserData.nodeLegacy;
      } else {
        // Si no está (ej. estaba fuera del Top 100), lo añadimos a la lista
        users.push({
          address: currentAddress,
          points: realTimePoints,
          forkLevel: realTimeFork,
          nodeCommitment: currentUserData.nodeCommitment,
          nodeConviction: currentUserData.nodeConviction,
          nodeLegacy: currentUserData.nodeLegacy
        });
      }
      
      // Reordenamos la lista localmente para que el usuario "suba" al instante
      users.sort((a, b) => b.points - a.points);
    }
    // ------------------------------------------

    if (!users || users.length === 0) {
      container.innerHTML = `<p class="empty-text">${t('ranking.noData')} (Esperando sincronización de Cloudflare)</p>`;
      return;
    }

    const rows = users.map((u, i) => {
      const isMe = currentAddress && u.address.toLowerCase() === currentAddress.toLowerCase();
      const shortAddr = `${u.address.slice(0, 6)}...${u.address.slice(-4)}`;
      const rank = i + 1;
      const rankIcon = rank === 1 ? '<i data-lucide="trophy" class="w-4 h-4 text-yellow-400"></i>' : 
                       rank === 2 ? '<i data-lucide="medal" class="w-4 h-4 text-gray-300"></i>' : 
                       rank === 3 ? '<i data-lucide="medal" class="w-4 h-4 text-amber-600"></i>' : 
                       `#${rank}`;
      let badges = [];
      if (u.forkLevel <= 1) badges.push('<span class="badge badge-vip text-[0.55rem] px-1 py-0" title="VIP">VIP</span>');
      if (u.nodeCommitment) badges.push('<span title="Commitment"><i data-lucide="microscope" class="w-4 h-4 text-accent-primary"></i></span>');
      if (u.nodeConviction) badges.push('<span title="Conviction"><i data-lucide="gem" class="w-4 h-4 text-accent-primary"></i></span>');
      if (u.nodeLegacy) badges.push('<span title="Legacy"><i data-lucide="landmark" class="w-4 h-4 text-accent-primary"></i></span>');
      if (u.nodeCommitment && u.nodeConviction && u.nodeLegacy) badges.push('<span title="Runestone"><i data-lucide="flame" class="w-4 h-4 text-[#ff6600]"></i></span>');
      
      const badgesHtml = `<div class="flex items-center justify-start gap-1.5">${badges.join('')}</div>`;

      return `
        <tr class="${isMe ? 'row-highlight' : ''}">
          <td class="rank-cell text-center align-middle">${rankIcon}</td>
          <td class="addr-cell">
            <span class="addr-text" title="${u.address}">${shortAddr}</span>
            ${isMe ? `<span class="badge badge-me">${t('js.you')}</span>` : ''}
          </td>
          <td class="badges-cell text-left align-middle">${badgesHtml}</td>
          <td class="points-cell text-right align-middle"><strong>${u.points.toLocaleString()}</strong> pts</td>
          <td class="fork-cell text-center align-middle font-bold text-text-muted">B${u.forkLevel}</td>
        </tr>
      `;
    }).join('');

    // Actualizar el conteo de usuarios en el header de index.html
    const totalCountEl = document.getElementById('ranking-total-count');
    if (totalCountEl) totalCountEl.innerHTML = `${total} ${t('ranking.registered')}`;

    container.innerHTML = `
      <div class="table-wrapper">
        <table class="ranking-table w-full">
          <thead>
            <tr class="text-text-muted text-[0.65rem] uppercase tracking-wider">
              <th class="py-3 px-2 font-medium text-center"><div class="flex items-center justify-center gap-1"><i data-lucide="hash" class="w-3.5 h-3.5"></i></div></th>
              <th class="py-3 px-2 font-medium text-left"><div class="flex items-center justify-start gap-1"><i data-lucide="wallet" class="w-3.5 h-3.5"></i> ${t('js.rankingHeaders')[1]}</div></th>
              <th class="py-3 px-2 font-medium text-left"><div class="flex items-center justify-start gap-1"><i data-lucide="award" class="w-3.5 h-3.5"></i> Badges</div></th>
              <th class="py-3 px-2 font-medium text-right"><div class="flex items-center justify-end gap-1"><i data-lucide="star" class="w-3.5 h-3.5"></i> ${t('js.rankingHeaders')[2]}</div></th>
              <th class="py-3 px-2 font-medium text-center"><div class="flex items-center justify-center gap-1"><i data-lucide="git-branch" class="w-3.5 h-3.5"></i> ${t('js.rankingHeaders')[3]}</div></th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
    
    renderIcons();

  } catch (err) {
    console.error('[Ranking] Error:', err);
    container.innerHTML = `<p class="error-text flex items-center justify-center gap-2"><i data-lucide="circle-x" class="w-4 h-4"></i> ${t('js.error')} ${err.message}</p>`;
    renderIcons();
  }
}
