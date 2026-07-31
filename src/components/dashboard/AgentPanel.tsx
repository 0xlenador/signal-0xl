'use client';

import { Bot } from 'lucide-react';
import { useUserDataStore } from '@/stores/userDataStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AgentPanel() {
  // Passive read from the central store — no RPC calls, no event listeners.
  // This component updates automatically when any other component triggers
  // a store refresh (e.g., after GM or node activation).
  const userData = useUserDataStore((s) => s.userData);

  return (
    <div className="w-full mt-2 shrink-0 relative z-10 bg-black/40 rounded-xl border border-slate-800/80 p-3 flex flex-nowrap items-center justify-between gap-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]">
      <h3 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
        <Bot className="w-4 h-4 text-accent-success" />
        <span className="text-slate-400 cursor-default">
          AI AGENT
        </span>
      </h3>
      <div className="flex items-center">
        {userData?.attachedAgentId ? (
          <Badge className="font-bold text-accent-success uppercase tracking-widest bg-accent-success/10 hover:bg-accent-success/20 border border-accent-success/30 flex items-center gap-1.5 rounded px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse"></span>
            ID: {userData.attachedAgentId}
          </Badge>
        ) : (
          <Badge variant="outline" className="font-bold text-slate-400 uppercase tracking-widest bg-slate-900 border-slate-700 flex items-center gap-1.5 rounded px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            Coming soon
          </Badge>
        )}
        
        {userData?.attachedAgentId && (
          <Button variant="outline" size="sm" className="h-7 text-[0.65rem] text-accent-success uppercase tracking-wider font-bold border-accent-success/50 bg-accent-success/10 hover:bg-accent-success/20 cursor-default">
            CONNECTED
          </Button>
        )}
      </div>
    </div>
  );
}
