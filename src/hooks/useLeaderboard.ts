import { useState, useEffect, useCallback, useRef } from 'react';
import { INDEXER } from '@/lib/config';

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

// Eliminamos la constante WORKER_URL quemada

export function useLeaderboard(): ILeaderboardHook {
  const [leaderboard, setLeaderboard] = useState<ILeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
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
      const res = await fetch(`${INDEXER.baseUrl}/api/leaderboard`);
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
    // Primera carga con un ligero retraso de UI
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        void fetchLeaderboard();
      }
    }, 1200);

    // Polling automático cada 60 segundos
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        void fetchLeaderboard();
      }
    }, 60000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchLeaderboard]);

  return { leaderboard, isLoading, isScanning, refresh: fetchLeaderboard };
}
