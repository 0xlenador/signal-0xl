'use client';
import Image from 'next/image';

import { Globe, Droplets, BookOpen, ExternalLink, Search } from 'lucide-react';
import { useNetworkStats } from '@/hooks';

// Helper component for mini aesthetic charts (Sparklines)
const Sparkline = ({ color, data, glowColor }: { color: string, data: number[], glowColor: string }) => {
  const width = 48;
  const height = 20;
  
  let points = `0,${height} ${width},${height}`;
  
  if (data && data.length > 0) {
    if (data.length === 1) {
      const y = height / 2;
      points = `0,${y} ${width},${y}`;
    } else {
      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min || 1;
      const stepX = width / Math.max(data.length - 1, 1);
      
      points = data.map((val, i) => {
        const x = i * stepX;
        let y;
        if (min === max) {
          y = height / 2;
        } else {
          y = 2 + (height - 4) * (1 - (val - min) / range);
        }
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
    }
  }

  return (
    <div className="relative group/sparkline flex items-center justify-center">
      <svg width="48" height="20" viewBox="0 0 48 20" className="opacity-90 overflow-visible transition-all duration-300 group-hover/stat:drop-shadow-[0_0_6px_var(--glow)]" style={{ '--glow': glowColor } as React.CSSProperties}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={glowColor} stopOpacity={0.4} />
            <stop offset="100%" stopColor={glowColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        {data && data.length > 0 && (
          <>
            <path 
              d={`M 0 ${height} L ${points} L ${width} ${height} Z`} 
              fill={`url(#grad-${color.replace('#', '')})`} 
              stroke="none" 
              className="transition-all duration-300 ease-in-out"
            />
            <polyline 
              points={points} 
              fill="none" 
              stroke={color} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="transition-all duration-300 ease-in-out"
            />
          </>
        )}
      </svg>
    </div>
  );
};

export default function NetworkStats() {
  const stats = useNetworkStats();

  return (
    <div className="glass-panel rounded-3xl p-5 shadow-lg relative flex flex-col justify-between group hover:shadow-glow-cyan transition-shadow duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent pointer-events-none rounded-3xl group-hover:from-accent-primary/10 transition-colors"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10 pb-3">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <span className="group-hover:text-black transition-colors flex items-center gap-2">
            <Image src="/assets/arc-logo.jpg" alt="Arc" width={22} height={22} className="rounded-full object-cover shadow-[0_0_8px_rgba(0,229,255,0.3)]" />
            ARC TESTNET 
          </span>
          <span className={`text-[0.6rem] px-2 py-0.5 rounded-full border flex items-center gap-1.5 shadow-sm ${
            stats.isLoading ? 'bg-accent-warning/10 text-accent-warning border-accent-warning/30' :
            stats.isError ? 'bg-accent-error/10 text-accent-error border-accent-error/30' :
            'bg-accent-success/10 text-accent-success border-accent-success/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${stats.isError ? '' : 'animate-pulse'} ${
              stats.isLoading ? 'bg-accent-warning' :
              stats.isError ? 'bg-accent-error' :
              'bg-accent-success'
            }`}></span>
            {stats.isLoading ? 'CONNECTING' : stats.isError ? 'ISSUES' : 'ONLINE'}
          </span>
        </h3>
        
        {/* Quick Links Section */}
        <div className="flex items-center gap-4 text-slate-900 font-bold">
          <a href="https://faucet.circle.com/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-black transition-colors group/link text-[0.80rem] font-bold tracking-wide">
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
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:bg-slate-200/60 transition-colors group/stat shadow-sm">
            <span className="text-[0.6rem] text-slate-900 uppercase tracking-wider flex items-center gap-1 font-extrabold">⛽ GAS COST</span>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-sm font-extrabold text-black tracking-tight">{stats.gasPrice} <span className="text-[0.6rem] text-slate-900 font-bold">USDC</span></span>
              <Sparkline color="#000000" glowColor="#000000" data={stats.history.gas} />
            </div>
          </div>
          {/* BLK TIME */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:bg-slate-200/60 transition-colors group/stat shadow-sm">
            <span className="text-[0.6rem] text-slate-900 uppercase tracking-wider flex items-center gap-1 font-extrabold">⏱ AVG BLK TIME</span>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-sm font-extrabold text-black tracking-tight">{stats.blockTime} <span className="text-[0.6rem] text-slate-900 font-bold">ms</span></span>
              <Sparkline color="#ff007f" glowColor="#ff007f" data={stats.history.time} />
            </div>
          </div>
          {/* BLOCKS */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:bg-slate-200/60 transition-colors group/stat shadow-sm">
            <span className="text-[0.6rem] text-slate-900 uppercase tracking-wider flex items-center gap-1 font-extrabold">📦 BLOCKS</span>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-sm font-extrabold text-black tracking-tight">{stats.totalBlocks}</span>
              <Sparkline color="#ffaa00" glowColor="#ffaa00" data={stats.history.blocks} />
            </div>
          </div>
          {/* TXS */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:bg-slate-200/60 transition-colors group/stat shadow-sm">
            <span className="text-[0.6rem] text-slate-900 uppercase tracking-wider flex items-center gap-1 font-extrabold">🔄 TXS / BLK</span>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-sm font-extrabold text-black tracking-tight">{stats.totalTxs}</span>
              <Sparkline color="#00e676" glowColor="#00e676" data={stats.history.txs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
