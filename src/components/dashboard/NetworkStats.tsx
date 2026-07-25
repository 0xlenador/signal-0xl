'use client';
import Image from 'next/image';

import { Globe, Droplets, BookOpen, ExternalLink, Search } from 'lucide-react';
import { useNetworkStats } from '@/hooks';

// Helper component for mini aesthetic charts (Sparklines)
const Sparkline = ({ color, points, glowColor }: { color: string, points: string, glowColor: string }) => (
  <svg width="48" height="20" viewBox="0 0 48 20" className="opacity-90">
    <defs>
      <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={glowColor} stopOpacity={0.4} />
        <stop offset="100%" stopColor={glowColor} stopOpacity={0} />
      </linearGradient>
    </defs>
    <path d={`M 0 20 L ${points} L 48 20 Z`} fill={`url(#grad-${color.replace('#', '')})`} stroke="none" />
    <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function NetworkStats() {
  const stats = useNetworkStats();

  return (
    <div className="glass-panel rounded-3xl p-5 shadow-lg relative flex flex-col justify-between group hover:shadow-glow-cyan transition-shadow duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent pointer-events-none rounded-3xl group-hover:from-accent-primary/10 transition-colors"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10 pb-3">
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <span className="group-hover:text-accent-primary transition-colors flex items-center gap-2">
            <Image src="/assets/arc-logo.jpg" alt="Arc" width={22} height={22} className="rounded-full object-cover shadow-[0_0_8px_rgba(0,229,255,0.3)]" />
            ARC TESTNET 
          </span>
          <span className="text-[0.6rem] bg-accent-success/10 text-accent-success px-2 py-0.5 rounded-full border border-accent-success/30 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse"></span>
            ONLINE
          </span>
        </h3>
        
        {/* Quick Links Section */}
        <div className="flex items-center gap-4 text-text-muted">
          <a href="https://faucet.circle.com/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-accent-primary transition-colors group/link text-[0.80rem] font-medium tracking-wide">
            <Droplets className="w-3.5 h-3.5" />
            <span>Faucet</span>
            <ExternalLink className="w-2 h-2 opacity-50 -ml-0.5 group-hover/link:opacity-100 transition-opacity" />
          </a>
          <a href="https://docs.arc.io/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-accent-primary transition-colors group/link text-[0.80rem] font-medium tracking-wide">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Docs</span>
            <ExternalLink className="w-2 h-2 opacity-50 -ml-0.5 group-hover/link:opacity-100 transition-opacity" />
          </a>
          <a href="https://www.arc.io/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-accent-primary transition-colors group/link text-[0.80rem] font-medium tracking-wide">
            <Globe className="w-3.5 h-3.5" />
            <span>Website</span>
            <ExternalLink className="w-2 h-2 opacity-50 -ml-0.5 group-hover/link:opacity-100 transition-opacity" />
          </a>
          <a href="https://testnet.arcscan.app/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-accent-primary transition-colors group/link text-[0.80rem] font-medium tracking-wide">
            <Search className="w-3.5 h-3.5" />
            <span>Explorer</span>
            <ExternalLink className="w-2 h-2 opacity-50 -ml-0.5 group-hover/link:opacity-100 transition-opacity" />
          </a>
        </div>
      </div>
      
      {/* Network Stats Grid */}
      <div className="flex-grow w-full relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* GAS */}
          <div className="bg-surface-1/50 border border-border-light/50 rounded-xl p-3 flex flex-col justify-between hover:bg-surface-1 transition-colors group/stat shadow-sm">
            <span className="text-[0.6rem] text-text-muted uppercase tracking-wider flex items-center gap-1 font-bold">⛽ GAS</span>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-sm font-bold text-white tracking-tight">{stats.gasPrice} <span className="text-[0.6rem] text-text-muted font-normal">Gwei</span></span>
              <Sparkline color="#00e5ff" glowColor="#00e5ff" points="0,15 12,18 24,10 36,14 48,8" />
            </div>
          </div>
          {/* BLK TIME */}
          <div className="bg-surface-1/50 border border-border-light/50 rounded-xl p-3 flex flex-col justify-between hover:bg-surface-1 transition-colors group/stat shadow-sm">
            <span className="text-[0.6rem] text-text-muted uppercase tracking-wider flex items-center gap-1 font-bold">⏱ BLK TIME</span>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-sm font-bold text-white tracking-tight">{stats.blockTime} <span className="text-[0.6rem] text-text-muted font-normal">s</span></span>
              <Sparkline color="#ff007f" glowColor="#ff007f" points="0,10 12,12 24,10 36,11 48,10" />
            </div>
          </div>
          {/* BLOCKS */}
          <div className="bg-surface-1/50 border border-border-light/50 rounded-xl p-3 flex flex-col justify-between hover:bg-surface-1 transition-colors group/stat shadow-sm">
            <span className="text-[0.6rem] text-text-muted uppercase tracking-wider flex items-center gap-1 font-bold">📦 BLOCKS</span>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-sm font-bold text-white tracking-tight">{stats.totalBlocks}</span>
              <Sparkline color="#ffaa00" glowColor="#ffaa00" points="0,18 12,14 24,10 36,6 48,2" />
            </div>
          </div>
          {/* TXS */}
          <div className="bg-surface-1/50 border border-border-light/50 rounded-xl p-3 flex flex-col justify-between hover:bg-surface-1 transition-colors group/stat shadow-sm">
            <span className="text-[0.6rem] text-text-muted uppercase tracking-wider flex items-center gap-1 font-bold">🔄 TXS</span>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-sm font-bold text-white tracking-tight">{stats.totalTxs}</span>
              <Sparkline color="#00e676" glowColor="#00e676" points="0,16 12,8 24,12 36,4 48,2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
