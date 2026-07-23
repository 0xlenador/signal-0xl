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

      const res = await fetch(`https://testnet.arcscan.app/api/v2/addresses/${CONTRACT_ADDRESS}/transactions`);
      if (!res.ok) throw new Error("Arcscan API fallo");
      const data = await res.json();
      const addrs = [...new Set(data.items.map((t: any) => t.from.hash))].slice(0, 100) as string[];
      
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

      for (const userAddress of addrs) {
        if (!isMountedRef.current) break; // Terminar ciclo asíncrono si el componente se desmontó
        try {
          const userData = await contract.users(userAddress);
          
          if (userData.exists) {
            const newUser: ILeaderboardUser = {
              address: userAddress,
              totalPoints: Number(userData.totalPoints),
              currentStreak: Number(userData.currentStreak),
              forkLevel: Number(userData.forkLevel) === 0 ? 1 : Number(userData.forkLevel),
              gmCount: Number(userData.gmCount),
              nodeCommitment: Boolean(userData.nodeCommitment),
              nodeConviction: Boolean(userData.nodeConviction),
              nodeLegacy: Boolean(userData.nodeLegacy)
            };

            if (isMountedRef.current) {
              setLeaderboard((prev) => {
              if (prev.some(u => u.address.toLowerCase() === userAddress.toLowerCase())) return prev;
              
              const updated = [...prev, newUser];
              return updated.sort((a, b) => {
                if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
                if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
                return b.gmCount - a.gmCount;
              });
              });
            }
            
            if (isMountedRef.current) setIsLoading(false); 
          }
          await delay(1000); 
        } catch (iterErr) {
          console.warn(`Error fetching user ${userAddress}:`, iterErr);
        }
      }
      if (isMountedRef.current) setIsScanning(false);
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
