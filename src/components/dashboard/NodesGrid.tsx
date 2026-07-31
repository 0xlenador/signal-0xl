'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Microscope, Gem, Landmark, Info, Loader2 } from 'lucide-react';
import { useNodesData } from '@/hooks';
import { useSignalContract } from '@/hooks';
import { useUserDataStore } from '@/stores/userDataStore';
import { useParams } from 'next/navigation';
import { useWeb3 } from '../Web3Provider';
import { formatUnits, parseUnits } from 'viem';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CONSTANTS } from '@/lib/config';

// Pure function: calculates node instant cost from userData, no RPC needed
function calculateNodeInstantCost(
  nodeId: number,
  onChainForkLevel: number,
): bigint {
  const baseCost = CONSTANTS.BASE_GM_COST_WEI;
  if (onChainForkLevel > 1) return baseCost; // B2+ pays only base cost
  if (nodeId === 1) return baseCost + parseUnits('0.5', 18);
  if (nodeId === 2) return baseCost + parseUnits('1.25', 18);
  if (nodeId === 3) return baseCost + parseUnits('5', 18);
  return baseCost;
}

export default function NodesGrid() {
  const { address } = useWeb3();
  const params = useParams();
  const walletParam = params.wallet as string;
  const isOwner = address?.toLowerCase() === walletParam?.toLowerCase();

  // Node data from Blockscout (via nodesDataStore)
  const data = useNodesData(walletParam);
  
  // User data from central store (reactive)
  const userData = useUserDataStore((s) => s.userData);
  const hasGMToday = useUserDataStore((s) => s.hasGMToday);
  
  // Write-only contract functions
  const { activateNodeInstant, activateNodeByStreak } = useSignalContract();

  // Costs computed synchronously based on user on-chain fork level
  const isB2Plus = userData && userData.onChainForkLevel > 1;
  const cost1 = isB2Plus ? '0.01' : '0.51';
  const cost2 = isB2Plus ? '0.01' : '1.26';
  const cost3 = isB2Plus ? '0.01' : '5.01';

  // Loading states
  const [loadingNode1Streak, setLoadingNode1Streak] = useState(false);
  const [loadingNode1Instant, setLoadingNode1Instant] = useState(false);
  const [loadingNode2Streak, setLoadingNode2Streak] = useState(false);
  const [loadingNode2Instant, setLoadingNode2Instant] = useState(false);
  const [loadingNode3Streak, setLoadingNode3Streak] = useState(false);
  const [loadingNode3Instant, setLoadingNode3Instant] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleActivateInstant = async (nodeId: number, setLoader: (l: boolean) => void) => {
    if (!address || !userData) return;
    setLoader(true);
    // Calculate cost locally — no RPC needed
    const costWei = calculateNodeInstantCost(nodeId, userData.onChainForkLevel);
    const success = await activateNodeInstant(nodeId, costWei);
    // After activateNodeInstant returns, the store is already refreshed
    // via handlePostTransaction — no manual state update needed.
    setLoader(false);
  };

  const handleActivateStreak = async (nodeId: number, setLoader: (l: boolean) => void) => {
    if (!address) return;
    setLoader(true);
    await activateNodeByStreak(nodeId);
    // After activateNodeByStreak returns, the store is already refreshed
    setLoader(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* NODO 1: Compromiso */}
      <Card className="p-4 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative group" id="node1-card">
        <div className="absolute top-0 right-0 w-16 h-16 bg-muted/20 rounded-bl-full pointer-events-none group-hover:bg-muted/40 transition-colors"></div>
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
            <Microscope className="w-5 h-5 text-primary drop-shadow-sm" /> 
            <span>Node 1 — Commitment</span>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger className="cursor-help flex items-center justify-center focus:outline-none">
                <Info className="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity" />
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-xl text-[0.65rem] text-slate-300 text-left font-normal normal-case tracking-normal z-[9999]">
                Analyzes historical transaction volume and gas spent on Arc Testnet. Calculates your activity tier and score multiplier.
              </PopoverContent>
            </Popover>
            {userData?.nodeCommitment ? (
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-destructive shadow-sm"></div>
            )}
          </div>
        </div>
        
        {/* Requirement Badge */}
        {!userData?.nodeCommitment && (
           <Badge variant="outline" className="text-[0.65rem] font-mono text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900 w-max mb-2 px-1.5 py-0">Day 3</Badge>
        )}

        {/* Node 1 Data Grid */}
        {userData?.nodeCommitment && (
          <div className="grid grid-cols-2 gap-1.5 flex-grow relative z-10">
            <div className="flex flex-col bg-muted/40 px-2 py-1.5 rounded-lg border border-border/50 shadow-sm hover:bg-muted/60 transition-colors">
              <span className="text-[0.6rem] text-muted-foreground font-semibold uppercase tracking-wider truncate">TOTAL TRANSACTIONS</span>
              <strong className="text-xs text-foreground font-bold truncate">{data.isLoading ? '...' : data.commitment?.totalTxs.toLocaleString()}</strong>
            </div>
            <div className="flex flex-col bg-muted/40 px-2 py-1.5 rounded-lg border border-border/50 shadow-sm hover:bg-muted/60 transition-colors">
              <span className="text-[0.6rem] text-muted-foreground font-semibold uppercase tracking-wider truncate">FEES PAID</span>
              <strong className="text-xs text-foreground font-bold truncate">
                {data.isLoading ? '...' : (data.commitment?.totalFeePaid ? data.commitment.totalFeePaid : <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono animate-pulse">_[ENCRYPTED]_</span>)}
              </strong>
            </div>
            <div className="flex flex-col bg-primary hover:bg-primary/80 px-2 py-1 rounded border border-primary/20 col-span-2 shadow-sm">
              <span className="text-[0.6rem] text-primary-foreground/80 font-semibold uppercase tracking-wider truncate">TIER</span>
              <strong className="text-xs text-primary-foreground truncate">{data.isLoading ? '...' : data.commitment?.tier} <span className="text-[0.6rem] opacity-70">(×{data.isLoading ? '1' : data.commitment?.multiplier})</span></strong>
            </div>
          </div>
        )}

        {/* Acciones */}
        {!userData?.nodeCommitment && isOwner && (
          <div className="grid grid-cols-2 gap-2 mt-auto relative z-10">
            <div title={!hasGMToday ? "Must do GM first" : ""} className={!hasGMToday ? "cursor-not-allowed" : ""}>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => handleActivateStreak(1, setLoadingNode1Streak)} 
                disabled={loadingNode1Streak || loadingNode1Instant || (userData?.currentStreak || 0) < 3 || !hasGMToday}
                className={`text-xs h-8 w-full ${!hasGMToday ? "pointer-events-none" : ""}`}
              >
                {loadingNode1Streak ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Streak ({userData?.currentStreak || 0}/3)</span>}
              </Button>
            </div>
            <div title={!hasGMToday ? "Must do GM first" : ""} className={!hasGMToday ? "cursor-not-allowed" : ""}>
              <Button 
                size="sm"
                onClick={() => handleActivateInstant(1, setLoadingNode1Instant)}
                disabled={loadingNode1Streak || loadingNode1Instant || !hasGMToday}
                className={`text-xs h-8 w-full ${!hasGMToday ? "pointer-events-none" : ""}`}
              >
                {loadingNode1Instant ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Buy ({cost1} USDC)</span>}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* NODO 2: Convicción */}
      <Card className="p-4 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative group" id="node2-card">
        <div className="absolute top-0 right-0 w-16 h-16 bg-muted/20 rounded-bl-full pointer-events-none group-hover:bg-muted/40 transition-colors"></div>
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
            <Gem className="w-5 h-5 text-primary drop-shadow-sm" /> 
            <span>Node 2 — Conviction</span>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger className="cursor-help flex items-center justify-center focus:outline-none">
                <Info className="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity" />
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-xl text-[0.65rem] text-slate-300 text-left font-normal normal-case tracking-normal z-[9999]">
                Calculates the percentage of the total native USDC supply held in your wallet. Measures your economic weight on the network.
              </PopoverContent>
            </Popover>
            {userData?.nodeConviction ? (
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-destructive shadow-sm"></div>
            )}
          </div>
        </div>

        {/* Requirement Badge */}
        {!userData?.nodeConviction && (
           <Badge variant="outline" className="text-[0.65rem] font-mono text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900 w-max mb-2 px-1.5 py-0">Day 12</Badge>
        )}
        
        {/* Node 2 Data Grid */}
        {userData?.nodeConviction && (
          <div className="grid grid-cols-2 gap-1.5 flex-grow relative z-10">
            <div className="flex flex-col bg-muted/40 px-2 py-1.5 rounded-lg border border-border/50 shadow-sm hover:bg-muted/60 transition-colors">
              <span className="text-[0.6rem] text-muted-foreground font-semibold uppercase tracking-wider truncate">NATIVE BALANCE</span>
              <strong className="text-xs text-foreground font-bold truncate">{data.isLoading ? '...' : data.conviction?.balanceUSDC}</strong>
            </div>
            <div className="flex flex-col bg-muted/40 px-2 py-1.5 rounded-lg border border-border/50 shadow-sm hover:bg-muted/60 transition-colors">
              <span className="text-[0.6rem] text-muted-foreground font-semibold uppercase tracking-wider truncate">% OF SUPPLY</span>
              <strong className="text-xs text-foreground font-bold truncate">{data.isLoading ? '...' : data.conviction?.percentageOfSupply}%</strong>
            </div>
            <div className="flex flex-col bg-muted/40 px-2 py-1.5 rounded-lg border border-border/50 shadow-sm hover:bg-muted/60 transition-colors">
              <span className="text-[0.6rem] text-muted-foreground font-semibold uppercase tracking-wider truncate">TOTAL SUPPLY (REF.)</span>
              <strong className="text-xs text-foreground font-bold truncate">{data.isLoading ? '...' : data.conviction?.supplyTotal.toLocaleString()}</strong>
            </div>
            <div className="flex flex-col bg-primary hover:bg-primary/80 px-2 py-1 rounded border border-primary/20 shadow-sm">
              <span className="text-[0.6rem] text-primary-foreground/80 uppercase tracking-wider truncate">CLASS</span>
              <strong className="text-xs text-primary-foreground truncate">{data.isLoading ? '...' : data.conviction?.tier}</strong>
            </div>
          </div>
        )}

        {/* Acciones */}
        {!userData?.nodeConviction && isOwner && (
          <div className="grid grid-cols-2 gap-2 mt-auto relative z-10">
            <div title={!hasGMToday ? "Must do GM first" : ""} className={!hasGMToday ? "cursor-not-allowed" : ""}>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => handleActivateStreak(2, setLoadingNode2Streak)} 
                disabled={loadingNode2Streak || loadingNode2Instant || (userData?.currentStreak || 0) < 12 || !hasGMToday}
                className={`text-xs h-8 w-full ${!hasGMToday ? "pointer-events-none" : ""}`}
              >
                {loadingNode2Streak ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Streak ({userData?.currentStreak || 0}/12)</span>}
              </Button>
            </div>
            <div title={!hasGMToday ? "Must do GM first" : ""} className={!hasGMToday ? "cursor-not-allowed" : ""}>
              <Button 
                size="sm"
                onClick={() => handleActivateInstant(2, setLoadingNode2Instant)}
                disabled={loadingNode2Streak || loadingNode2Instant || !hasGMToday}
                className={`text-xs h-8 w-full ${!hasGMToday ? "pointer-events-none" : ""}`}
              >
                {loadingNode2Instant ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Buy ({cost2} USDC)</span>}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* NODO 3: Legado */}
      <Card className="p-4 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative group" id="node3-card">
        <div className="absolute top-0 right-0 w-16 h-16 bg-muted/20 rounded-bl-full pointer-events-none group-hover:bg-muted/40 transition-colors"></div>
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
            <Landmark className="w-5 h-5 text-primary drop-shadow-sm" /> 
            <span>Node 3 — Legacy</span>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger className="cursor-help flex items-center justify-center focus:outline-none">
                <Info className="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity" />
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-xl text-[0.65rem] text-slate-300 text-left font-normal normal-case tracking-normal z-[9999]">
                Analyzes the timestamp of your first and last transaction on Arc Testnet. The older you are on the network, the higher your legacy multiplier.
              </PopoverContent>
            </Popover>
            {userData?.nodeLegacy ? (
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-destructive shadow-sm"></div>
            )}
          </div>
        </div>

        {/* Requirement Badge */}
        {!userData?.nodeLegacy && (
           <Badge variant="outline" className="text-[0.65rem] font-mono text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900 w-max mb-2 px-1.5 py-0">Day 25</Badge>
        )}
        
        {/* Node 3 Data Grid */}
        {userData?.nodeLegacy && (
          <div className="grid grid-cols-2 gap-1.5 flex-grow relative z-10">
            <div className="flex flex-col bg-muted/40 px-2 py-1.5 rounded-lg border border-border/50 shadow-sm hover:bg-muted/60 transition-colors">
              <span className="text-[0.6rem] text-muted-foreground font-semibold uppercase tracking-wider truncate">FIRST TX</span>
              <strong className="text-xs text-foreground font-bold truncate">
                {data.isLoading ? '...' : (data.legacy?.firstTxDate ? data.legacy.firstTxDate.toLocaleDateString() : <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono animate-pulse">_[ENCRYPTED]_</span>)}
              </strong>
            </div>
            <div className="flex flex-col bg-muted/40 px-2 py-1.5 rounded-lg border border-border/50 shadow-sm hover:bg-muted/60 transition-colors">
              <span className="text-[0.6rem] text-muted-foreground font-semibold uppercase tracking-wider truncate">LAST TX</span>
              <strong className="text-xs text-foreground font-bold truncate">
                {data.isLoading ? '...' : (data.legacy?.lastTxDate ? data.legacy.lastTxDate.toLocaleDateString() : <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono animate-pulse">_[ENCRYPTED]_</span>)}
              </strong>
            </div>
            <div className="flex flex-col bg-muted/40 px-2 py-1.5 rounded-lg border border-border/50 shadow-sm hover:bg-muted/60 transition-colors">
              <span className="text-[0.6rem] text-muted-foreground font-semibold uppercase tracking-wider truncate">DAYS SINCE</span>
              <strong className="text-xs text-foreground font-bold truncate">
                {data.isLoading ? '...' : (data.legacy?.firstTxDate ? `${data.legacy.daysSinceGenesis} d` : <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono animate-pulse">_[???]_</span>)}
              </strong>
            </div>
            <div className="flex flex-col bg-primary hover:bg-primary/80 px-2 py-1 rounded border border-primary/20 shadow-sm">
              <span className="text-[0.6rem] text-primary-foreground uppercase tracking-wider truncate">BADGE</span>
              <strong className="text-xs text-primary-foreground truncate">
                {data.isLoading ? '...' : (data.legacy?.firstTxDate ? data.legacy.tier : <span className="font-mono text-[0.6rem] animate-pulse opacity-70">NO SIGNAL</span>)}
              </strong>
            </div>
          </div>
        )}

        {/* Acciones */}
        {!userData?.nodeLegacy && isOwner && (
          <div className="grid grid-cols-2 gap-2 mt-auto relative z-10">
            <div title={!hasGMToday ? "Must do GM first" : ""} className={!hasGMToday ? "cursor-not-allowed" : ""}>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => handleActivateStreak(3, setLoadingNode3Streak)} 
                disabled={loadingNode3Streak || loadingNode3Instant || (userData?.currentStreak || 0) < 25 || !hasGMToday}
                className={`text-xs h-8 w-full ${!hasGMToday ? "pointer-events-none" : ""}`}
              >
                {loadingNode3Streak ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Streak ({userData?.currentStreak || 0}/25)</span>}
              </Button>
            </div>
            <div title={!hasGMToday ? "Must do GM first" : ""} className={!hasGMToday ? "cursor-not-allowed" : ""}>
              <Button 
                size="sm"
                onClick={() => handleActivateInstant(3, setLoadingNode3Instant)}
                disabled={loadingNode3Streak || loadingNode3Instant || !hasGMToday}
                className={`text-xs h-8 w-full ${!hasGMToday ? "pointer-events-none" : ""}`}
              >
                {loadingNode3Instant ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Buy ({cost3} USDC)</span>}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
