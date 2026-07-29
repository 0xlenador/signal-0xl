import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createPublicClient, http, defineChain, parseAbiItem } from 'viem';
import { drizzle } from 'drizzle-orm/d1';
import { desc, eq, count, gt, sql } from 'drizzle-orm';
import { users, syncState } from './db/schema';

export interface Env {
  RANKING_DB: D1Database;
  RPC_URL: string;
  CONTRACT_ADDRESS: string;
  GENESIS_BLOCK: string;
  CHAIN_ID: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware CORS
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 60
}));

// ─────────────────────────────────────────────────────────────────────────
// 1. HTTP ENDPOINTS (API REST Ultra-rápida protegida por Caché)
// ─────────────────────────────────────────────────────────────────────────

app.get('/', async (c) => {
  return c.redirect('/api/leaderboard');
});

// Ruta: /api/leaderboard -> Devuelve el Top 100
app.get('/api/leaderboard', async (c) => {
  try {
    // Usamos SQL nativo (Raw SQL) para evitar el overhead de CPU de Drizzle ORM
    const { results } = await c.env.RANKING_DB.prepare(
      "SELECT address, points, forkLevel FROM users ORDER BY points DESC LIMIT 100"
    ).all();
    
    return c.json(results, 200, {
      "Cache-Control": "public, max-age=60, s-maxage=60" 
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Esquema Zod para validar la wallet address en la URL
const addressParamSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Formato de dirección inválido')
});

// Ruta: /api/user/:address -> Devuelve datos y rango global
app.get(
  '/api/user/:address',
  zValidator('param', addressParamSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: result.error.issues[0].message }, 400);
    }
  }),
  async (c) => {
    try {
      const { address } = c.req.valid('param');
      const lowerAddress = address.toLowerCase();
      
      // Usamos SQL nativo para evitar overhead
      const user: any = await c.env.RANKING_DB.prepare(
        "SELECT * FROM users WHERE address = ? LIMIT 1"
      ).bind(lowerAddress).first();

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Calcular rango
      const rankData: any = await c.env.RANKING_DB.prepare(
        "SELECT COUNT(*) as higherCount FROM users WHERE points > ?"
      ).bind(user.points).first();

      const rank = (rankData?.higherCount || 0) + 1;

      return c.json({ ...user, rank });
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }
);

// Ruta secreta solo para desarrollo: Permite disparar el cron manualmente desde el navegador
app.get('/__scheduled', async (c) => {
  try {
    // Ejecutamos la función del cron de forma manual
    c.executionCtx.waitUntil(runCron({} as any, c.env, c.executionCtx as any));
    return c.text("Cron Job disparado en segundo plano. Revisa la consola de tu terminal.");
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// 2. CRON JOB (El Sincronizador de GMDone)
// ─────────────────────────────────────────────────────────────────────────
async function runCron(event: any, env: Env, ctx: ExecutionContext): Promise<void> {
  console.log("Iniciando Cron Job de Sincronización...");
  
  const MAX_ITERATIONS = 10;  // Aumentamos iteraciones
  const CHUNK_SIZE = 100n;    // Reducimos el tamaño de bloque a 100 para evitar "request limit reached"
  const CONFIRMATION_DELAY = 10n;
  const GENESIS_BLOCK = BigInt(env.GENESIS_BLOCK) || 52000000n;
  
  // Función auxiliar para pausas
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
  
  try {
    const arcTestnet = defineChain({
      id: Number(env.CHAIN_ID) || 5042002,
      name: 'Arc Testnet',
      network: 'arc-testnet',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [env.RPC_URL] },
        public: { http: [env.RPC_URL] }
      }
    });

    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(env.RPC_URL, {
        retryCount: 3,
        retryDelay: 1000,
        timeout: 10000
      })
    });

    const GMDoneEvent = parseAbiItem('event GMDone(address indexed user, uint256 pointsEarned, uint256 totalPoints, uint256 streak, uint256 forkLevel, bool superGM)');

    const db = drizzle(env.RANKING_DB);

    // Obtener cursor con Drizzle
    const [stateRow] = await db
      .select({ lastProcessedBlock: syncState.lastProcessedBlock })
      .from(syncState)
      .where(eq(syncState.id, 1))
      .limit(1);
    
    let lastProcessedBlock = stateRow ? BigInt(stateRow.lastProcessedBlock) : GENESIS_BLOCK;

    const currentBlock = await publicClient.getBlockNumber();
    const safeBlock = currentBlock - CONFIRMATION_DELAY;

    if (lastProcessedBlock >= safeBlock) {
      console.log("No hay bloques seguros nuevos para procesar.");
      return;
    }

    console.log(`Sincronizando desde el bloque ${lastProcessedBlock + 1n} hasta ${safeBlock}`);

    let fromBlock = lastProcessedBlock + 1n;
    let iterations = 0;
    
    while (fromBlock <= safeBlock && iterations < MAX_ITERATIONS) {
      let toBlock = fromBlock + CHUNK_SIZE - 1n;
      if (toBlock > safeBlock) {
        toBlock = safeBlock;
      }
      
      console.log(`Iteración ${iterations + 1}: Procesando chunk ${fromBlock} a ${toBlock}...`);

      const logs = await publicClient.getLogs({
        event: GMDoneEvent,
        fromBlock,
        toBlock
      });

      if (logs.length > 0) {
        console.log(`¡Se encontraron ${logs.length} eventos GMDone en este chunk!`);
        
        // D1 Driver supporta db.batch
        const batchUpserts = [];
        for (const log of logs) {
          if (!log.args.user || log.args.totalPoints === undefined || log.args.forkLevel === undefined) continue;

          const userAddress = log.args.user.toLowerCase();
          const totalPoints = Number(log.args.totalPoints);
          const forkLevel = Number(log.args.forkLevel);
          const finalForkLevel = forkLevel === 0 ? 1 : forkLevel;

          batchUpserts.push(
            db.insert(users)
              .values({ address: userAddress, points: totalPoints, forkLevel: finalForkLevel })
              .onConflictDoUpdate({
                target: users.address,
                set: {
                  points: totalPoints,
                  forkLevel: finalForkLevel,
                  lastUpdated: sql`CURRENT_TIMESTAMP`
                }
              })
          );
        }
        
        if (batchUpserts.length > 0) {
          await db.batch(batchUpserts as any); // Batch ejecuta todas las queries
        }
      }

      await db.insert(syncState)
        .values({ id: 1, lastProcessedBlock: Number(toBlock) })
        .onConflictDoUpdate({
          target: syncState.id,
          set: { lastProcessedBlock: Number(toBlock) }
        });

      fromBlock = toBlock + 1n;
      iterations++;
      
      // Pequeña pausa de 2 segundos entre peticiones para respirar y respetar el Rate Limit del RPC
      await delay(2000);
    }

    if (fromBlock <= safeBlock) {
      console.log("Límite de iteraciones alcanzado.");
    } else {
      console.log("¡Sincronización 100% al día!");
    }

  } catch (error) {
    console.error("Error crítico en Cron Job:", error);
  }
}

// Se extrae la configuración del worker a una constante para mayor claridad
const workerExport = {
  fetch: app.fetch,
  scheduled: runCron
};

export default workerExport;

