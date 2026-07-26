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
    <div className="w-full mt-4 h-14 shrink-0 relative z-10 bg-surface-1/50 border border-border-color/30 rounded-xl p-3 shadow-sm flex items-center justify-between gap-2">
      <h3 className="text-[0.65rem] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
        <Bot className="w-4 h-4 text-accent-success" />
        <span className="group-hover:text-accent-primary transition-colors cursor-default">
          AI AGENT
        </span>
      </h3>
      <div className="flex items-center gap-2">
        {userData?.attachedAgentId ? (
          <span className="text-xs font-bold text-accent-success uppercase tracking-widest bg-accent-success/10 px-2 py-0.5 rounded border border-accent-success/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-success shadow-glow-cyan animate-pulse"></span>
            ID: {userData.attachedAgentId}
          </span>
        ) : (
          <span className="text-xs font-bold text-text-muted uppercase tracking-widest bg-surface-2 px-2 py-0.5 rounded border border-border-light flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span>
            INACTIVE
          </span>
        )}
        
        {userData?.attachedAgentId ? (
          <button className="text-[0.65rem] text-accent-success uppercase tracking-wider font-bold border border-accent-success/50 bg-accent-success/10 hover:bg-accent-success/20 px-3 py-1 rounded transition-colors shadow-sm cursor-default">
            CONNECTED
          </button>
        ) : (
          <button 
            disabled={!isOwner}
            className="text-[0.65rem] text-text-muted uppercase tracking-wider font-bold border border-border-light bg-surface-2 hover:bg-surface-1 px-3 py-1 rounded transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
            title="Coming soon">
            {!isOwner ? 'READ ONLY' : 'ATTACH AGENT'}
          </button>
        )}
        <button 
          disabled={!isOwner}
          className="flex items-center gap-1.5 px-3 py-1 bg-surface-2 hover:bg-surface-1 border border-border-color rounded-lg text-[0.65rem] font-bold text-text-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <AlertTriangle className="w-3 h-3" />
          Register an Agent (Arc)
        </button>
      </div>
    </div>
  );
}
