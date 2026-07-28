'use client';

import Image from 'next/image';

import { Copy, Check, Info, Crown, Flame, Zap, Radio, X, AlertCircle } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import { useWeb3 } from '../Web3Provider';
import { formatUnits } from 'viem';
import { useSignalContract, IUserData, IContractCost } from '@/hooks';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

export default function RunestonePanel() {
  const { address } = useWeb3();
  const params = useParams();
  const walletParam = params.wallet as string;
  const isOwner = address?.toLowerCase() === walletParam?.toLowerCase();

  const { fetchUserData, getGMCost, hasGMToday, doGM, resetToVIP, activateNodeInstant, activateNodeByStreak, getNodeInstantCost, loading, error: contractError } = useSignalContract();
  
  const [userData, setUserData] = useState<IUserData | null>(null);
  const [gmCostInfo, setGmCostInfo] = useState<IContractCost | null>(null);
  const [gmLoading, setGmLoading] = useState(false);
  const [gmDoneToday, setGmDoneToday] = useState(false);
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
    if (gmDoneToday) {
      const updateCountdown = () => {
        const now = new Date();
        const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
        const diff = tomorrow.getTime() - now.getTime();
        if (diff <= 0) {
          setCountdown('');
          setGmDoneToday(false);
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountdown('');
    }
    return () => clearInterval(interval);
  }, [gmDoneToday]);

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
    const success = await resetToVIP();
    if (success) {
      fetchUserData(address).then(setUserData);
      getGMCost(address).then(setGmCostInfo);
      hasGMToday(address).then(setGmDoneToday);
    }
    setGmLoading(false);
  };

  useEffect(() => {
    if (contractError && isNodeModalOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActivationError(contractError);
    }
  }, [contractError, isNodeModalOpen]);

  const handleNodeClick = async (nodeId: number, isActive: boolean) => {
    if (!isOwner || isActive) return;
    setActivationError(null);
    setNodeInstantCost(null);
    setSelectedNodeId(nodeId);
    setIsNodeModalOpen(true);
    
    // Fetch instant cost
    const cost = await getNodeInstantCost(nodeId, address as string);
    if (isMountedRef.current) {
      setNodeInstantCost(cost);
    }
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

  useEffect(() => {
    // Prevenir datos 'fantasma' y cobros erróneos al cambiar de perfil
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserData(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGmCostInfo(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGmDoneToday(false);

    const loadData = () => {
      if (walletParam) {
        fetchUserData(walletParam).then(data => {
          if (isMountedRef.current) setUserData(data);
          if (data && isMountedRef.current) {
            getGMCost(walletParam, data).then(c => { if (isMountedRef.current) setGmCostInfo(c) });
            hasGMToday(walletParam, data).then(d => { if (isMountedRef.current) setGmDoneToday(d) });
          }
        });
      }
    };

    loadData();

    window.addEventListener('signal-data-refresh', loadData);
    return () => {
      window.removeEventListener('signal-data-refresh', loadData);
    };
  }, [walletParam, fetchUserData, getGMCost, hasGMToday]);

  const handleGM = async () => {
    if (!address || gmLoading) return;
    setGmLoading(true);
    
    // Fetch it fresh ALWAYS to ensure we have the absolute right cost before doing GM
    // Esto evita el error de "insufficient payment" por usar el costo de la wallet anterior
    const currentCost = await getGMCost(address);
    
    if (!currentCost) {
      alert("Could not calculate GM cost due to network congestion. Try again.");
      setGmLoading(false);
      return;
    }

    const totalCost = currentCost.gmCost + currentCost.debtCost;
    const success = await doGM(totalCost);
    if (success && isMountedRef.current) {
      // Refresh
      fetchUserData(address).then(res => { if (isMountedRef.current) setUserData(res); });
      getGMCost(address).then(res => { if (isMountedRef.current) setGmCostInfo(res); });
      hasGMToday(address).then(res => { if (isMountedRef.current) setGmDoneToday(res); });
    }
    if (isMountedRef.current) setGmLoading(false);
  };


  // Helper to format address
  const formattedAddress = walletParam 
    ? `${walletParam.slice(0, 6)}...${walletParam.slice(-4)}` 
    : '0x...';

  return (
    <>
      {/* Tu Señal */}
      <div className="relative z-10 w-full mb-8">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span className="group-hover:text-accent-primary transition-colors">Your Signal</span>
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
        
        {/* User Stats Grid (Reconstructed) */}
        <div className="text-sm w-full">
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center bg-slate-900/50 hover:bg-slate-900 transition-colors py-3 px-2 rounded-xl border border-slate-800/80 justify-center shadow-sm">
              <div className="text-[0.55rem] text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5 w-full"><Crown className="w-3.5 h-3.5" /> <span>STATUS</span></div>
              <div className="text-sm font-bold flex items-center justify-center h-6 w-full">
                {userData ? (
                  userData.forkLevel <= 1 ? (
                    <span className="px-3 py-1 bg-slate-950 rounded-full text-[0.65rem] font-bold uppercase text-accent-vip border border-accent-vip/30 shadow-sm flex items-center gap-1">VIP</span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-950 rounded-full text-[0.65rem] font-bold uppercase text-accent-warning border border-accent-warning/30 flex items-center gap-1">B{userData.forkLevel}</span>
                  )
                ) : '-'}
              </div>
            </div>
            <div className="flex flex-col items-center bg-slate-900/50 hover:bg-slate-900 transition-colors py-3 px-2 rounded-xl border border-slate-800/80 justify-center shadow-sm">
              <div className="text-[0.55rem] text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5 w-full"><Flame className="w-3.5 h-3.5" /> <span>STREAK</span></div>
              <div className="text-lg font-mono font-bold text-slate-100 h-6 flex items-center justify-center w-full">{userData ? userData.currentStreak : '-'}</div>
            </div>
            <div className="flex flex-col items-center bg-slate-900/50 hover:bg-slate-900 transition-colors py-3 px-2 rounded-xl border border-slate-800/80 justify-center shadow-sm">
              <div className="text-[0.55rem] text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5 w-full"><Zap className="w-3.5 h-3.5" /> <span>SCORE</span></div>
              <div className="text-lg font-mono font-bold text-slate-100 h-6 flex items-center justify-center w-full">{userData ? userData.totalPoints : '-'}</div>
            </div>
            <div className="flex flex-col items-center bg-slate-900/50 hover:bg-slate-900 transition-colors py-3 px-2 rounded-xl border border-slate-800/80 justify-center shadow-sm">
              <div className="text-[0.55rem] text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5 w-full"><Radio className="w-3.5 h-3.5" /> <span>GMS SENT</span></div>
              <div className="text-lg font-mono font-bold text-slate-100 h-6 flex items-center justify-center w-full">{userData ? userData.gmCount : '-'}</div>
            </div>
          </div>
        </div>

      </div>

      {/* Runestone Section */}
      <div className="flex flex-col items-center w-full relative z-10 flex-grow justify-center mt-4">
        {userData?.nodeCommitment && userData?.nodeConviction && userData?.nodeLegacy ? (
          <div className="relative text-[0.65rem] uppercase tracking-[0.2em] font-bold text-white bg-accent-runestone/20 px-5 py-1.5 rounded-full border border-accent-runestone/50 backdrop-blur-md z-10 shadow-[0_0_15px_rgba(255,0,127,0.4)] flex items-center gap-2">
            <Flame className="w-3 h-3 text-white" />
            RUNESTONE ACTIVE
            <Flame className="w-3 h-3 text-white" />
          </div>
        ) : (
          <div className="relative text-[0.65rem] uppercase tracking-[0.2em] font-bold text-slate-500 bg-slate-900/50 px-5 py-1.5 rounded-full border border-slate-800/80 backdrop-blur-md z-10 flex items-center gap-2">
            RUNESTONE INACTIVE
          </div>
        )}

        <div className="relative w-full flex-grow flex items-center justify-center min-h-[260px] mt-8 overflow-hidden rounded-[2rem]">
          <div className="runestone-core-container">
            {/* Nodos Satélite */}
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
                <svg className={`crystal-svg w-24 h-40 drop-shadow-2xl ${userData?.nodeCommitment && userData?.nodeConviction && userData?.nodeLegacy ? '' : 'is-inactive'}`} viewBox="0 0 100 180" xmlns="http://www.w3.org/2000/svg">
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

              {/* Botón GM como Pedestal Interactivo */}
              <div className="relative w-[170px] h-[44px] flex-shrink-0 mx-auto mb-2 pointer-events-auto" style={{ zIndex: 9999, transform: 'translateZ(10px)' }}>
                <button 
                  onClick={handleGM}
                  disabled={!isOwner || gmLoading || gmDoneToday}
                  className={`gm-pedestal w-full h-full cursor-pointer disabled:cursor-not-allowed ${gmDoneToday ? 'gm-done' : ''}`}>
                  <span className={`text-xs font-bold uppercase tracking-[0.2em] transition-opacity ${gmDoneToday ? 'text-slate-500' : 'text-white'}`}>
                    {!isOwner ? 'READ ONLY' : gmDoneToday ? 'GM (REFRESH)' : (gmLoading ? 'SENDING...' : (userData?.nodeCommitment && userData?.nodeConviction && userData?.nodeLegacy ? 'SUPER GM' : 'GM'))}
                  </span>
                </button>
              </div>

              {/* Contador GM Externo y Tooltip */}
              <div className="absolute top-[100%] mt-2 w-full flex items-center justify-center gap-2" style={{ zIndex: 10000, transform: 'translateZ(10px)' }}>
                <div className={`text-lg font-bold font-mono text-white tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] empty:hidden ${gmDoneToday ? '' : 'hidden'}`}>
                  {countdown}
                </div>
                {/* Tooltip informativo GM */}
                <div className="relative cursor-help group/gmtt pointer-events-auto flex items-center">
                  <Info className="w-4 h-4 text-slate-500 hover:text-accent-primary transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-slate-900 backdrop-blur-md border border-slate-800 rounded shadow-xl text-[0.65rem] text-slate-300 opacity-0 group-hover/gmtt:opacity-100 pointer-events-none transition-opacity z-[9999] text-left font-normal normal-case tracking-normal">
                    Send your daily signal to Arc Testnet. Window: 00:00–23:59 UTC. +1 point (+2 with Runestone).
                  </div>
                </div>
              </div>

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
      {isNodeModalOpen && selectedNodeId && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-xl relative flex flex-col">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-accent-runestone" />
                Activate Node {selectedNodeId === 1 ? 'Commitment' : selectedNodeId === 2 ? 'Conviction' : 'Legacy'}
              </h3>
              <button 
                onClick={() => !activationLoading && setIsNodeModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50"
                disabled={activationLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-5">
              {activationError && (
                <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex items-start gap-2 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{activationError}</span>
                </div>
              )}

              {/* Opción 1: Racha */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">By Streak</span>
                  <span className="text-xs font-mono bg-white px-2 py-1 rounded text-accent-success border border-accent-success/20">0.01 USDC</span>
                </div>
                <div className="text-xs text-slate-500">
                  Requires an active streak of {getRequiredStreak(selectedNodeId)} days. 
                  Your current streak is: <span className="text-slate-900 font-bold">{userData?.currentStreak || 0}</span>
                </div>
                <button
                  onClick={handleActivateByStreak}
                  disabled={activationLoading || (userData?.currentStreak || 0) < getRequiredStreak(selectedNodeId)}
                  className="w-full bg-accent-runestone/10 hover:bg-accent-runestone/20 text-accent-runestone border border-accent-runestone/50 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activationLoading ? 'Processing...' : 'Activate by Streak'}
                </button>
              </div>

              {/* Opción 2: Instantáneo */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">Instant Activation</span>
                  {nodeInstantCost ? (
                    <span className="text-xs font-mono bg-white px-2 py-1 rounded text-accent-warning border border-accent-warning/20">
                      {formatUnits(nodeInstantCost, 18)} USDC
                    </span>
                  ) : (
                    <span className="text-xs animate-pulse text-slate-500">Calculating...</span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  Pay the premium fee and activate this node immediately, regardless of your current streak.
                </div>
                <button
                  onClick={handleActivateInstant}
                  disabled={activationLoading || nodeInstantCost === null}
                  className="w-full bg-accent-warning/10 hover:bg-accent-warning/20 text-accent-warning border border-accent-warning/50 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activationLoading ? 'Processing...' : 'Activate Instantly'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal para Reset VIP */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-[2rem] p-6 lg:p-8 relative overflow-hidden shadow-2xl max-w-sm w-full">
            {/* Background Decorativo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-runestone/5 rounded-full blur-[100px] pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/2 translate-y-1/2"></div>
            
            <div className="flex justify-between items-center mb-6">
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
            <div className="p-6 flex flex-col gap-4 text-center text-sm text-slate-500">
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
        </div>
      )}
    </>
  );
}
