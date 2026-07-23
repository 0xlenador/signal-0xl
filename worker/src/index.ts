import { ethers } from 'ethers';

export interface Env {
  RANKING_DB: D1Database;
  RPC_URL: string;
  CONTRACT_ADDRESS: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=60, s-maxage=60" // Escudo de Caché de 60 segundos
};

export default {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. HTTP ENDPOINTS (API REST Ultra-rápida protegida por Caché)
  // ─────────────────────────────────────────────────────────────────────────
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      // Ruta: /api/leaderboard -> Devuelve el Top 100
      if (url.pathname === "/api/leaderboard" || url.pathname === "/") {
        const { results } = await env.RANKING_DB.prepare(
          "SELECT address, points, forkLevel FROM users ORDER BY points DESC LIMIT 100"
        ).all();
        
        return new Response(JSON.stringify(results), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Ruta: /api/user/:address -> Devuelve datos y rango global de un usuario
      if (url.pathname.startsWith("/api/user/")) {
        const address = url.pathname.split("/").pop()?.toLowerCase();
        
        // Validación básica usando regex simple para no depender de ethers aquí si es posible (optimización)
        if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
          return new Response(JSON.stringify({ error: "Invalid address format" }), { status: 400, headers: corsHeaders });
        }

        // 1. Buscar al usuario
        const user: any = await env.RANKING_DB.prepare(
          "SELECT * FROM users WHERE address = ?"
        ).bind(address).first();

        if (!user) {
          return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: corsHeaders });
        }

        // 2. Calcular su rango global (cuántas personas tienen más puntos que él + 1)
        const rankData: any = await env.RANKING_DB.prepare(
          "SELECT COUNT(*) as higherCount FROM users WHERE points > ?"
        ).bind(user.points).first();

        const rank = (rankData?.higherCount || 0) + 1;

        return new Response(JSON.stringify({ ...user, rank }), {
          status: 200,
          headers: corsHeaders
        });
      }

      return new Response(JSON.stringify({ error: "Endpoint Not found" }), { status: 404, headers: corsHeaders });

    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders
      });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. CRON JOB (El Sincronizador de GMDone)
  // ─────────────────────────────────────────────────────────────────────────
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log("Iniciando Cron Job de Sincronización...");
    
    // Configuración Segura de Ingeniería (Resilient Batching)
    const MAX_ITERATIONS = 5;
    const CHUNK_SIZE = 1000; // Reducido a 1000 para evitar Rate Limits estrictos en nodos públicos
    const CONFIRMATION_DELAY = 10;
    const GENESIS_BLOCK = 53000000; // Aprox 16 de Julio de 2026 (Seguro para contrato del 18 de Julio)
    
    try {
      // Usamos staticNetwork y pasamos el Chain ID explícito (5042002) para evitar que
      // ethers haga peticiones extra de 'eth_chainId' que saturan el Rate Limit.
      const provider = new ethers.JsonRpcProvider(env.RPC_URL, 5042002, { staticNetwork: true });
      
      // ABI mínimo para leer el evento GMDone
      const SIGNAL_ABI = [
        "event GMDone(address indexed user, uint256 pointsEarned, uint256 totalPoints, uint256 streak, uint256 forkLevel, bool superGM)"
      ];
      const contract = new ethers.Contract(env.CONTRACT_ADDRESS, SIGNAL_ABI, provider);

      // 1. Obtener el cursor (último bloque procesado) de SQL
      const stateRow: any = await env.RANKING_DB.prepare(
        "SELECT lastProcessedBlock FROM sync_state WHERE id = 1"
      ).first();
      
      let lastProcessedBlock = stateRow ? stateRow.lastProcessedBlock : GENESIS_BLOCK;

      // 2. Obtener el bloque actual del RPC y aplicar Confirmation Delay
      const currentBlock = await provider.getBlockNumber();
      const safeBlock = currentBlock - CONFIRMATION_DELAY;

      if (lastProcessedBlock >= safeBlock) {
        console.log("No hay bloques seguros nuevos para procesar.");
        return;
      }

      console.log(`Sincronizando desde el bloque ${lastProcessedBlock + 1} hasta ${safeBlock}`);

      // 3. Resilient Batch Processing (Bucle Seguro)
      let fromBlock = lastProcessedBlock + 1;
      let iterations = 0;
      
      while (fromBlock <= safeBlock && iterations < MAX_ITERATIONS) {
        const toBlock = Math.min(fromBlock + CHUNK_SIZE - 1, safeBlock);
        console.log(`Iteración ${iterations + 1}: Procesando chunk ${fromBlock} a ${toBlock}...`);

        const filter = contract.filters.GMDone();
        const logs = await contract.queryFilter(filter, fromBlock, toBlock);

        // Si hay eventos en este bloque, preparamos las sentencias SQL de Upsert
        if (logs.length > 0) {
          console.log(`¡Se encontraron ${logs.length} eventos GMDone en este chunk!`);
          
          const statements = [];
          for (const log of logs) {
            const userAddress = (log as any).args[0].toLowerCase();
            const totalPoints = Number((log as any).args[2]);
            const forkLevel = Number((log as any).args[4]);
            const finalForkLevel = forkLevel === 0 ? 1 : forkLevel;

            // Upsert SQLite: Si la address no existe, se crea. Si existe, actualiza sus puntos.
            const stmt = env.RANKING_DB.prepare(
              `INSERT INTO users (address, points, forkLevel) VALUES (?, ?, ?)
               ON CONFLICT(address) DO UPDATE SET 
                  points=excluded.points, 
                  forkLevel=excluded.forkLevel, 
                  lastUpdated=CURRENT_TIMESTAMP`
            ).bind(userAddress, totalPoints, finalForkLevel);
            
            statements.push(stmt);
          }
          
          // Ejecutamos todos los upserts de los usuarios del chunk en un solo lote rápido
          await env.RANKING_DB.batch(statements);
        }

        // Guardamos el avance del cursor después de cada chunk exitoso
        await env.RANKING_DB.prepare(
          `INSERT INTO sync_state (id, lastProcessedBlock) VALUES (1, ?)
           ON CONFLICT(id) DO UPDATE SET lastProcessedBlock = excluded.lastProcessedBlock`
        ).bind(toBlock).run();

        // Avanzar bucle
        fromBlock = toBlock + 1;
        iterations++;
      }

      if (fromBlock <= safeBlock) {
        console.log("Límite de iteraciones alcanzado. El cron continuará el próximo minuto para evitar Timeout.");
      } else {
        console.log("¡Sincronización 100% al día!");
      }

    } catch (error) {
      console.error("Error crítico en Cron Job:", error);
      // El worker muere silenciosamente aquí, pero gracias al guardado por Chunks, 
      // el progreso anterior ya está a salvo en la base de datos D1.
    }
  }
};
