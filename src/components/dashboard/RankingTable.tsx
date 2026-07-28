'use client';

import { Trophy, Medal, Crown, Loader2, Sparkles } from 'lucide-react';
import { useWeb3 } from '../Web3Provider';
import { CONSTANTS } from '@/lib/config';
import type { ILeaderboardUser } from '@/lib/leaderboardService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface RankingTableProps {
  initialData: ILeaderboardUser[];
}

// Skeleton Row Component
const SkeletonRow = () => (
  <TableRow className="border-b border-slate-50">
    <TableCell className="w-16 text-center py-3"><div className="w-7 h-7 bg-slate-100 animate-pulse rounded-full mx-auto"></div></TableCell>
    <TableCell className="w-full py-3">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 bg-slate-200 animate-pulse rounded-full flex-shrink-0"></div>
        <div className="w-24 h-3.5 bg-slate-100 animate-pulse rounded"></div>
      </div>
    </TableCell>
    <TableCell className="w-24 text-center py-3"><div className="w-8 h-3.5 bg-slate-100 animate-pulse rounded mx-auto"></div></TableCell>
    <TableCell className="w-24 text-center py-3"><div className="w-10 h-4 bg-slate-100 animate-pulse rounded-full mx-auto"></div></TableCell>
  </TableRow>
);

export default function RankingTable({ initialData }: RankingTableProps) {
  const leaderboard = initialData || [];
  const isLoading = false;
  const isScanning = false;
  const { address } = useWeb3();

  const shortAddress = (addr: string | null) => addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : '';

  return (
    <section className="bg-white rounded-[2rem] border border-slate-200/80 shadow-md p-6 flex-grow flex flex-col relative group transition-all duration-300 hover:shadow-xl hover:border-slate-300 h-full min-h-[400px]">
      <div className="absolute inset-0 bg-gradient-to-t from-accent-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[2rem]"></div>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 relative z-10 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-warning/20 to-accent-warning/5 border border-accent-warning/20 flex items-center justify-center shadow-sm">
            <Trophy className="w-5 h-5 text-accent-warning drop-shadow-sm" /> 
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-black flex items-center gap-2 tracking-tight">
              Signal Leaderboard
              {isScanning && <Loader2 className="w-4 h-4 text-accent-primary animate-spin ml-1" />}
            </h2>
            <p className="text-xs text-slate-900 font-extrabold mt-0.5">Top contributors on Arc Testnet</p>
          </div>
        </div>
        
        <Badge variant="secondary" className="text-slate-900 font-extrabold bg-slate-100 hover:bg-slate-200 border-slate-300 font-mono text-xs px-3 py-1 shadow-sm flex items-center gap-2 transition-colors">
          {isScanning && <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse shadow-glow-cyan"></span>}
          {isLoading ? 'Scanning...' : `${leaderboard.length} signalers`}
        </Badge>
      </div>

      {/* Table Area */}
      <div className="flex-grow relative z-10 overflow-hidden flex flex-col min-h-0">
        <ScrollArea className="flex-grow">
          <Table className="w-full">
            <TableHeader className="bg-white sticky top-0 z-20">
              <TableRow className="border-b border-slate-200 hover:bg-transparent">
                <TableHead className="w-16 text-center text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-900 py-3">Rank</TableHead>
                <TableHead className="w-full text-left text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-900 py-3">Address</TableHead>
                <TableHead className="w-24 text-center text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-900 py-3">Score</TableHead>
                <TableHead className="w-24 text-center text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-900 py-3">Tier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={`skel-load-${i}`} />)
              ) : leaderboard.length === 0 && !isScanning ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-500 text-sm font-medium">
                    No signals found yet.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {leaderboard.slice(0, CONSTANTS.LEADERBOARD_DISPLAY_LIMIT).map((user, index) => {
                    const isMe = address && user.address.toLowerCase() === address.toLowerCase();
                    const isRank1 = index === 0;
                    const isRank2 = index === 1;
                    const isRank3 = index === 2;
                    
                    return (
                      <TableRow 
                        key={user.address} 
                        className={cn(
                          "transition-all duration-300 group/row border-b border-slate-50 hover:bg-slate-50/50",
                          isRank1 && "bg-amber-50/30 hover:bg-amber-50/60",
                          isRank2 && "bg-slate-50/50 hover:bg-slate-100/50",
                          isRank3 && "bg-orange-50/30 hover:bg-orange-50/60",
                          isMe && "bg-accent-primary/5 hover:bg-accent-primary/10"
                        )}
                      >
                        <TableCell className="w-16 text-center py-3">
                          {isRank1 ? (
                            <div className="w-7 h-7 mx-auto rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shadow-sm">
                              <Crown className="w-3.5 h-3.5 text-amber-500 drop-shadow-sm" />
                            </div>
                          ) : isRank2 ? (
                            <div className="w-7 h-7 mx-auto rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
                              <Medal className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                          ) : isRank3 ? (
                            <div className="w-7 h-7 mx-auto rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shadow-sm">
                              <Medal className="w-3.5 h-3.5 text-orange-500" />
                            </div>
                          ) : (
                            <span className="text-sm font-extrabold text-slate-900">
                              {index + 1}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="w-full py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full shadow-sm",
                              isRank1 ? "bg-amber-400" :
                              isRank2 ? "bg-slate-400" :
                              isRank3 ? "bg-orange-400" :
                              isMe ? "bg-accent-primary" :
                              "bg-slate-300"
                            )}></div>
                            <span className={cn(
                              "font-mono text-xs tracking-wide transition-colors",
                              isRank1 ? "text-amber-700 font-bold" :
                              isRank2 ? "text-slate-700 font-bold" :
                              isRank3 ? "text-orange-700 font-bold" :
                              isMe ? "text-accent-primary font-bold" :
                              "text-slate-700 font-medium"
                            )}>
                              {shortAddress(user.address)}
                            </span>
                            {isMe && (
                              <Badge variant="default" className="ml-2 px-1.5 py-0 h-4 bg-accent-primary hover:bg-accent-primary-dim text-white border-transparent text-[0.55rem] tracking-wider uppercase font-bold shadow-sm">
                                YOU
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="w-24 text-center py-3">
                          <div className={cn(
                            "text-sm font-bold inline-flex items-center justify-center",
                            isRank1 ? "text-amber-700" :
                            isRank2 ? "text-slate-700" :
                            isRank3 ? "text-orange-700" :
                            "text-slate-700"
                          )}>
                            {user.totalPoints}
                          </div>
                        </TableCell>
                        <TableCell className="w-24 text-center py-3">
                          {user.forkLevel <= 1 ? (
                            <Badge variant="default" className="bg-slate-900 hover:bg-slate-800 text-white border-transparent text-[0.60rem] font-bold px-2 py-0.5 h-5 uppercase shadow-sm flex items-center justify-center gap-1 mx-auto w-fit">
                              <Sparkles className="w-2.5 h-2.5 text-accent-vip" /> VIP
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200 font-bold text-[0.60rem] px-2 py-0.5 h-5 shadow-sm flex items-center justify-center mx-auto w-fit tracking-wide">
                              Lv {user.forkLevel}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {isScanning && (
                    <>
                      <SkeletonRow />
                      <SkeletonRow />
                    </>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </section>
  );
}
