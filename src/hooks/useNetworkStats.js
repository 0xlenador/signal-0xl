import { useState, useEffect } from 'react';
import { BLOCKSCOUT } from '@/lib/config';

export function useNetworkStats() {
  const [stats, setStats] = useState({
    gasPrice: '...',
    blockTime: '...',
    totalBlocks: '...',
    totalTxs: '...',
    isLoading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${BLOCKSCOUT.baseUrl}/stats`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        setStats({
          gasPrice: data.gas_prices?.average ? parseFloat(data.gas_prices.average).toFixed(2) : '0.00',
          blockTime: data.average_block_time ? (data.average_block_time / 1000).toFixed(2) : '0.00',
          totalBlocks: data.total_blocks ? parseInt(data.total_blocks).toLocaleString() : '0',
          totalTxs: data.total_transactions ? parseInt(data.total_transactions).toLocaleString() : '0',
          isLoading: false
        });
      } catch (error) {
        console.error("Error fetching network stats:", error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchStats();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchStats();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}
