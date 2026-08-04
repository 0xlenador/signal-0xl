import { create } from 'zustand';
import type { ILeaderboardUser } from '@/lib/leaderboardService';
import { INDEXER } from '@/lib/config';

interface LeaderboardState {
  data: ILeaderboardUser[];
  refreshState: 'idle' | 'waiting' | 'fetching';
  
  // Acciones
  hydrate: (serverData: ILeaderboardUser[]) => void;
  notifyGmConfirmed: (address: string, isSuperGM: boolean) => void;
}

// Variable para guardar el controller del fetch actual y poder abortarlo si hay otro GM
let currentAbortController: AbortController | null = null;
// Variable para limpiar los timeouts
let refreshTimeouts: NodeJS.Timeout[] = [];

const clearTimeouts = () => {
  refreshTimeouts.forEach(clearTimeout);
  refreshTimeouts = [];
};

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  data: [],
  refreshState: 'idle',

  hydrate: (serverData) => {
    // Solo hidratar si la data actual está vacía (primera carga)
    if (get().data.length === 0 && serverData.length > 0) {
      set({ data: serverData });
    }
  },

  notifyGmConfirmed: (address: string, isSuperGM: boolean) => {
    const currentState = get();
    
    // 1. Optimistic Update Inmediato
    let newData = [...currentState.data];
    const userIndex = newData.findIndex(u => u.address.toLowerCase() === address.toLowerCase());
    
    const pointsToAdd = isSuperGM ? 2 : 1;

    if (userIndex !== -1) {
      // Usuario existe, le sumamos los puntos
      newData[userIndex] = {
        ...newData[userIndex],
        totalPoints: newData[userIndex].totalPoints + pointsToAdd,
        gmCount: newData[userIndex].gmCount + 1 // opcional, pero mantiene coherencia local
      };
    } else {
      // Usuario no existe. Lo insertamos si hay espacio o no nos importa (luego se recorta a 100)
      if (newData.length < 100) {
        newData.push({
          address,
          totalPoints: pointsToAdd,
          currentStreak: 1,
          forkLevel: 1, // default
          gmCount: 1,
          nodeCommitment: false,
          nodeConviction: false,
          nodeLegacy: false
        });
      }
    }

    // Ordenar descendente por puntos
    newData.sort((a, b) => b.totalPoints - a.totalPoints);
    
    // Asegurar que no pasamos de 100
    if (newData.length > 100) {
      newData = newData.slice(0, 100);
    }

    set({ data: newData, refreshState: 'waiting' });

    // 2. Limpiar secuencias anteriores si las hay
    if (currentAbortController) {
      currentAbortController.abort();
    }
    clearTimeouts();
    
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;

    // Función helper para hacer el fetch silencioso
    const silentFetch = async () => {
      if (signal.aborted) return;
      
      set({ refreshState: 'fetching' });
      
      try {
        const res = await fetch(`${INDEXER.baseUrl}/api/leaderboard`, {
          cache: 'no-store', // Muy importante, queremos datos frescos saltando la cache
          signal
        });

        if (!res.ok) throw new Error('Error en fetch');
        
        const top100Data = await res.json();
        if (signal.aborted) return;

        if (top100Data && top100Data.length > 0) {
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

          set({ data: mappedUsers });
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Error en silent fetch del leaderboard:", err);
        }
      }
    };

    // 3. Programar los refrescos (30s y 80s)
    const t1 = setTimeout(async () => {
      await silentFetch();
      if (!signal.aborted) {
        set({ refreshState: 'waiting' }); // Volvemos a waiting esperando el segundo fetch
      }
    }, 30 * 1000);

    const t2 = setTimeout(async () => {
      await silentFetch();
      if (!signal.aborted) {
        set({ refreshState: 'idle' });
      }
      currentAbortController = null; // Limpiar controller
    }, 80 * 1000); // 80s = 30s + 50s adicionales

    refreshTimeouts.push(t1, t2);
  }
}));
