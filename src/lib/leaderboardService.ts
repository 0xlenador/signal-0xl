// src/lib/leaderboardService.ts

export interface ILeaderboardUser {
  address: string;
  totalPoints: number;
  currentStreak: number;
  forkLevel: number;
  gmCount: number;
  nodeCommitment: boolean;
  nodeConviction: boolean;
  nodeLegacy: boolean;
}

export async function getLeaderboard(): Promise<ILeaderboardUser[]> {
  // Aseguramos que la URL exista
  const workerUrl = process.env.WORKER_URL;
  if (!workerUrl) {
    console.warn("WORKER_URL no está definida en las variables de entorno. Devolviendo array vacío.");
    return [];
  }

  try {
    // 1. Ejecutamos el fetch con caché estática ISR de Next.js
    const res = await fetch(`${workerUrl}/api/leaderboard`, {
      next: { revalidate: 60 } // Next.js cacheará esta petición y solo la revalidará cada 60 segundos
    });

    if (!res.ok) {
      throw new Error(`Worker respondió con status: ${res.status}`);
    }

    const top100Data = await res.json();

    if (!top100Data || top100Data.length === 0) {
      return [];
    }

    // 2. Mapeamos directamente los datos del Worker al formato de la interfaz UI
    const mappedUsers: ILeaderboardUser[] = top100Data.map((u: any) => ({
      address: u.address,
      totalPoints: Number(u.points),
      currentStreak: 0, 
      forkLevel: Number(u.forkLevel) === 0 ? 1 : Number(u.forkLevel),
      gmCount: 0,
      nodeCommitment: false,
      nodeConviction: false,
      nodeLegacy: false
    }));

    return mappedUsers;
  } catch (err) {
    console.error("Error fetching leaderboard en el servidor:", err);
    return [];
  }
}
