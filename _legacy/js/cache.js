/**
 * cache.js — Signal 0xL
 * Caché con TTL sobre LocalStorage.
 * Evita consumo innecesario de créditos de Blockscout al recargar la página.
 *
 * Uso:
 *   Cache.set('my_key', data);           // guarda con TTL por defecto
 *   Cache.set('my_key', data, 60_000);   // guarda con TTL de 60 segundos
 *   Cache.get('my_key', 60_000);         // lee si no expiró
 *   Cache.invalidate('my_key');          // borra la entrada
 *   Cache.invalidatePrefix('signal_txs'); // borra todas las que empiecen con prefijo
 */

const NAMESPACE = 'signal_';

export const Cache = {
  /**
   * Guarda un valor en localStorage con TTL.
   * @param {string} key  - Clave (sin namespace)
   * @param {*} data      - Dato serializable a JSON
   * @param {number} [ttl=300000] - Tiempo de vida en ms (default 5 min)
   */
  set(key, data, ttl = 300_000) {
    try {
      const entry = {
        data,
        expiresAt: Date.now() + ttl,
      };
      localStorage.setItem(NAMESPACE + key, JSON.stringify(entry));
    } catch (e) {
      // localStorage lleno u otro error — silencioso para no romper el flujo
      console.warn('[Cache] Error al guardar:', key, e);
    }
  },

  /**
   * Lee un valor del caché si no expiró.
   * @param {string} key - Clave (sin namespace)
   * @returns {*} Dato cacheado, o null si expiró o no existe
   */
  get(key) {
    try {
      const raw = localStorage.getItem(NAMESPACE + key);
      if (!raw) return null;

      const entry = JSON.parse(raw);
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(NAMESPACE + key);
        return null;
      }
      return entry.data;
    } catch (e) {
      console.warn('[Cache] Error al leer:', key, e);
      return null;
    }
  },

  /**
   * Elimina una entrada específica del caché.
   * @param {string} key
   */
  invalidate(key) {
    localStorage.removeItem(NAMESPACE + key);
  },

  /**
   * Elimina todas las entradas cuya clave empiece con `prefix`.
   * @param {string} prefix
   */
  invalidatePrefix(prefix) {
    const fullPrefix = NAMESPACE + prefix;
    const toDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(fullPrefix)) toDelete.push(k);
    }
    toDelete.forEach(k => localStorage.removeItem(k));
  },

  /**
   * Limpia todo el caché de Signal 0xL.
   */
  clear() {
    const toDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(NAMESPACE)) toDelete.push(k);
    }
    toDelete.forEach(k => localStorage.removeItem(k));
    console.log('[Cache] Caché limpiado:', toDelete.length, 'entradas eliminadas');
  },

  /**
   * Retorna estadísticas del caché actual.
   */
  stats() {
    let count = 0;
    let expired = 0;
    const entries = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(NAMESPACE)) continue;
      count++;
      try {
        const entry = JSON.parse(localStorage.getItem(k));
        const isExpired = Date.now() > entry.expiresAt;
        if (isExpired) expired++;
        entries.push({ key: k.replace(NAMESPACE, ''), isExpired, expiresAt: new Date(entry.expiresAt).toISOString() });
      } catch {}
    }
    return { count, expired, entries };
  },
};
