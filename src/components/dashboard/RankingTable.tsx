'use client';

import { Trophy, Info, Loader2 } from 'lucide-react';
import { useLeaderboard } from '@/hooks';
import { useWeb3 } from '../Web3Provider';
import { CONSTANTS } from '@/lib/config';

// Skeleton Row Component
const SkeletonRow = ({ index }: { index: number }) => (
  <tr className="border-b border-border-light/10">
    <td className="p-3">
      <div className="w-6 h-4 bg-surface-2 animate-pulse rounded mx-auto"></div>
    </td>
    <td className="p-3">
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 bg-surface-2 animate-pulse rounded-full"></div>
        <div className="w-24 h-4 bg-surface-2 animate-pulse rounded"></div>
      </div>
    </td>
    <td className="p-3 text-right">
      <div className="w-8 h-4 bg-surface-2 animate-pulse rounded ml-auto"></div>
    </td>
    <td className="p-3 text-right">
      <div className="w-10 h-4 bg-surface-2 animate-pulse rounded ml-auto"></div>
    </td>
  </tr>
);

export default function RankingTable() {
  const { leaderboard, isLoading, isScanning } = useLeaderboard();
  const { address } = useWeb3();

  const shortAddress = (addr: string | null) => addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : '';

  return (
    <section className="glass-panel rounded-3xl p-5 shadow-lg flex-grow flex flex-col relative group">
      <div className="absolute inset-0 bg-gradient-to-t from-accent-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2 border-b border-border-light pb-3 relative z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-accent-warning drop-shadow-md" /> 
          <span className="group-hover:text-accent-primary transition-colors">Signal Leaderboard</span>
          {isScanning && <Loader2 className="w-4 h-4 text-accent-primary animate-spin ml-2" />}
        </h2>
        <div className="text-xs text-text-muted font-mono bg-surface-2 px-3 py-1 rounded-full border border-border-light flex items-center gap-2">
          {isScanning && <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></span>}
          {isLoading ? 'Scanning Network...' : `${leaderboard.length} signalers`}
        </div>
      </div>

      <div className="table-wrapper flex-grow overflow-y-auto pr-2 custom-scrollbar">
        <table className="ranking-table w-full text-left border-collapse text-sm">
          <thead className="sticky top-0 bg-surface-1/90 backdrop-blur-md z-20">
            <tr>
              <th className="p-3 text-[0.65rem] text-text-muted uppercase tracking-wider border-b border-border-light font-medium">Rank</th>
              <th className="p-3 text-[0.65rem] text-text-muted uppercase tracking-wider border-b border-border-light font-medium">Address</th>
              <th className="p-3 text-[0.65rem] text-text-muted uppercase tracking-wider border-b border-border-light font-medium text-right">Score</th>
              <th className="p-3 text-[0.65rem] text-text-muted uppercase tracking-wider border-b border-border-light font-medium text-right">Fork</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Modo de Carga Total: Mostrar 5 filas Skeleton puras
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={`skel-load-${i}`} index={i} />)
            ) : leaderboard.length === 0 && !isScanning ? (
              <tr><td colSpan={4} className="p-4 text-center text-text-muted text-sm italic">Sin datos disponibles.</td></tr>
            ) : (
              <>
                {leaderboard.slice(0, CONSTANTS.LEADERBOARD_DISPLAY_LIMIT).map((user, index) => {
                  const isMe = address && user.address.toLowerCase() === address.toLowerCase();
                  return (
                    <tr key={user.address} className={`border-b border-border-light/20 hover:bg-surface-2/50 transition-colors ${isMe ? 'bg-accent-primary/10' : ''}`}>
                      <td className="p-3">
                        <span className="text-xs font-bold w-6 inline-block text-center text-text-muted">{index + 1}</span>
                      </td>
                      <td className="p-3 font-mono text-[0.75rem] text-white flex items-center gap-2">
                        {index < 3 && <Trophy className={`w-3.5 h-3.5 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : 'text-amber-600'}`} />}
                        {shortAddress(user.address)}
                        {isMe && <span className="ml-2 text-[0.55rem] font-bold bg-accent-primary/20 text-accent-primary px-1.5 py-0.5 rounded border border-accent-primary/50">YOU</span>}
                      </td>
                      <td className="p-3 text-right text-xs font-bold text-accent-primary">{user.totalPoints}</td>
                      <td className="p-3 text-right">
                        <span className="text-[0.6rem] font-bold bg-accent-warning/20 text-accent-warning px-1.5 py-0.5 rounded border border-accent-warning/30">Lv {user.forkLevel}</span>
                      </td>
                    </tr>
                  );
                })}
                {/* Progressive Rendering: Si sigue escaneando, mostrar 1 o 2 Skeletons al final */}
                {isScanning && (
                  <>
                    <SkeletonRow index={leaderboard.length} />
                    <SkeletonRow index={leaderboard.length + 1} />
                  </>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
