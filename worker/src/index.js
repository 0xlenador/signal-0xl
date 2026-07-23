import { ethers } from 'ethers';

// ABI mínimo para decodificar los eventos GMDone
// event GMDone(address indexed user, uint256 pointsEarned, uint256 totalPoints, uint256 streak, uint256 forkLevel, bool superGM)
const SIGNAL_ABI = [
  "event GMDone(address indexed user, uint256 pointsEarned, uint256 totalPoints, uint256 streak, uint256 forkLevel, bool superGM)"
];

const CONTRACT_ADDRESS = "0x108E51F9af4aF2D8CAa1f41E81b91B84B1304d36"; // Dirección de tu contrato
const RPC_URL = "https://rpc-testnet.arc.network";
const GENESIS_BLOCK = 52400000; // Un bloque seguro antes de tu despliegue

const worker = {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. ENDPOINT HTTP (Para que el frontend descargue el ranking en ms)
  // ─────────────────────────────────────────────────────────────────────────
  async fetch(request, env, ctx) {
    // Configuramos CORS para que la dApp pueda leerlo desde cualquier dominio
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Leemos el ranking ultrarrápido desde KV
      const rankingStr = await env.RANKING_DB.get("top100");
      const ranking = rankingStr ? JSON.parse(rankingStr) : [];
      
      return new Response(JSON.stringify(ranking), {
        status: 200,
        headers: corsHeaders
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders
      });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. CRON TRIGGER (Sincronización Delta por Bloques cada hora)
  // ─────────────────────────────────────────────────────────────────────────
  async scheduled(event, env, ctx) {
    console.log("Iniciando sincronización delta del ranking...");
    
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, SIGNAL_ABI, provider);
      
      // 1. Leer el estado anterior de la base de datos
      const lastBlockStr = await env.RANKING_DB.get("lastProcessedBlock");
      const rankingStr = await env.RANKING_DB.get("top100");
      
      let lastProcessedBlock = lastBlockStr ? parseInt(lastBlockStr) : GENESIS_BLOCK;
      let ranking = rankingStr ? JSON.parse(rankingStr) : [];
      
      // Convertir el ranking en un Mapa para actualizar fácil
      const rankingMap = new Map();
      for (const user of ranking) {
        rankingMap.set(user.address.toLowerCase(), user);
      }

      const currentBlock = await provider.getBlockNumber();
      if (currentBlock <= lastProcessedBlock) {
        console.log("No hay bloques nuevos para procesar.");
        return;
      }

      console.log(`Buscando eventos desde ${lastProcessedBlock + 1} hasta ${currentBlock}...`);

      // 2. Buscar eventos GMDone en ese rango de bloques
      const filter = contract.filters.GMDone();
      // Nota: Si el rango es inmenso (ej. > 5000 bloques), podría ser necesario dividirlo,
      // pero como el Cron corre cada hora, la diferencia de bloques será pequeña.
      const logs = await contract.queryFilter(filter, lastProcessedBlock + 1, currentBlock);

      console.log(`Se encontraron ${logs.length} eventos GMDone.`);

      // 3. Procesar los eventos y actualizar los puntos
      for (const log of logs) {
        // Los argumentos del evento están parseados por ethers
        // args: [user, pointsEarned, totalPoints, streak, forkLevel, superGM]
        const userAddress = log.args[0].toLowerCase();
        const totalPoints = Number(log.args[2]);
        const forkLevel = Number(log.args[4]);
        
        // Actualizamos o insertamos al usuario en nuestro mapa temporal
        // ¡Magia! No importa si no estaba en el Top 100 antes, el evento nos da sus puntos totales exactos.
        rankingMap.set(userAddress, {
          address: log.args[0], // Guardamos la dirección con el checksum original
          points: totalPoints,
          forkLevel: forkLevel == 0 ? 1 : forkLevel // Ajuste por si forkLevel es 0 en B1
        });
      }

      if (logs.length > 0) {
        // 4. Reordenar de mayor a menor y recortar al Top 100
        const updatedRanking = Array.from(rankingMap.values());
        updatedRanking.sort((a, b) => b.points - a.points);
        const top100 = updatedRanking.slice(0, 100);

        // 5. Guardar el nuevo JSON en la base de datos
        await env.RANKING_DB.put("top100", JSON.stringify(top100));
        console.log("Ranking actualizado exitosamente en KV.");
      }

      // 6. Actualizar siempre el último bloque procesado para avanzar el cursor
      await env.RANKING_DB.put("lastProcessedBlock", currentBlock.toString());
      console.log(`Cursor avanzado al bloque ${currentBlock}.`);

    } catch (error) {
      console.error("Error fatal en el Cron Job:", error);
      // Fallar silenciosamente para que Cloudflare lo reintente en la próxima hora
    }
  }
};

export default worker;
