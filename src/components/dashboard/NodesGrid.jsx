'use client';

import { Microscope, Gem, Landmark, Info } from 'lucide-react';

export default function NodesGrid() {
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
            <strong className="text-xs text-white truncate">19</strong>
          </div>
          <div className="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
            <span className="text-[0.55rem] text-text-muted uppercase tracking-wider truncate">GAS CONSUMED</span>
            <strong className="text-xs text-white truncate">6,044,867</strong>
          </div>
          <div className="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
            <span className="text-[0.55rem] text-text-muted uppercase tracking-wider truncate">FEES PAID</span>
            <strong className="text-xs text-white truncate">0.143504</strong>
          </div>
          <div className="flex flex-col bg-accent-primary/10 px-2 py-1 rounded border border-accent-primary/30">
            <span className="text-[0.55rem] text-accent-primary uppercase tracking-wider truncate">TIER</span>
            <strong className="text-xs text-accent-primary font-bold truncate">Beginner <span className="text-[0.55rem] opacity-70">(×1)</span></strong>
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
            <strong className="text-xs text-white truncate">8.5112</strong>
          </div>
          <div className="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
            <span className="text-[0.55rem] text-text-muted uppercase tracking-wider truncate">% OF SUPPLY</span>
            <strong className="text-xs text-white truncate">0.000009%</strong>
          </div>
          <div className="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
            <span className="text-[0.55rem] text-text-muted uppercase tracking-wider truncate">TOTAL SUPPLY (REF.)</span>
            <strong className="text-xs text-white truncate">100,000,000</strong>
          </div>
          <div className="flex flex-col bg-accent-primary/10 px-2 py-1 rounded border border-accent-primary/30">
            <span className="text-[0.55rem] text-accent-primary uppercase tracking-wider truncate">CLASSIFICATION</span>
            <strong className="text-xs text-accent-primary font-bold truncate">Observador</strong>
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
            <strong className="text-xs text-white truncate">7/16/2026</strong>
          </div>
          <div className="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
            <span className="text-[0.55rem] text-text-muted uppercase tracking-wider truncate">LAST TX</span>
            <strong className="text-xs text-white truncate">7/21/2026</strong>
          </div>
          <div className="flex flex-col bg-surface-1/30 px-2 py-1 rounded border border-white/5">
            <span className="text-[0.55rem] text-text-muted uppercase tracking-wider truncate">DAYS SINCE GENESIS</span>
            <strong className="text-xs text-white truncate">4 d</strong>
          </div>
          <div className="flex flex-col bg-accent-primary/10 px-2 py-1 rounded border border-accent-primary/30">
            <span className="text-[0.55rem] text-accent-primary uppercase tracking-wider truncate">BADGE</span>
            <strong className="text-xs text-accent-primary font-bold truncate">Founder (Week 1)</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
