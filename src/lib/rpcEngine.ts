import { NETWORK } from './config';

/**
 * Motor de balanceo de carga (Round-Robin) para las lecturas RPC HTTP y WebSocket.
 */

// Punteros para iterar circularmente sobre los arrays de URLs
let httpIndex = 0;
let wsIndex = 0;

/**
 * Retorna la siguiente URL HTTP del array de forma circular.
 */
export function getNextHttpRpc(): string {
  const urls = NETWORK.rpcUrls as readonly string[];
  if (!urls || urls.length === 0) return '';
  
  const url = urls[httpIndex];
  httpIndex = (httpIndex + 1) % urls.length;
  return url;
}

/**
 * Retorna la siguiente URL WebSocket del array de forma circular.
 */
export function getNextWsRpc(): string {
  const urls = NETWORK.wsUrls as readonly string[];
  if (!urls || urls.length === 0) return '';
  
  const url = urls[wsIndex];
  wsIndex = (wsIndex + 1) % urls.length;
  return url;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Ejecuta un fetch y, si falla, reintenta automáticamente usando el siguiente RPC
 * de la lista proporcionada. Ideal para llamadas manuales como Blockscout fallback.
 * 
 * @param urls Array de URLs a intentar secuencialmente.
 * @param requestOptions Opciones estándar de fetch.
 * @returns La respuesta de fetch.
 */
export async function fetchWithFallback(urls: readonly string[], requestOptions?: RequestInit): Promise<Response> {
  let lastError: Error | unknown;

  for (const url of urls) {
    try {
      const response = await fetch(url, requestOptions);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`HTTP Error: ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    // Si falla, el loop continúa e intenta con la siguiente URL
    // Se añade un retraso para evitar disparar el Rate Limit del próximo RPC y saturar la red
    await sleep(300);
  }

  throw lastError || new Error("All fallback URLs failed");
}
