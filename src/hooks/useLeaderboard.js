import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/config';

import { NETWORK } from '@/lib/config';

const staticNetwork = ethers.Network.from({
  chainId: NETWORK.chainId,
  name: NETWORK.name
});

let _publicProvider = null;
const getReadProvider = () => {
  if (!_publicProvider) {
    _publicProvider = new ethers.JsonRpcProvider(NETWORK.rpcUrls[0], staticNetwork, {
      staticNetwork: staticNetwork
    });
  }
  return _publicProvider;
};

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsScanning(true);
      setLeaderboard([]); // Limpiar leaderboard viejo si lo hay

      const provider = getReadProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // Usar getUserCount que es la función real en el ABI del contrato desplegado
      const countBN = await contract.getUserCount();
      const count = Number(countBN);
      
      if (count === 0) {
        setIsLoading(false);
        setIsScanning(false);
        return;
      }

      // 1. Obtenemos direcciones unicas desde Arcscan API (como el legacy getTopUsersFallback)
      const res = await fetch(`https://testnet.arcscan.app/api/v2/addresses/${CONTRACT_ADDRESS}/transactions`);
      if (!res.ok) throw new Error("Arcscan API fallo");
      const data = await res.json();
      const addrs = [...new Set(data.items.map(t => t.from.hash))].slice(0, 100); // Límite seguro 100
      
      const delay = (ms) => new Promise(res => setTimeout(res, ms));

      for (const userAddress of addrs) {
        try {
          // Usamos contract.users que sí funciona para una address
          const userData = await contract.users(userAddress);
          
          if (userData.exists) {
            const newUser = {
              address: userAddress,
              totalPoints: Number(userData.totalPoints),
              currentStreak: Number(userData.currentStreak),
              forkLevel: Number(userData.forkLevel) === 0 ? 1 : Number(userData.forkLevel),
              gmCount: Number(userData.gmCount),
              nodeCommitment: userData.nodeCommitment,
              nodeConviction: userData.nodeConviction,
              nodeLegacy: userData.nodeLegacy
            };

            // Progressive Rendering: Insertar en el state y ordenar al instante
            setLeaderboard((prev) => {
              // Evitar duplicados por seguridad
              if (prev.some(u => u.address.toLowerCase() === userAddress.toLowerCase())) return prev;
              
              const updated = [...prev, newUser];
              // Ordenar: Puntos DESC, Racha DESC, GMs DESC
              return updated.sort((a, b) => {
                if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
                if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
                return b.gmCount - a.gmCount;
              });
            });
            
            setIsLoading(false); // Una vez hay al menos 1, ya no estamos en "Loading" total
          }
          // Prevent RPC rate limits (max 2-5 req/s on free public RPCs)
          await delay(1000); // Incremental delay to 1 second to avoid 429
        } catch (iterErr) {
          console.warn(`Error fetching user ${userAddress}:`, iterErr);
        }
      }
      setIsScanning(false);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setIsLoading(false);
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    // Priority Loading Strategy: 
    // Wait 1200ms before starting so `useSignalContract` gets the full RPC bandwidth.
    const timer = setTimeout(() => {
      fetchLeaderboard();
    }, 1200);

    return () => clearTimeout(timer);
  }, [fetchLeaderboard]);

  return { leaderboard, isLoading, isScanning, refresh: fetchLeaderboard };
}
