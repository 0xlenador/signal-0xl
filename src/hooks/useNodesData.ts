import { useState, useEffect, useCallback, useRef } from 'react';
import { formatUnits } from 'viem';
import { BLOCKSCOUT, CONSTANTS } from '@/lib/config';

export interface ICommitmentNode {
  totalTxs: number;
  totalFeePaid: string | null;
  tier: string;
  multiplier: number;
}

export interface IConvictionNode {
  balanceUSDC: string;
  percentageOfSupply: string;
  supplyTotal: number;
  tier: string;
}

export interface ILegacyNode {
  firstTxDate: Date | null;
  lastTxDate: Date | null;
  daysSinceGenesis: number;
  tier: string;
}

export interface INodesData {
  commitment: ICommitmentNode | null;
  conviction: IConvictionNode | null;
  legacy: ILegacyNode | null;
  isLoading: boolean;
}

export function useNodesData(address: string | null | undefined): INodesData {
  const [nodesData, setNodesData] = useState<INodesData>({
    commitment: null,
    conviction: null,
    legacy: null,
    isLoading: true
  });

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchNodesData = useCallback(async () => {
    if (!address) return;
    
    try {
      // 1. Intentamos obtener datos del Blockscout (con .catch para no crashear Promise.all)
      const [addressRes, countersRes, txsRes] = await Promise.all([
        fetch(`${BLOCKSCOUT.baseUrl}/addresses/${address}`).then(res => res.ok ? res.json() : null).catch(() => null),
        fetch(`${BLOCKSCOUT.baseUrl}/addresses/${address}/counters`).then(res => res.ok ? res.json() : null).catch(() => null),
        fetch(`${BLOCKSCOUT.baseUrl}/addresses/${address}/transactions`).then(res => res.ok ? res.json() : null).catch(() => null)
      ]);

      // 2. Fallback a RPC si el Blockscout falló
      let rpcBalance = "0";
      let rpcNonce = 0;
      if (!addressRes || !countersRes) {
        try {
          const HTTP_RPC_URL = 'https://rpc.testnet.arc.network';
          const [balRes, nonceRes] = await Promise.all([
            fetch(HTTP_RPC_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] })
            }).then(r => r.json()),
            fetch(HTTP_RPC_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'eth_getTransactionCount', params: [address, 'latest'] })
            }).then(r => r.json())
          ]);
          rpcBalance = balRes.result ? BigInt(balRes.result).toString() : "0";
          rpcNonce = nonceRes.result ? parseInt(nonceRes.result, 16) : 0;
        } catch { /* ignore fallback errors */ }
      }

      // --- COMMITMENT NODE ---
      // Si countersRes falla, usamos el nonce del RPC como aproximación de totalTxs
      let totalTxs = countersRes?.transactions_count ?? rpcNonce;

      let commitmentTier = "Beginner";
      let cMultiplier = 1;
      if (totalTxs >= 100) { commitmentTier = "Degen"; cMultiplier = 3; }
      else if (totalTxs >= 50) { commitmentTier = "Active"; cMultiplier = 2; }
      else if (totalTxs >= 10) { commitmentTier = "Explorer"; cMultiplier = 1.5; }

      let totalFeePaid = null; // A futuro extraer de la API cuando funcione

      const commitment: ICommitmentNode = {
        totalTxs,
        totalFeePaid,
        tier: commitmentTier,
        multiplier: cMultiplier
      };

      // --- CONVICTION NODE ---
      // Si addressRes falla, usamos el balance del RPC
      let balanceStr = addressRes?.coin_balance ?? rpcBalance;
      let balanceUSDC = parseFloat(formatUnits(BigInt(balanceStr), CONSTANTS.DECIMALS));
      
      let percentageOfSupply = (balanceUSDC / CONSTANTS.TOTAL_SUPPLY) * 100;
      let convictionTier = "Observer";
      if (percentageOfSupply >= 1) convictionTier = "Whale";
      else if (percentageOfSupply >= 0.1) convictionTier = "Investor";
      else if (percentageOfSupply >= 0.01) convictionTier = "Holder";

      const conviction: IConvictionNode = {
        balanceUSDC: balanceUSDC.toFixed(4),
        percentageOfSupply: percentageOfSupply.toFixed(6),
        supplyTotal: CONSTANTS.TOTAL_SUPPLY,
        tier: convictionTier
      };

      // --- LEGACY NODE ---
      let firstTxDate: Date | null = null;
      let lastTxDate: Date | null = null;
      let daysSinceGenesis = 0;
      let legacyBadge = "Newbie";

      if (txsRes?.items && txsRes.items.length > 0) {
        const latestTx = txsRes.items[0];
        const oldestTx = txsRes.items[txsRes.items.length - 1];
        
        if (oldestTx && oldestTx.timestamp) {
           firstTxDate = new Date(oldestTx.timestamp);
        }
        if (latestTx && latestTx.timestamp) {
           lastTxDate = new Date(latestTx.timestamp);
        }
        
        if (firstTxDate) {
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - firstTxDate.getTime());
          daysSinceGenesis = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        if (daysSinceGenesis >= 365) legacyBadge = "OG (1 Year+)";
        else if (daysSinceGenesis >= 30) legacyBadge = "Early Adopter";
        else if (daysSinceGenesis >= 7) legacyBadge = "Founder (Week 1)";
      }

      const legacy: ILegacyNode = {
        firstTxDate,
        lastTxDate,
        daysSinceGenesis,
        tier: legacyBadge
      };

      if (isMountedRef.current) {
        setNodesData({
          commitment,
          conviction,
          legacy,
          isLoading: false
        });
      }
      
    } catch (error) {
      console.error("Error fetching nodes data:", error);
      if (isMountedRef.current) {
        setNodesData(prev => ({ ...prev, isLoading: false }));
      }
    }
  }, [address]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchNodesData();
    
    window.addEventListener('signal-data-refresh', fetchNodesData);
    return () => {
      window.removeEventListener('signal-data-refresh', fetchNodesData);
    };
  }, [fetchNodesData]);

  return nodesData;
}
