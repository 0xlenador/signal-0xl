'use client';
import Image from 'next/image';
import { Globe, Droplets, BookOpen, ExternalLink, Search, MoreVertical } from 'lucide-react';
import { useNetworkStats } from '@/hooks';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
      <svg width="48" height="20" viewBox="0 0 48 20" className="opacity-90 overflow-visible transition-all duration-300">
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={glowColor} stopOpacity={0.2} />
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
    <Card className="p-4 shadow-sm flex flex-col justify-between group transition-shadow duration-300 relative">
      <div className="flex items-center justify-between mb-4 relative z-10 pb-1">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <span className="flex items-center gap-2">
            <Image src="/assets/arc-logo.jpg" alt="Arc" width={22} height={22} className="rounded-full object-cover border border-border" />
            ARC TESTNET 
          </span>
          <Badge variant="outline" className={`h-5 px-2 py-0 gap-1.5 font-medium ${
            stats.isLoading ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30' :
            stats.isError ? 'bg-destructive/10 text-destructive border-destructive/20' :
            'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${stats.isError ? '' : 'animate-pulse'} ${
              stats.isLoading ? 'bg-amber-500' :
              stats.isError ? 'bg-destructive' :
              'bg-green-500'
            }`}></span>
            {stats.isLoading ? 'CONNECTING' : stats.isError ? 'ISSUES' : 'ONLINE'}
          </Badge>
        </h3>
        
        {/* Quick Links Section */}
        <div className="hidden md:flex items-center gap-4 text-muted-foreground font-medium text-xs">
          <a href="https://faucet.circle.com/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors group/link">
            <Droplets className="w-3.5 h-3.5" />
            <span>Faucet</span>
            <ExternalLink className="w-2 h-2 opacity-50 -ml-0.5 group-hover/link:opacity-100 transition-opacity" />
          </a>
          <a href="https://docs.arc.io/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors group/link">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Docs</span>
            <ExternalLink className="w-2 h-2 opacity-50 -ml-0.5 group-hover/link:opacity-100 transition-opacity" />
          </a>
          <a href="https://www.arc.io/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors group/link">
            <Globe className="w-3.5 h-3.5" />
            <span>Website</span>
            <ExternalLink className="w-2 h-2 opacity-50 -ml-0.5 group-hover/link:opacity-100 transition-opacity" />
          </a>
          <a href="https://testnet.arcscan.app/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors group/link">
            <Search className="w-3.5 h-3.5" />
            <span>Explorer</span>
            <ExternalLink className="w-2 h-2 opacity-50 -ml-0.5 group-hover/link:opacity-100 transition-opacity" />
          </a>
        </div>

        {/* Quick Links Dropdown (Mobile) */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground p-1.5 rounded-md bg-muted/40 border border-border">
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 z-[9999]">
              <DropdownMenuItem>
                <a href="https://faucet.circle.com/" target="_blank" rel="noreferrer" className="flex items-center gap-2 cursor-pointer text-xs w-full">
                  <Droplets className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Faucet</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a href="https://docs.arc.io/" target="_blank" rel="noreferrer" className="flex items-center gap-2 cursor-pointer text-xs w-full">
                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Docs</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a href="https://www.arc.io/" target="_blank" rel="noreferrer" className="flex items-center gap-2 cursor-pointer text-xs w-full">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Website</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a href="https://testnet.arcscan.app/" target="_blank" rel="noreferrer" className="flex items-center gap-2 cursor-pointer text-xs w-full">
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Explorer</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Network Stats Grid */}
      <div className="flex-grow w-full relative z-10 overflow-x-hidden">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
          {/* GAS */}
          <div className="bg-muted/40 border border-border rounded-lg p-1.5 sm:p-3 flex flex-col justify-center sm:justify-between hover:bg-muted/60 transition-colors shadow-sm">
            <span className="text-[0.55rem] sm:text-[0.65rem] text-muted-foreground uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1 font-semibold truncate" title="GAS COST">
              ⛽ GAS<span className="hidden sm:inline"> COST</span>
            </span>
            <div className="mt-1 sm:mt-2 flex items-end justify-center sm:justify-between">
              <span className="text-[0.65rem] sm:text-sm font-semibold text-foreground tracking-tight truncate">{stats.gasPrice} <span className="text-[0.55rem] sm:text-[0.6rem] text-muted-foreground font-medium hidden lg:inline">USDC</span></span>
              <div className="hidden sm:block"><Sparkline color="#64748b" glowColor="#64748b" data={stats.history.gas} /></div>
            </div>
          </div>
          {/* BLK TIME */}
          <div className="bg-muted/40 border border-border rounded-lg p-1.5 sm:p-3 flex flex-col justify-center sm:justify-between hover:bg-muted/60 transition-colors shadow-sm">
            <span className="text-[0.55rem] sm:text-[0.65rem] text-muted-foreground uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1 font-semibold truncate" title="AVG BLK TIME">
              ⏱ TIME
            </span>
            <div className="mt-1 sm:mt-2 flex items-end justify-center sm:justify-between">
              <span className="text-[0.65rem] sm:text-sm font-semibold text-foreground tracking-tight truncate">{stats.blockTime} <span className="text-[0.55rem] sm:text-[0.6rem] text-muted-foreground font-medium hidden lg:inline">ms</span></span>
              <div className="hidden sm:block"><Sparkline color="#8b5cf6" glowColor="#8b5cf6" data={stats.history.time} /></div>
            </div>
          </div>
          {/* BLOCKS */}
          <div className="bg-muted/40 border border-border rounded-lg p-1.5 sm:p-3 flex flex-col justify-center sm:justify-between hover:bg-muted/60 transition-colors shadow-sm">
            <span className="text-[0.55rem] sm:text-[0.65rem] text-muted-foreground uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1 font-semibold truncate" title="BLOCKS">
              📦 BLOCKS
            </span>
            <div className="mt-1 sm:mt-2 flex items-end justify-center sm:justify-between">
              <span className="text-[0.65rem] sm:text-sm font-semibold text-foreground tracking-tight truncate">{stats.totalBlocks}</span>
              <div className="hidden sm:block"><Sparkline color="#f59e0b" glowColor="#f59e0b" data={stats.history.blocks} /></div>
            </div>
          </div>
          {/* TXS */}
          <div className="bg-muted/40 border border-border rounded-lg p-1.5 sm:p-3 flex flex-col justify-center sm:justify-between hover:bg-muted/60 transition-colors shadow-sm">
            <span className="text-[0.55rem] sm:text-[0.65rem] text-muted-foreground uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1 font-semibold truncate" title="TXS / BLK">
              🔄 TXS<span className="hidden sm:inline">/BLK</span>
            </span>
            <div className="mt-1 sm:mt-2 flex items-end justify-center sm:justify-between">
              <span className="text-[0.65rem] sm:text-sm font-semibold text-foreground tracking-tight truncate">{stats.totalTxs}</span>
              <div className="hidden sm:block"><Sparkline color="#10b981" glowColor="#10b981" data={stats.history.txs} /></div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
