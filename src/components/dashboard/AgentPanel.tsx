'use client';

import { Bot, Info, AlertTriangle } from 'lucide-react';
import { useSignalContract, IUserData } from '@/hooks';
import { useWeb3 } from '../Web3Provider';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

export default function AgentPanel() {
  const { address } = useWeb3();
  const params = useParams();
  const walletParam = params.wallet as string;
  const isOwner = address?.toLowerCase() === walletParam?.toLowerCase();

  const { fetchUserData } = useSignalContract();
  const [userData, setUserData] = useState<IUserData | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = () => {
      if (walletParam) {
        fetchUserData(walletParam).then(data => {
          if (isMounted) setUserData(data);
        });
      } else {
        setUserData(null);
      }
    };

    loadData();

    window.addEventListener('signal-data-refresh', loadData);
    return () => { 
      isMounted = false; 
      window.removeEventListener('signal-data-refresh', loadData);
    };
  }, [walletParam, fetchUserData]);

  return (
    <div className="w-full mt-4 shrink-0 relative z-10 bg-black/40 rounded-xl border border-slate-800/80 p-3 flex flex-nowrap items-center justify-between gap-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)] overflow-x-auto">
      <h3 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
        <Bot className="w-4 h-4 text-accent-success" />
        <span className="text-slate-400 cursor-default">
          AI AGENT
        </span>
      </h3>
      <div className="flex items-center gap-2">
        {userData?.attachedAgentId ? (
          <span className="text-xs font-bold text-accent-success uppercase tracking-widest bg-accent-success/10 px-2 py-0.5 rounded border border-accent-success/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse"></span>
            ID: {userData.attachedAgentId}
          </span>
        ) : (
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            INACTIVE
          </span>
        )}
        
        {userData?.attachedAgentId && (
          <button className="text-[0.65rem] text-accent-success uppercase tracking-wider font-bold border border-accent-success/50 bg-accent-success/10 hover:bg-accent-success/20 px-3 py-1.5 rounded transition-colors shadow-sm cursor-default whitespace-nowrap">
            CONNECTED
          </button>
        )}
        <button 
          disabled={!isOwner}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[0.65rem] font-bold text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>Register an Agent (Arc)</span>
        </button>
      </div>
    </div>
  );
}
