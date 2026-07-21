'use client';

import { Globe } from 'lucide-react';

export default function NetworkStats() {
  return (
    <div className="glass-panel rounded-3xl p-5 shadow-lg relative flex flex-col justify-between group hover:shadow-glow-cyan transition-shadow duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent pointer-events-none rounded-3xl group-hover:from-accent-primary/10 transition-colors"></div>
      <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center justify-between relative z-10">
        <span className="group-hover:text-accent-primary transition-colors flex items-center gap-2">
          <img src="/assets/arc-logo.jpg" alt="Arc" className="w-5 h-5 rounded-full object-cover" />
          ARC TESTNET 
          <span className="text-[0.6rem] ml-1 bg-accent-success/10 text-accent-success px-2 py-0.5 rounded-full border border-accent-success/20">ONLINE</span>
        </span>
        <span className="cursor-help relative group/tt opacity-80 group-hover:opacity-100 transition-opacity flex items-center text-accent-primary">
          <Globe className="w-5 h-5 drop-shadow-md" />
        </span>
      </h3>
      
      {/* Network Stats Grid (Reconstructed) */}
      <div className="flex-grow w-full relative z-10 mt-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* GAS */}
          <div className="bg-surface-1 border border-border-light rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[0.6rem] text-text-muted uppercase tracking-wider flex items-center gap-1">⛽ GAS</span>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-sm font-bold text-white">22.56 <span className="text-[0.6rem] text-text-muted font-normal">Gwei</span></span>
              <div className="w-8 h-4 border-b-2 border-accent-primary"></div>
            </div>
          </div>
          {/* BLK TIME */}
          <div className="bg-surface-1 border border-border-light rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[0.6rem] text-text-muted uppercase tracking-wider flex items-center gap-1">⏱ BLK TIME</span>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-sm font-bold text-white">0.77 <span className="text-[0.6rem] text-text-muted font-normal">s</span></span>
              <div className="w-8 h-4 border-b-2 border-accent-runestone"></div>
            </div>
          </div>
          {/* BLOCKS */}
          <div className="bg-surface-1 border border-border-light rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[0.6rem] text-text-muted uppercase tracking-wider flex items-center gap-1">📦 BLOCKS</span>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-sm font-bold text-white">52,960,494</span>
              <div className="w-8 h-4 border-b-2 border-accent-warning"></div>
            </div>
          </div>
          {/* TXS */}
          <div className="bg-surface-1 border border-border-light rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[0.6rem] text-text-muted uppercase tracking-wider flex items-center gap-1">🔄 TXS</span>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-sm font-bold text-white">1,615,536</span>
              <div className="w-8 h-4 border-b-2 border-accent-success"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
