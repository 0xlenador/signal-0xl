'use client';

import { useState, useEffect, useRef } from 'react';
import { Microscope, Gem, Landmark, Info, Loader2 } from 'lucide-react';
import { useNodesData, useSignalContract, IUserData } from '@/hooks';
import { useParams } from 'next/navigation';
import { useWeb3 } from '../Web3Provider';
import { ethers } from 'ethers';

export default function NodesGrid() {
  const { address } = useWeb3();
  const params = useParams();
  const walletParam = params.wallet as string;
  const isOwner = address?.toLowerCase() === walletParam?.toLowerCase();

  const data = useNodesData(walletParam);
  const { fetchUserData, getNodeInstantCost, activateNodeInstant, activateNodeByStreak } = useSignalContract();

  const [userData, setUserData] = useState<IUserData | null>(null);
  
  // Costs state (default static values based on contract to prevent '...' loading delay)
  const [cost1, setCost1] = useState<string>('0.51');
  const [cost2, setCost2] = useState<string>('1.26');
  const [cost3, setCost3] = useState<string>('5.01');

  // Loading states
  const [loadingNode1Streak, setLoadingNode1Streak] = useState(false);
  const [loadingNode1Instant, setLoadingNode1Instant] = useState(false);
  const [loadingNode2Streak, setLoadingNode2Streak] = useState(false);
  const [loadingNode2Instant, setLoadingNode2Instant] = useState(false);
  const [loadingNode3Streak, setLoadingNode3Streak] = useState(false);
  const [loadingNode3Instant, setLoadingNode3Instant] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const refreshData = async () => {
    if (!walletParam) return;
    const ud = await fetchUserData(walletParam);
    if (isMounted.current) setUserData(ud);
  };

  useEffect(() => {
    refreshData();
    // Fetch instant costs
    if (walletParam) {
      getNodeInstantCost(1, walletParam).then(c => { if (c && isMounted.current) setCost1(parseFloat(ethers.formatUnits(c, 18)).toFixed(2)) });
      getNodeInstantCost(2, walletParam).then(c => { if (c && isMounted.current) setCost2(parseFloat(ethers.formatUnits(c, 18)).toFixed(2)) });
      getNodeInstantCost(3, walletParam).then(c => { if (c && isMounted.current) setCost3(parseFloat(ethers.formatUnits(c, 18)).toFixed(2)) });
    }
  }, [walletParam, fetchUserData, getNodeInstantCost]);

  const handleActivateInstant = async (nodeId: number, setLoader: (l: boolean) => void) => {
    if (!address) return;
    setLoader(true);
    const costWei = await getNodeInstantCost(nodeId, address);
    if (!costWei) {
      alert("Error calculando el costo instantáneo.");
      setLoader(false);
      return;
    }
    const success = await activateNodeInstant(nodeId, costWei);
    if (success) await refreshData();
    setLoader(false);
  };

  const handleActivateStreak = async (nodeId: number, setLoader: (l: boolean) => void) => {
    if (!address) return;
    setLoader(true);
    const success = await activateNodeByStreak(nodeId);
    if (success) await refreshData();
    setLoader(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* NODO 1: Compromiso */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col glow-cyan-hover transition-all duration-300 relative group" id="node1-card">
        <div className="absolute top-0 right-0 w-16 h-16 bg-accent-primary/5 rounded-bl-full rounded-tr-2xl pointer-events-none group-hover:bg-accent-primary/10 transition-colors"></div>
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Microscope className="w-5 h-5 text-accent-primary drop-shadow-md" /> 
            <span className="group-hover:text-accent-primary transition-colors">Node 1 — Commitment</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="cursor-help relative group/tt opacity-80 group-hover:opacity-100 transition-opacity flex items-center">
              <Info className="w-3.5 h-3.5" />
            </span>
            {userData?.nodeCommitment ? (
              <div className="w-2.5 h-2.5 rounded-full bg-accent-success shadow-[0_0_8px_rgba(0,230,118,0.6)]"></div>
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-accent-error shadow-[0_0_8px_rgba(255,23,68,0.6)]"></div>
            )}
          </div>
        </div>
        
        {/* Requirement Badge */}
        {!userData?.nodeCommitment && (
           <div className="text-[0.6rem] font-mono text-accent-warning bg-accent-warning/10 px-2 py-0.5 rounded-md w-max border border-accent-warning/20 mb-1">Día 3</div>
        )}

        {/* Node 1 Data Grid */}
        {userData?.nodeCommitment && (
          <div className="grid grid-cols-2 gap-1.5 mt-2 mb-3 flex-grow relative z-10">
            <div className="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
              <span className="text-[0.55rem] text-text-muted uppercase tracking-wider truncate">TOTAL TRANSACTIONS</span>
              <strong className="text-xs text-white truncate">{data.isLoading ? '...' : data.commitment?.totalTxs.toLocaleString()}</strong>
            </div>
            <div className="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
              <span className="text-[0.55rem] text-text-muted uppercase tracking-wider truncate">GAS CONSUMED</span>
              <strong className="text-xs text-white truncate">{data.isLoading ? '...' : data.commitment?.totalGasUsed.toLocaleString()}</strong>
            </div>
            <div className="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
              <span className="text-[0.55rem] text-text-muted uppercase tracking-wider truncate">FEES PAID</span>
              <strong className="text-xs text-white truncate">{data.isLoading ? '...' : data.commitment?.totalFeePaid}</strong>
            </div>
            <div className="flex flex-col bg-accent-primary/10 px-2 py-1 rounded border border-accent-primary/30">
              <span className="text-[0.55rem] text-accent-primary uppercase tracking-wider truncate">TIER</span>
              <strong className="text-xs text-accent-primary font-bold truncate">{data.isLoading ? '...' : data.commitment?.tier} <span className="text-[0.55rem] opacity-70">(×{data.isLoading ? '1' : data.commitment?.multiplier})</span></strong>
            </div>
          </div>
        )}

        {/* Acciones */}
        {!userData?.nodeCommitment && isOwner && (
          <div className="grid grid-cols-2 gap-2 mt-auto relative z-10">
            <button 
              onClick={() => handleActivateStreak(1, setLoadingNode1Streak)} 
              disabled={loadingNode1Streak || loadingNode1Instant || (userData?.currentStreak || 0) < 3}
              className="bg-surface-2 hover:bg-surface-1 border border-border-light text-[0.65rem] font-semibold text-white py-1.5 rounded-lg transition-colors hover:border-accent-primary/50 flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {loadingNode1Streak ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Racha ({userData?.currentStreak || 0}/3)</span>}
            </button>
            <button 
              onClick={() => handleActivateInstant(1, setLoadingNode1Instant)}
              disabled={loadingNode1Streak || loadingNode1Instant}
              className="bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/30 hover:border-accent-primary text-accent-primary font-bold text-[0.65rem] py-1.5 rounded-lg transition-all shadow-glow-cyan flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {loadingNode1Instant ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Activar ({cost1} USDC)</span>}
            </button>
          </div>
        )}
      </div>

      {/* NODO 2: Convicción */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col glow-cyan-hover transition-all duration-300 relative group" id="node2-card">
        <div className="absolute top-0 right-0 w-16 h-16 bg-accent-primary/5 rounded-bl-full rounded-tr-2xl pointer-events-none group-hover:bg-accent-primary/10 transition-colors"></div>
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Gem className="w-5 h-5 text-accent-primary drop-shadow-md" /> 
            <span className="group-hover:text-accent-primary transition-colors">Node 2 — Conviction</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="cursor-help relative group/tt opacity-80 group-hover:opacity-100 transition-opacity flex items-center">
              <Info className="w-3.5 h-3.5" />
            </span>
            {userData?.nodeConviction ? (
              <div className="w-2.5 h-2.5 rounded-full bg-accent-success shadow-[0_0_8px_rgba(0,230,118,0.6)]"></div>
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-accent-error shadow-[0_0_8px_rgba(255,23,68,0.6)]"></div>
            )}
          </div>
        </div>

        {/* Requirement Badge */}
        {!userData?.nodeConviction && (
           <div className="text-[0.6rem] font-mono text-accent-warning bg-accent-warning/10 px-2 py-0.5 rounded-md w-max border border-accent-warning/20 mb-1">Día 12</div>
        )}
        
        {/* Node 2 Data Grid */}
        {userData?.nodeConviction && (
          <div className="grid grid-cols-2 gap-1.5 mt-2 mb-3 flex-grow relative z-10">
            <div className="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
              <span className="text-[0.55rem] text-text-muted uppercase tracking-wider truncate">NATIVE BALANCE</span>
              <strong className="text-xs text-white truncate">{data.isLoading ? '...' : data.conviction?.balanceUSDC}</strong>
            </div>
            <div className="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
              <span className="text-[0.55rem] text-text-muted uppercase tracking-wider truncate">% OF SUPPLY</span>
              <strong className="text-xs text-white truncate">{data.isLoading ? '...' : data.conviction?.percentageOfSupply}%</strong>
            </div>
            <div className="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
              <span className="text-[0.55rem] text-text-muted uppercase tracking-wider truncate">TOTAL SUPPLY (REF.)</span>
              <strong className="text-xs text-white truncate">{data.isLoading ? '...' : data.conviction?.supplyTotal.toLocaleString()}</strong>
            </div>
            <div className="flex flex-col bg-accent-primary/10 px-2 py-1 rounded border border-accent-primary/30">
              <span className="text-[0.55rem] text-accent-primary uppercase tracking-wider truncate">CLASSIFICATION</span>
              <strong className="text-xs text-accent-primary font-bold truncate">{data.isLoading ? '...' : data.conviction?.tier}</strong>
            </div>
          </div>
        )}

        {/* Acciones */}
        {!userData?.nodeConviction && isOwner && (
          <div className="grid grid-cols-2 gap-2 mt-auto relative z-10">
            <button 
              onClick={() => handleActivateStreak(2, setLoadingNode2Streak)} 
              disabled={loadingNode2Streak || loadingNode2Instant || (userData?.currentStreak || 0) < 12}
              className="bg-surface-2 hover:bg-surface-1 border border-border-light text-[0.65rem] font-semibold text-white py-1.5 rounded-lg transition-colors hover:border-accent-primary/50 flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {loadingNode2Streak ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Racha ({userData?.currentStreak || 0}/12)</span>}
            </button>
            <button 
              onClick={() => handleActivateInstant(2, setLoadingNode2Instant)}
              disabled={loadingNode2Streak || loadingNode2Instant}
              className="bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/30 hover:border-accent-primary text-accent-primary font-bold text-[0.65rem] py-1.5 rounded-lg transition-all shadow-glow-cyan flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {loadingNode2Instant ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Activar ({cost2} USDC)</span>}
            </button>
          </div>
        )}
      </div>

      {/* NODO 3: Legado */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col glow-cyan-hover transition-all duration-300 relative group" id="node3-card">
        <div className="absolute top-0 right-0 w-16 h-16 bg-accent-primary/5 rounded-bl-full rounded-tr-2xl pointer-events-none group-hover:bg-accent-primary/10 transition-colors"></div>
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Landmark className="w-5 h-5 text-accent-primary drop-shadow-md" /> 
            <span className="group-hover:text-accent-primary transition-colors">Node 3 — Legacy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="cursor-help relative group/tt opacity-80 group-hover:opacity-100 transition-opacity flex items-center">
              <Info className="w-3.5 h-3.5" />
            </span>
            {userData?.nodeLegacy ? (
              <div className="w-2.5 h-2.5 rounded-full bg-accent-success shadow-[0_0_8px_rgba(0,230,118,0.6)]"></div>
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-accent-error shadow-[0_0_8px_rgba(255,23,68,0.6)]"></div>
            )}
          </div>
        </div>

        {/* Requirement Badge */}
        {!userData?.nodeLegacy && (
           <div className="text-[0.6rem] font-mono text-accent-warning bg-accent-warning/10 px-2 py-0.5 rounded-md w-max border border-accent-warning/20 mb-1">Día 25</div>
        )}
        
        {/* Node 3 Data Grid */}
        {userData?.nodeLegacy && (
          <div className="grid grid-cols-2 gap-1.5 mt-2 mb-3 flex-grow relative z-10">
            <div className="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
              <span className="text-[0.55rem] text-text-muted uppercase tracking-wider truncate">FIRST TX</span>
              <strong className="text-xs text-white truncate">{data.isLoading ? '...' : (data.legacy?.firstTxDate?.toLocaleDateString() || 'N/A')}</strong>
            </div>
            <div className="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
              <span className="text-[0.55rem] text-text-muted uppercase tracking-wider truncate">LAST TX</span>
              <strong className="text-xs text-white truncate">{data.isLoading ? '...' : (data.legacy?.lastTxDate?.toLocaleDateString() || 'N/A')}</strong>
            </div>
            <div className="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
              <span className="text-[0.55rem] text-text-muted uppercase tracking-wider truncate">DAYS SINCE GENESIS</span>
              <strong className="text-xs text-white truncate">{data.isLoading ? '...' : data.legacy?.daysSinceGenesis} d</strong>
            </div>
            <div className="flex flex-col bg-accent-primary/10 px-2 py-1 rounded border border-accent-primary/30">
              <span className="text-[0.55rem] text-accent-primary uppercase tracking-wider truncate">BADGE</span>
              <strong className="text-xs text-accent-primary font-bold truncate">{data.isLoading ? '...' : data.legacy?.tier}</strong>
            </div>
          </div>
        )}

        {/* Acciones */}
        {!userData?.nodeLegacy && isOwner && (
          <div className="grid grid-cols-2 gap-2 mt-auto relative z-10">
            <button 
              onClick={() => handleActivateStreak(3, setLoadingNode3Streak)} 
              disabled={loadingNode3Streak || loadingNode3Instant || (userData?.currentStreak || 0) < 25}
              className="bg-surface-2 hover:bg-surface-1 border border-border-light text-[0.65rem] font-semibold text-white py-1.5 rounded-lg transition-colors hover:border-accent-primary/50 flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {loadingNode3Streak ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Racha ({userData?.currentStreak || 0}/25)</span>}
            </button>
            <button 
              onClick={() => handleActivateInstant(3, setLoadingNode3Instant)}
              disabled={loadingNode3Streak || loadingNode3Instant}
              className="bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/30 hover:border-accent-primary text-accent-primary font-bold text-[0.65rem] py-1.5 rounded-lg transition-all shadow-glow-cyan flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {loadingNode3Instant ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Activar ({cost3} USDC)</span>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
