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

      // 2. Mapear directamente los datos del Worker al formato de la interfaz
      // Como eliminamos las medallas, ya no necesitamos consultar al contrato inteligente.
      const mappedUsers: ILeaderboardUser[] = top100Data.map((u: any) => ({
        address: u.address,
        totalPoints: Number(u.points), // En el Worker se llama 'points'
        currentStreak: 0, // No lo tenemos en la DB, pero no importa para la UI
        forkLevel: Number(u.forkLevel) === 0 ? 1 : Number(u.forkLevel),
        gmCount: 0,
        nodeCommitment: false,
        nodeConviction: false,
        nodeLegacy: false
      }));

      if (isMountedRef.current) {
        setLeaderboard(mappedUsers);
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
