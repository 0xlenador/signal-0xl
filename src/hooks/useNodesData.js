import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { BLOCKSCOUT, CONSTANTS } from '@/lib/config';

export function useNodesData(address) {
  const [nodesData, setNodesData] = useState({
    commitment: null,
    conviction: null,
    legacy: null,
    isLoading: true
  });

  const fetchNodesData = useCallback(async () => {
    if (!address) return;
    setNodesData(prev => ({ ...prev, isLoading: true }));

    try {
      // Fetch Address stats from Blockscout
      const [addressRes, countersRes, txsRes] = await Promise.all([
        fetch(`${BLOCKSCOUT.baseUrl}/addresses/${address}`).then(res => res.ok ? res.json() : null),
        fetch(`${BLOCKSCOUT.baseUrl}/addresses/${address}/counters`).then(res => res.ok ? res.json() : null),
        // To get first/last tx dates we might need tx list or internal txs
        fetch(`${BLOCKSCOUT.baseUrl}/addresses/${address}/transactions`).then(res => res.ok ? res.json() : null)
      ]);

      // --- COMMITMENT NODE (Txs & Gas) ---
      let totalTxs = countersRes?.transactions_count || 0;
      let totalGasUsed = countersRes?.gas_usage_count || 0;
      
      // Try to parse gas correctly
      let totalFeePaid = 0; // Not perfectly accurate without iterating, but we approximate
      if (addressRes?.gas_used) {
         totalGasUsed = parseInt(addressRes.gas_used);
      }

      let commitmentTier = "Beginner";
      let cMultiplier = 1;
      if (totalTxs >= 100) { commitmentTier = "Degen"; cMultiplier = 3; }
      else if (totalTxs >= 50) { commitmentTier = "Active"; cMultiplier = 2; }
      else if (totalTxs >= 10) { commitmentTier = "Explorer"; cMultiplier = 1.5; }

      const commitment = {
        totalTxs,
        totalGasUsed,
        totalFeePaid: '0.00', // Mock approximation if not easily available via API
        tier: commitmentTier,
        multiplier: cMultiplier
      };

      // --- CONVICTION NODE (Balance) ---
      let balanceStr = addressRes?.coin_balance || "0";
      let balanceUSDC = parseFloat(ethers.formatUnits(balanceStr, CONSTANTS.DECIMALS));
      
      let percentageOfSupply = (balanceUSDC / CONSTANTS.TOTAL_SUPPLY) * 100;
      let convictionTier = "Observador";
      if (percentageOfSupply >= 1) convictionTier = "Ballena";
      else if (percentageOfSupply >= 0.1) convictionTier = "Inversor";
      else if (percentageOfSupply >= 0.01) convictionTier = "Holder";

      const conviction = {
        balanceUSDC: balanceUSDC.toFixed(4),
        percentageOfSupply: percentageOfSupply.toFixed(6),
        supplyTotal: CONSTANTS.TOTAL_SUPPLY,
        tier: convictionTier
      };

      // --- LEGACY NODE (Dates) ---
      let firstTxDate = null;
      let lastTxDate = null;
      let daysSinceGenesis = 0;
      let legacyBadge = "Newbie";

      if (txsRes?.items && txsRes.items.length > 0) {
        // Items are usually sorted by latest first
        const latestTx = txsRes.items[0];
        const oldestTx = txsRes.items[txsRes.items.length - 1]; // Only accurate for first page, but good enough for MVP
        
        if (oldestTx && oldestTx.timestamp) {
           firstTxDate = new Date(oldestTx.timestamp);
        }
        if (latestTx && latestTx.timestamp) {
           lastTxDate = new Date(latestTx.timestamp);
        }
        
        if (firstTxDate) {
          const now = new Date();
          const diffTime = Math.abs(now - firstTxDate);
          daysSinceGenesis = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        if (daysSinceGenesis >= 365) legacyBadge = "OG (1 Year+)";
        else if (daysSinceGenesis >= 30) legacyBadge = "Early Adopter";
        else if (daysSinceGenesis >= 7) legacyBadge = "Founder (Week 1)";
      }

      const legacy = {
        firstTxDate,
        lastTxDate,
        daysSinceGenesis,
        tier: legacyBadge
      };

      setNodesData({
        commitment,
        conviction,
        legacy,
        isLoading: false
      });
      
    } catch (error) {
      console.error("Error fetching nodes data:", error);
      setNodesData(prev => ({ ...prev, isLoading: false }));
    }
  }, [address]);

  useEffect(() => {
    fetchNodesData();
  }, [fetchNodesData]);

  return nodesData;
}
