'use client';

import { Microscope, Gem, Landmark, Info } from 'lucide-react';
import { useNodesData } from '@/hooks';
import { useParams } from 'next/navigation';
import { useWeb3 } from '../Web3Provider';

export default function NodesGrid() {
  const { address } = useWeb3();
  const params = useParams();
  const walletParam = params.wallet as string;
  const isOwner = address?.toLowerCase() === walletParam?.toLowerCase();

  const data = useNodesData(walletParam);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* NODO 1: Compromiso */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col glow-cyan-hover transition-all duration-300 relative group">
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
            <div className="w-2.5 h-2.5 rounded-full bg-accent-success shadow-[0_0_8px_rgba(0,230,118,0.6)]"></div>
          </div>
        </div>
        
        {/* Node 1 Data Grid */}
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
      </div>

      {/* NODO 2: Convicción */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col glow-cyan-hover transition-all duration-300 relative group">
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
            <div className="w-2.5 h-2.5 rounded-full bg-accent-success shadow-[0_0_8px_rgba(0,230,118,0.6)]"></div>
          </div>
        </div>
        
        {/* Node 2 Data Grid */}
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
      </div>

      {/* NODO 3: Legado */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col glow-cyan-hover transition-all duration-300 relative group">
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
            <div className="w-2.5 h-2.5 rounded-full bg-accent-success shadow-[0_0_8px_rgba(0,230,118,0.6)]"></div>
          </div>
        </div>
        
        {/* Node 3 Data Grid */}
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
      </div>
    </div>
  );
}
