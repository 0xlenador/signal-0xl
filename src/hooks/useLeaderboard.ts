import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS, NETWORK } from '@/lib/config';

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

export interface ILeaderboardHook {
  leaderboard: ILeaderboardUser[];
  isLoading: boolean;
  isScanning: boolean;
  refresh: () => Promise<void>;
}

const staticNetwork = ethers.Network.from({
  chainId: NETWORK.chainId,
  name: NETWORK.name
});

let _publicProvider: ethers.JsonRpcProvider | null = null;
const getReadProvider = () => {
  if (!_publicProvider) {
    _publicProvider = new ethers.JsonRpcProvider(NETWORK.rpcUrls[0], staticNetwork, {
      staticNetwork: staticNetwork
    });
  }
  return _publicProvider;
};

export function useLeaderboard(): ILeaderboardHook {
  const [leaderboard, setLeaderboard] = useState<ILeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    if (!isMountedRef.current) return;
    try {
      setIsLoading(true);
      setIsScanning(true);
      setLeaderboard([]); // Limpiar leaderboard viejo si lo hay

      const provider = getReadProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const countBN = await contract.getUserCount();
      const count = Number(countBN);
      
      if (count === 0) {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsScanning(false);
        }
        return;
      }

      // Descargamos todos los usuarios crudos (sin ordenar) usando paginación
      // Para MVP asumimos que caben en una sola llamada (ej. hasta 1000 usuarios)
      const fetchLimit = count > 1000 ? 1000 : count;
      const paginatedRes = await contract.getUsersPaginated(0, fetchLimit);
      
      const addrs: string[] = paginatedRes[0];
      const points: bigint[] = paginatedRes[1];
      const forks: bigint[] = paginatedRes[2];

      if (!addrs || addrs.length === 0) {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsScanning(false);
        }
        return;
      }

      // Mapear y ordenar en JavaScript (Costo de gas = 0)
      type RawUser = { addr: string, pts: number };
      const rawUsers: RawUser[] = addrs.map((a, i) => ({
        addr: a,
        pts: Number(points[i])
      }));

      // Ordenar por puntos (mayor a menor) y tomar el Top 50
      rawUsers.sort((a, b) => b.pts - a.pts);
      const top50 = rawUsers.slice(0, 50).map(u => u.addr);

      // Procesar en lotes de 10 para obtener las medallas y racha (badges) sin saturar RPC
      const chunkSize = 10;
      for (let i = 0; i < top50.length; i += chunkSize) {
        if (!isMountedRef.current) break;
        
        const chunk = top50.slice(i, i + chunkSize);
        
        const chunkPromises = chunk.map(async (userAddress) => {
          try {
            const userData = await contract.users(userAddress);
            if (userData.exists) {
              return {
                address: userAddress,
                totalPoints: Number(userData.totalPoints),
                currentStreak: Number(userData.currentStreak),
                forkLevel: Number(userData.forkLevel) === 0 ? 1 : Number(userData.forkLevel),
                gmCount: Number(userData.gmCount),
                nodeCommitment: Boolean(userData.nodeCommitment),
                nodeConviction: Boolean(userData.nodeConviction),
                nodeLegacy: Boolean(userData.nodeLegacy)
              } as ILeaderboardUser;
            }
          } catch (err) {
            console.warn(`Error fetching user ${userAddress}:`, err);
          }
          return null;
        });

        const results = await Promise.all(chunkPromises);
        const validUsers = results.filter((u): u is ILeaderboardUser => u !== null);

        if (validUsers.length > 0 && isMountedRef.current) {
          setLeaderboard((prev) => {
            const newMap = new Map(prev.map(u => [u.address.toLowerCase(), u]));
            for (const vu of validUsers) {
              newMap.set(vu.address.toLowerCase(), vu);
            }
            
            const updated = Array.from(newMap.values());
            return updated.sort((a, b) => {
              if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
              if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
              return b.gmCount - a.gmCount;
            });
          });
          setIsLoading(false);
        }
        
        await new Promise(r => setTimeout(r, 200));
      }
      
      if (isMountedRef.current) {
        setIsLoading(false); // Asegurarnos de apagar el loading si no hubo usuarios válidos
        setIsScanning(false);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsScanning(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        void fetchLeaderboard();
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [fetchLeaderboard]);

  return { leaderboard, isLoading, isScanning, refresh: fetchLeaderboard };
}
