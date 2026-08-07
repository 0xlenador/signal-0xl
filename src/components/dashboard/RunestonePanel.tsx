'use client';

import Image from 'next/image';

import { Copy, Check, Info, Crown, Flame, Zap, Radio, X, AlertCircle } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import { useWeb3 } from '../Web3Provider';
import { formatUnits, parseUnits } from 'viem';
import { useSignalContract } from '@/hooks';
import { useUserDataStore } from '@/stores/userDataStore';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CONSTANTS } from '@/lib/config';
import { useLeaderboardStore } from '@/stores/leaderboardStore';

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

export default function RunestonePanel() {
  const { address } = useWeb3();
  const params = useParams();
  const walletParam = params.wallet as string;
  const isOwner = address?.toLowerCase() === walletParam?.toLowerCase();

  // Read from central store (reactive — re-renders when store changes)
  const userData = useUserDataStore((s) => s.userData);
  const gmCost = useUserDataStore((s) => s.gmCost);
  const debtCost = useUserDataStore((s) => s.debtCost);
  const hasGMToday = useUserDataStore((s) => s.hasGMToday);

  // Write-only contract functions
  const { doGM, resetToVIP, activateNodeInstant, activateNodeByStreak, loading, error: contractError } = useSignalContract();
  
  const [gmLoading, setGmLoading] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [copied, setCopied] = useState(false);

  // Node Modal State
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [nodeInstantCost, setNodeInstantCost] = useState<bigint | null>(null);
  const [activationLoading, setActivationLoading] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hasGMToday) {
      const updateCountdown = () => {
        const now = new Date();
        const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
        const diff = tomorrow.getTime() - now.getTime();
        if (diff <= 0) {
          setCountdown('');
          return;
        }
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
        const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
        const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
        setCountdown(`${h}:${m}:${s}`);
      };
      updateCountdown();
      interval = setInterval(updateCountdown, 1000);
    } else {
      setCountdown('');
    }
    return () => clearInterval(interval);
  }, [hasGMToday]);

  const handleCopy = async () => {
    if (walletParam) {
      try {
        await navigator.clipboard.writeText(walletParam);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.warn("Failed to copy:", err);
      }
    }
  };

  const handleResetVIP = async () => {
    if (!address || gmLoading) return;

    setGmLoading(true);
    await resetToVIP();
    // No manual fetch needed: resetToVIP refreshes the store via handlePostTransaction
    if (isMountedRef.current) setGmLoading(false);
  };

  useEffect(() => {
    if (contractError && isNodeModalOpen) {
      setActivationError(contractError);
    }
  }, [contractError, isNodeModalOpen]);

  const handleNodeClick = (nodeId: number, isActive: boolean) => {
    if (!isOwner || isActive || !userData) return;
    setActivationError(null);
    // Calculate cost locally — no RPC needed
    const cost = calculateNodeInstantCost(nodeId, userData.onChainForkLevel);
    setNodeInstantCost(cost);
    setSelectedNodeId(nodeId);
    setIsNodeModalOpen(true);
  };

  const handleActivateByStreak = async () => {
    if (!selectedNodeId) return;
    setActivationLoading(true);
    setActivationError(null);
    const success = await activateNodeByStreak(selectedNodeId);
    if (success && isMountedRef.current) {
      setIsNodeModalOpen(false);
    }
    if (isMountedRef.current) setActivationLoading(false);
  };

  const handleActivateInstant = async () => {
    if (!selectedNodeId || nodeInstantCost === null) return;
    setActivationLoading(true);
    setActivationError(null);
    const success = await activateNodeInstant(selectedNodeId, nodeInstantCost);
    if (success && isMountedRef.current) {
      setIsNodeModalOpen(false);
    }
    if (isMountedRef.current) setActivationLoading(false);
  };

  // Helper para requerimientos de racha
  const getRequiredStreak = (nodeId: number) => {
    if (nodeId === 1) return 3;
    if (nodeId === 2) return 12;
    if (nodeId === 3) return 25;
    return 0;
  };

  const handleGM = async () => {
    if (!address || gmLoading) return;
    setGmLoading(true);
    
    try {
      // Calcular super GM localmente (cero overhead)
      const { userData } = useUserDataStore.getState();
      const isSuperGM = !!(userData?.nodeCommitment && userData?.nodeConviction && userData?.nodeLegacy);

      // Use pre-computed costs from the store — no RPC call needed
      const totalCost = gmCost + debtCost;
      const success = await doGM(totalCost);
      
      if (success) {
        // Disparar optimistic update + secuencia de refrescos
        useLeaderboardStore.getState().notifyGmConfirmed(address, isSuperGM);
      }
      // After doGM returns, store is already refreshed via handlePostTransaction
    } catch (e) {
      console.error("Unhandled error in handleGM:", e);
    } finally {
      if (isMountedRef.current) setGmLoading(false);
    }
  };

  // Helper to format address
  const formattedAddress = walletParam 
    ? `${walletParam.slice(0, 6)}...${walletParam.slice(-4)}` 
    : '0x...';

  return (
    <>
      {/* Tu Señal */}
      <div className="relative z-10 w-full mb-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Your Signal</span>
          <div className="flex items-center gap-2 bg-slate-900/80 px-2 py-1 rounded-full border border-slate-700 hover:border-accent-primary/50 transition-colors shadow-sm">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-accent-primary to-accent-runestone flex items-center justify-center overflow-hidden shadow-sm">
              {walletParam && <Image unoptimized src={getAvatarUrl(walletParam)} alt="Avatar" width={24} height={24} className="w-full h-full opacity-90" />}
            </div>
            <span className="text-xs font-mono font-bold text-slate-100 tracking-wider cursor-default pt-0.5">{formattedAddress}</span>
            <button onClick={handleCopy} className="text-slate-400 hover:text-accent-primary transition-colors cursor-pointer ml-1" title="Copy Wallet">
              {copied ? <Check className="w-3.5 h-3.5 text-accent-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </h3>
        
        {/* User Stats & GM Button Header (FULL WIDTH) */}
        <div className="w-full flex items-center justify-between px-2 mb-4 mt-5 relative">
          
          {/* Left Stats (Aligned Left) */}
          <div className="flex-1 flex flex-col gap-3 items-start">
            <div className="flex flex-col items-start group">
              <div className="text-[0.45rem] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 transition-colors group-hover:text-slate-400 mb-0.5">
                <Crown className="w-2.5 h-2.5" /> <span>STATUS</span>
              </div>
              <div className="text-[0.65rem] font-black tracking-wider flex items-center">
                {userData ? (
                  userData.forkLevel <= 1 ? (
                    <span className="text-accent-vip drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]">VIP</span>
                  ) : (
                    <span className="text-accent-warning drop-shadow-[0_0_8px_rgba(255,170,0,0.4)]">B{userData.forkLevel}</span>
                  )
                ) : '-'}
              </div>
            </div>
            <div className="flex flex-col items-start group">
              <div className="text-[0.45rem] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 transition-colors group-hover:text-slate-400 mb-0.5">
                <Flame className="w-2.5 h-2.5" /> <span>STREAK</span>
              </div>
              <div className="text-[0.65rem] font-mono font-bold text-slate-100">{userData ? userData.currentStreak : '-'}</div>
            </div>
          </div>

          {/* Center GM Button */}
          <div className="flex flex-col items-center justify-center relative z-20 shrink-0">
             <div className="relative">
              {!hasGMToday && (
                <div className="absolute -inset-2 bg-gradient-to-tr from-accent-primary/20 via-transparent to-accent-runestone/20 rounded-full blur-sm opacity-70 animate-pulse-slow"></div>
              )}
              
              <button 
                onClick={handleGM}
                disabled={!isOwner || gmLoading || hasGMToday}
                className={`w-[56px] h-[56px] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all duration-500 relative group overflow-hidden ${hasGMToday ? 'bg-slate-900 border border-slate-800 cursor-not-allowed opacity-80' : 'bg-slate-950 border border-slate-800/80 hover:border-accent-primary/50 hover:scale-[1.05] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'}`}
              >
                {!hasGMToday && (
                  <>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-runestone/30 via-transparent to-transparent opacity-80 group-hover:from-accent-primary/40 group-hover:via-accent-runestone/20 transition-colors duration-500"></div>
                    <div className="absolute inset-[2px] rounded-full bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none"></div>
                  </>
                )}
                <span className={`relative z-10 text-[0.55rem] font-black uppercase tracking-widest text-center leading-tight ${hasGMToday ? 'text-slate-600' : 'bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-100 to-slate-400 drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)] group-hover:from-white group-hover:to-white transition-colors duration-300'}`}>
                  {!isOwner ? 'READ\nONLY' : hasGMToday ? 'DONE' : (gmLoading ? '...' : (userData?.nodeCommitment && userData?.nodeConviction && userData?.nodeLegacy ? 'GM+' : 'GM'))}
                </span>
              </button>

              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center w-max">
                 <div className={`text-[0.5rem] font-bold font-mono text-accent-runestone tracking-widest empty:hidden ${hasGMToday ? '' : 'hidden'}`}>
                   {countdown}
                 </div>
                 <Popover>
                   <PopoverTrigger className="cursor-help flex items-center justify-center focus:outline-none opacity-40 hover:opacity-100 transition-opacity">
                     <Info className="w-3 h-3 text-slate-400" />
                   </PopoverTrigger>
                   <PopoverContent className="w-56 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-xl text-[0.65rem] text-slate-300 text-left font-normal normal-case tracking-normal z-[9999]">
                     Send your daily signal to Arc Testnet. Window: 00:00–23:59 UTC. +1 point (+2 with Runestone).
                   </PopoverContent>
                 </Popover>
              </div>
            </div>
          </div>

          {/* Right Stats (Aligned Right) */}
          <div className="flex-1 flex flex-col gap-3 items-end">
            <div className="flex flex-col items-end group">
              <div className="text-[0.45rem] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 transition-colors group-hover:text-slate-400 mb-0.5">
                <Zap className="w-2.5 h-2.5" /> <span>SCORE</span>
              </div>
              <div className="text-[0.65rem] font-mono font-bold text-slate-100">{userData ? userData.totalPoints : '-'}</div>
            </div>
            <div className="flex flex-col items-end group">
              <div className="text-[0.45rem] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 transition-colors group-hover:text-slate-400 mb-0.5">
                <Radio className="w-2.5 h-2.5" /> <span>SENT</span>
              </div>
              <div className="text-[0.65rem] font-mono font-bold text-slate-100">{userData ? userData.gmCount : '-'}</div>
            </div>
          </div>
        </div>

      </div>

      {/* Runestone Section */}
      <div className="flex flex-col items-center w-full relative z-10 flex-grow justify-center mt-4">
        <div className="relative w-full flex-grow flex items-center justify-center min-h-[260px] overflow-hidden rounded-[2rem]">
          <div className="runestone-core-container">
            {/* Nodos Satélite */}
            <div 
              onClick={() => handleNodeClick(1, !!userData?.nodeCommitment)}
              className={`satellite-node satellite-node-1 text-white ${userData?.nodeCommitment ? 'is-active' : ''} ${!userData?.nodeCommitment && isOwner ? 'is-interactive' : ''}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${userData?.nodeCommitment ? 'bg-accent-success shadow-sm' : 'bg-slate-500'}`}></div>
              <span>COMMITMENT</span>
            </div>
            <div 
              onClick={() => handleNodeClick(2, !!userData?.nodeConviction)}
              className={`satellite-node satellite-node-2 text-white ${userData?.nodeConviction ? 'is-active' : ''} ${!userData?.nodeConviction && isOwner ? 'is-interactive' : ''}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${userData?.nodeConviction ? 'bg-accent-success shadow-sm' : 'bg-slate-500'}`}></div>
              <span>CONVICTION</span>
            </div>
            <div 
              onClick={() => handleNodeClick(3, !!userData?.nodeLegacy)}
              className={`satellite-node satellite-node-3 text-white ${userData?.nodeLegacy ? 'is-active' : ''} ${!userData?.nodeLegacy && isOwner ? 'is-interactive' : ''}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${userData?.nodeLegacy ? 'bg-accent-success shadow-sm' : 'bg-slate-500'}`}></div>
              <span>LEGACY</span>
            </div>

            {/* Estructura Central Absoluta */}
            <div className="relative w-[180px] h-[220px] mx-auto flex flex-col items-center justify-end" style={{ zIndex: 70, transformStyle: 'preserve-3d' }}>
              
              {/* SVG Cristal (Runestone) */}
              <div className="absolute bottom-[35px] pointer-events-none" style={{ zIndex: 1, transform: 'translateZ(-10px)' }}>
                <svg className={`crystal-svg w-16 h-28 drop-shadow-2xl ${userData?.nodeCommitment && userData?.nodeConviction && userData?.nodeLegacy ? '' : 'is-inactive'}`} viewBox="0 0 100 180" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="crystalMain" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff1493" />
                      <stop offset="50%" stopColor="#b800e6" />
                      <stop offset="100%" stopColor="#800080" />
                    </linearGradient>
                    <linearGradient id="crystalLight" x1="0%" y1="0%" x2="50%" y2="50%">
                      <stop offset="0%" stopColor="#ff80df" />
                      <stop offset="100%" stopColor="#ff1493" />
                    </linearGradient>
                    <linearGradient id="crystalDark" x1="100%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#4d004d" />
                      <stop offset="100%" stopColor="#b800e6" />
                    </linearGradient>
                    <linearGradient id="silverCrack" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e0e0e0" />
                      <stop offset="50%" stopColor="#a0a0a0" />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>
                  </defs>
                  
                  <polygon points="50,5 20,40 10,100 35,170 50,175 70,165 90,90 85,30" fill="url(#crystalDark)" />
                  <polygon points="50,15 25,45 20,110 50,165 75,100 80,40" fill="url(#crystalMain)" />
                  <polygon points="50,5 20,40 25,45 50,15" fill="url(#crystalLight)" />
                  <polygon points="20,110 10,100 35,170 50,165" fill="#e600ac" />
                  <polygon points="50,5 85,30 80,40 50,15" fill="#cc00cc" />
                  <polygon points="50,165 70,165 90,90 75,100" fill="#990099" />
                  <path d="M 22,45 L 30,55 L 25,80 L 35,120 L 25,140 L 45,170" fill="none" stroke="url(#silverCrack)" strokeWidth="2.5" strokeLinejoin="bevel" strokeLinecap="round" />
                  <path d="M 50,10 L 65,30 L 60,45 L 85,75" fill="none" stroke="url(#silverCrack)" strokeWidth="2" strokeLinejoin="bevel" strokeLinecap="round" />
                  <path d="M 20,110 L 30,115 L 45,160" fill="none" stroke="url(#silverCrack)" strokeWidth="1.5" strokeLinejoin="bevel" />
                  <path d="M 50,15 L 25,45 M 50,15 L 80,40 M 25,45 L 20,110 M 80,40 L 75,100 M 20,110 L 50,165 M 75,100 L 50,165" fill="none" stroke="#ffb3ff" strokeWidth="0.5" opacity="0.6" />
                  <polygon points="50,5 45,20 55,20" fill="#ffffff" opacity="0.8" />
                </svg>
              </div>

              {/* Badge Runestone Active/Inactive */}
              {userData?.nodeCommitment && userData?.nodeConviction && userData?.nodeLegacy ? (
                <div className="relative text-[0.45rem] uppercase tracking-[0.2em] font-bold text-white bg-accent-runestone/20 px-3 py-1 rounded-full border border-accent-runestone/50 backdrop-blur-md z-10 shadow-[0_0_10px_rgba(255,0,127,0.4)] flex items-center gap-1.5 mb-2 whitespace-nowrap">
                  <Flame className="w-2.5 h-2.5 text-white" />
                  RUNESTONE ACTIVE
                  <Flame className="w-2.5 h-2.5 text-white" />
                </div>
              ) : (
                <div className="relative text-[0.45rem] uppercase tracking-[0.2em] font-bold text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800/80 backdrop-blur-md z-10 flex items-center gap-1.5 mb-2 whitespace-nowrap">
                  RUNESTONE INACTIVE
                </div>
              )}

            </div>

          </div>
        </div>

        {/* Small floating button for Reset VIP */}
        {userData && userData.forkLevel > 1 && (
          <button 
            onClick={() => setIsResetModalOpen(true)}
            title="Reset to VIP"
            className="absolute bottom-0 right-0 z-50 bg-accent-warning/10 hover:bg-accent-warning/20 text-accent-warning border border-accent-warning/30 px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider hover:scale-105"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Reset VIP</span>
          </button>
        )}

      </div>

      {/* Modal de Activación de Nodos */}
      <Dialog open={isNodeModalOpen && selectedNodeId !== null} onOpenChange={(open) => {
        if (!open && !activationLoading) setIsNodeModalOpen(false);
      }}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none" showCloseButton={false}>
          <DialogTitle className="sr-only">Activate Node</DialogTitle>
          <DialogDescription className="sr-only">Activate your Runestone node</DialogDescription>
          <div className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col mx-auto">
            
            {/* Header */}
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/40">
              <h3 className="font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-accent-runestone drop-shadow-sm" />
                Activate Node {selectedNodeId === 1 ? 'Commitment' : selectedNodeId === 2 ? 'Conviction' : 'Legacy'}
              </h3>
              <button 
                onClick={() => !activationLoading && setIsNodeModalOpen(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-md transition-colors disabled:opacity-50"
                disabled={activationLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-5">
              {!hasGMToday && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-start gap-2 text-sm text-amber-700 dark:text-amber-500 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">You must do your daily GM first before activating nodes.</span>
                </div>
              )}

              {activationError && (
                <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-lg flex items-start gap-2 text-sm text-destructive font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{activationError}</span>
                </div>
              )}

              {/* Opción 1: Racha */}
              <div className="bg-muted/30 p-4 rounded-xl border border-border flex flex-col gap-3 transition-all hover:bg-muted/50 hover:border-accent-runestone/30 hover:shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground">By Streak</span>
                  <span className="text-xs font-mono bg-background px-2 py-1 rounded-md text-accent-success border border-accent-success/30 font-bold shadow-sm">0.01 USDC</span>
                </div>
                <div className="text-sm text-foreground/80 leading-relaxed font-medium">
                  Requires an active streak of {getRequiredStreak(selectedNodeId || 1)} days. 
                  Your current streak is: <span className="text-foreground font-black bg-background px-1.5 py-0.5 rounded border border-border shadow-sm ml-1">{userData?.currentStreak || 0}</span>
                </div>
                <button
                  onClick={handleActivateByStreak}
                  disabled={activationLoading || (userData?.currentStreak || 0) < getRequiredStreak(selectedNodeId || 1) || !hasGMToday}
                  className="w-full bg-accent-runestone/10 hover:bg-accent-runestone/20 text-accent-runestone border border-accent-runestone/40 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md mt-1"
                >
                  {activationLoading ? 'Processing...' : 'Activate by Streak'}
                </button>
              </div>

              {/* Opción 2: Instantáneo */}
              <div className="bg-muted/30 p-4 rounded-xl border border-border flex flex-col gap-3 transition-all hover:bg-muted/50 hover:border-accent-warning/30 hover:shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground">Instant Activation</span>
                  {nodeInstantCost !== null ? (
                    <span className="text-xs font-mono bg-background px-2 py-1 rounded-md text-accent-warning border border-accent-warning/30 font-bold shadow-sm">
                      {formatUnits(nodeInstantCost, 18)} USDC
                    </span>
                  ) : (
                    <span className="text-xs animate-pulse text-muted-foreground font-semibold">Calculating...</span>
                  )}
                </div>
                <div className="text-sm text-foreground/80 leading-relaxed font-medium">
                  Pay the premium fee and activate this node immediately, regardless of your current streak.
                </div>
                <button
                  onClick={handleActivateInstant}
                  disabled={activationLoading || nodeInstantCost === null || !hasGMToday}
                  className="w-full bg-accent-warning/10 hover:bg-accent-warning/20 text-accent-warning border border-accent-warning/40 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md mt-1"
                >
                  {activationLoading ? 'Processing...' : 'Activate Instantly'}
                </button>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Reset VIP */}
      <Dialog open={isResetModalOpen} onOpenChange={(open) => {
        if (!open && !gmLoading) setIsResetModalOpen(false);
      }}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none" showCloseButton={false}>
          <DialogTitle className="sr-only">Reset to VIP</DialogTitle>
          <DialogDescription className="sr-only">Reset your account back to VIP status</DialogDescription>
          <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-[2rem] p-6 lg:p-8 relative overflow-hidden shadow-2xl max-w-sm w-full mx-auto">
            {/* Background Decorativo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-runestone/5 rounded-full blur-[100px] pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/2 translate-y-1/2"></div>
            
            <div className="flex justify-between items-center mb-6 z-10 relative">
              <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-accent-warning" />
                Reset to VIP
              </h3>
              <button 
                onClick={() => !gmLoading && setIsResetModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors disabled:opacity-50"
                disabled={gmLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 pt-0 flex flex-col gap-4 text-center text-sm text-slate-500 z-10 relative">
              <p className="text-accent-warning font-bold text-base">
                You are at Fork {userData?.forkLevel}. GM cost is higher.
              </p>
              <p>
                This will reset your streak and deactivate all nodes. Your accumulated score will be kept.
              </p>
              <button 
                onClick={async () => {
                  await handleResetVIP();
                  setIsResetModalOpen(false);
                }}
                disabled={gmLoading || !isOwner}
                className="w-full bg-accent-warning/20 hover:bg-accent-warning/30 text-accent-warning border border-accent-warning/50 py-3 rounded-lg font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-sm hover:shadow-glow-warning"
              >
                {!isOwner ? 'Read Only' : (gmLoading ? 'Processing...' : 'Confirm Reset to VIP')}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
