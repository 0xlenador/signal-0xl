import { useState, useEffect } from 'react';
import { BLOCKSCOUT } from '@/lib/config';

export interface INetworkStats {
  gasPrice: string;
  blockTime: string;
  totalBlocks: string;
  totalTxs: string;
  isLoading: boolean;
}

export function useNetworkStats(): INetworkStats {
  const [stats, setStats] = useState<INetworkStats>({
    gasPrice: '...',
    blockTime: '...',
    totalBlocks: '...',
    totalTxs: '...',
    isLoading: true
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchStats = async () => {
      try {
        const response = await fetch(`${BLOCKSCOUT.baseUrl}/stats`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        if (isMounted) {
          setStats({
            gasPrice: data.gas_prices?.average ? parseFloat(data.gas_prices.average).toFixed(2) : '0.00',
            blockTime: data.average_block_time ? (data.average_block_time / 1000).toFixed(2) : '0.00',
            totalBlocks: data.total_blocks ? parseInt(data.total_blocks).toLocaleString() : '0',
            totalTxs: data.total_transactions ? parseInt(data.total_transactions).toLocaleString() : '0',
            isLoading: false
          });
        }
      } catch (error) {
        console.error("Error fetching network stats:", error);
        if (isMounted) {
          setStats(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    void fetchStats();
    
    const interval = setInterval(() => {
      if (!document.hidden) {
        void fetchStats();
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return stats;
}
