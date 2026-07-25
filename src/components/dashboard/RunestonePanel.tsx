'use client';

import Image from 'next/image';

import { Copy, Info, Crown, Flame, Zap, Radio } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import { useWeb3 } from '../Web3Provider';
import { useSignalContract, IUserData, IContractCost } from '@/hooks';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

export default function RunestonePanel() {
  const { address } = useWeb3();
  const params = useParams();
  const walletParam = params.wallet as string;
  const isOwner = address?.toLowerCase() === walletParam?.toLowerCase();

  const { fetchUserData, getGMCost, hasGMToday, doGM, resetToVIP, loading } = useSignalContract();
  
  const [userData, setUserData] = useState<IUserData | null>(null);
  const [gmCostInfo, setGmCostInfo] = useState<IContractCost | null>(null);
  const [gmLoading, setGmLoading] = useState(false);
  const [gmDoneToday, setGmDoneToday] = useState(false);
  const [countdown, setCountdown] = useState('');
  
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

  const handleResetVIP = async () => {
    if (!address || gmLoading) return;
    const confirmed = window.confirm(
      '⚠️ ¿Confirmas resetear a VIP?\n\nEsto reiniciará tu racha y desactivará todos los nodos. Tu puntaje acumulado se conserva.'
    );
    if (!confirmed) return;

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
    // Prevenir datos 'fantasma' y cobros erróneos al cambiar de perfil
    setUserData(null);
    setGmCostInfo(null);
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
      alert("No se pudo calcular el costo del GM debido a congestión de la red. Intenta de nuevo.");
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
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center justify-between">
          <span className="group-hover:text-accent-primary transition-colors">Your Signal</span>
          <div className="flex items-center gap-2 bg-surface-1/80 px-2 py-1 rounded-full border border-border-light/50 hover:border-accent-primary/50 transition-colors shadow-sm">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-accent-primary to-accent-runestone flex items-center justify-center overflow-hidden shadow-[0_0_8px_rgba(0,229,255,0.4)]">
              {walletParam && <Image unoptimized src={getAvatarUrl(walletParam)} alt="Avatar" width={24} height={24} className="w-full h-full opacity-90" />}
            </div>
            <span className="text-xs font-mono font-bold text-white tracking-wider cursor-default pt-0.5">{formattedAddress}</span>
            <button className="text-text-muted hover:text-accent-primary transition-colors cursor-pointer ml-1" title="Copiar Wallet">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </h3>
        
        {/* User Stats Grid (Reconstructed) */}
        <div className="text-sm w-full">
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center bg-surface-1 hover:bg-surface-2 transition-colors py-3 px-2 rounded-xl border border-border-light justify-center shadow-sm hover:shadow-glow-cyan">
              <div className="text-[0.55rem] text-text-muted font-semibold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5 w-full"><Crown className="w-3.5 h-3.5" /> <span>STATUS</span></div>
              <div className="text-sm font-bold flex items-center justify-center h-6 w-full">
                {userData ? (
                  userData.forkLevel <= 1 ? (
                    <span className="px-3 py-1 bg-surface-2 rounded-full text-[0.65rem] font-bold uppercase text-accent-vip border border-accent-vip/30 shadow-[0_0_10px_rgba(167,139,250,0.15)] flex items-center gap-1">VIP</span>
                  ) : (
                    <span className="px-3 py-1 bg-surface-2 rounded-full text-[0.65rem] font-bold uppercase text-accent-warning border border-accent-warning/30 flex items-center gap-1">B{userData.forkLevel}</span>
                  )
                ) : '-'}
              </div>
            </div>
            <div className="flex flex-col items-center bg-surface-1 hover:bg-surface-2 transition-colors py-3 px-2 rounded-xl border border-border-light justify-center shadow-sm hover:shadow-glow-cyan">
              <div className="text-[0.55rem] text-text-muted font-semibold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5 w-full"><Flame className="w-3.5 h-3.5" /> <span>STREAK</span></div>
              <div className="text-lg font-mono font-bold text-white h-6 flex items-center justify-center w-full">{userData ? userData.currentStreak : '-'}</div>
            </div>
            <div className="flex flex-col items-center bg-surface-1 hover:bg-surface-2 transition-colors py-3 px-2 rounded-xl border border-border-light justify-center shadow-sm hover:shadow-glow-cyan">
              <div className="text-[0.55rem] text-text-muted font-semibold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5 w-full"><Zap className="w-3.5 h-3.5" /> <span>SCORE</span></div>
              <div className="text-lg font-mono font-bold text-white h-6 flex items-center justify-center w-full">{userData ? userData.totalPoints : '-'}</div>
            </div>
            <div className="flex flex-col items-center bg-surface-1 hover:bg-surface-2 transition-colors py-3 px-2 rounded-xl border border-border-light justify-center shadow-sm hover:shadow-glow-cyan">
              <div className="text-[0.55rem] text-text-muted font-semibold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5 w-full"><Radio className="w-3.5 h-3.5" /> <span>GMS SENT</span></div>
              <div className="text-lg font-mono font-bold text-white h-6 flex items-center justify-center w-full">{userData ? userData.gmCount : '-'}</div>
            </div>
          </div>
        </div>

        {userData && userData.forkLevel > 1 && (
          <div className="mt-3 flex items-center justify-between bg-accent-warning/10 border border-accent-warning/30 p-2 rounded-xl text-xs">
            <p className="text-accent-warning mb-0 font-bold">Estás en Bifurcación {userData.forkLevel}. El costo del GM es mayor.</p>
            <button 
              onClick={handleResetVIP}
              disabled={gmLoading || !isOwner}
              className="bg-surface-2 hover:bg-surface-1 border border-border-light px-3 py-1.5 rounded-lg text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {!isOwner ? 'Solo Lectura' : 'Resetear a VIP'}
            </button>
          </div>
        )}

      </div>

      {/* Runestone Section */}
      <div className="flex flex-col items-center w-full relative z-10 flex-grow justify-center mt-4">
        {userData?.nodeCommitment && userData?.nodeConviction && userData?.nodeLegacy ? (
          <div className="relative text-[0.65rem] uppercase tracking-[0.2em] font-bold text-text-primary bg-surface-1 px-5 py-1.5 rounded-full border border-accent-runestone/80 backdrop-blur-md z-10 shadow-[0_0_15px_rgba(255,0,127,0.6)] flex items-center gap-2">
            <Flame className="w-3 h-3 text-accent-runestone" />
            RUNESTONE ACTIVE
            <Flame className="w-3 h-3 text-accent-runestone" />
          </div>
        ) : (
          <div className="relative text-[0.65rem] uppercase tracking-[0.2em] font-bold text-text-muted bg-surface-1 px-5 py-1.5 rounded-full border border-border-light backdrop-blur-md z-10 flex items-center gap-2">
            RUNESTONE INACTIVE
          </div>
        )}

        <div className="relative w-full flex-grow flex items-center justify-center min-h-[260px] mt-8">
          <div className="runestone-core-container">
            {/* Nodos Satélite */}
            <div className={`satellite-node satellite-node-1 text-white ${userData?.nodeCommitment ? 'is-active' : ''}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${userData?.nodeCommitment ? 'bg-accent-success shadow-glow-cyan' : 'bg-text-muted'}`}></div>
              <span>COMMITMENT</span>
            </div>
            <div className={`satellite-node satellite-node-2 text-white ${userData?.nodeConviction ? 'is-active' : ''}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${userData?.nodeConviction ? 'bg-accent-success shadow-glow-cyan' : 'bg-text-muted'}`}></div>
              <span>CONVICTION</span>
            </div>
            <div className={`satellite-node satellite-node-3 text-white ${userData?.nodeLegacy ? 'is-active' : ''}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${userData?.nodeLegacy ? 'bg-accent-success shadow-glow-cyan' : 'bg-text-muted'}`}></div>
              <span>LEGACY</span>
            </div>

            {/* Estructura Central Absoluta */}
            <div className="relative w-[180px] h-[220px] mx-auto flex flex-col items-center justify-end" style={{ transformStyle: 'preserve-3d' }}>
              
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
                  className="gm-pedestal w-full h-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-white transition-opacity">
                    {!isOwner ? 'SOLO LECTURA' : gmDoneToday ? 'GM (REFRESH)' : (gmLoading ? 'SENDING...' : (userData?.nodeCommitment && userData?.nodeConviction && userData?.nodeLegacy ? 'SUPER GM' : 'GM'))}
                  </span>
                </button>
              </div>

              {/* Contador GM Externo y Tooltip */}
              <div className="absolute top-[100%] mt-2 w-full flex items-center justify-center gap-2" style={{ transform: 'translateZ(10px)' }}>
                <div className={`text-lg font-bold font-mono text-white tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] empty:hidden ${gmDoneToday ? '' : 'hidden'}`}>
                  {countdown}
                </div>
                {/* Tooltip informativo GM */}
                <div className="relative cursor-help group/gmtt pointer-events-auto flex items-center">
                  <Info className="w-4 h-4 text-text-muted hover:text-accent-primary transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-surface-2/95 backdrop-blur-md border border-border-color rounded shadow-xl text-[0.65rem] text-text-muted opacity-0 group-hover/gmtt:opacity-100 pointer-events-none transition-opacity z-[9999] text-left font-normal normal-case tracking-normal">
                    Envía tu señal diaria a Arc Testnet. Ventana: 00:00–23:59 UTC. +1 punto (+2 con Runestone).
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </>
  );
}
