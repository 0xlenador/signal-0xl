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

// URL del nuevo Worker (Indexador D1 en Cloudflare)
const WORKER_URL = "https://signal0xl-ranking.ellenador-eth.workers.dev/api/leaderboard";

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
      setLeaderboard([]); // Limpiar leaderboard viejo
      
      // 1. Obtener el Top 100 ordenado casi instantáneamente desde el Cloudflare Worker
      const res = await fetch(WORKER_URL);
      const top100Data = await res.json();
      
      if (!top100Data || top100Data.length === 0) {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsScanning(false);
        }
        return;
      }

      // 2. Extraer solo las direcciones del Top 100
      const topAddresses: string[] = top100Data.map((u: any) => u.address);

      // 3. Enriquecer los datos (Traer medallas, rachas, etc) desde el contrato en lotes
      // NOTA: Como ahora solo son máximo 100 usuarios, el RPC no sufrirá nada.
      const provider = getReadProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const chunkSize = 10;
      for (let i = 0; i < topAddresses.length; i += chunkSize) {
        if (!isMountedRef.current) break;
        
        const chunk = topAddresses.slice(i, i + chunkSize);
        
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
            // Mantener el orden exacto dictado por los puntos
            return updated.sort((a, b) => {
              if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
              if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
              return b.gmCount - a.gmCount;
            });
          });
          setIsLoading(false);
        }
      }
      
      if (isMountedRef.current) {
        setIsLoading(false);
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
