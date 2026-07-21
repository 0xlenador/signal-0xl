'use client';

import { Bot, Info, AlertTriangle } from 'lucide-react';

export default function AgentPanel() {
  return (
    <div className="w-full mt-4 h-14 shrink-0 relative z-10 bg-surface-1/50 border border-border-color/30 rounded-xl p-3 shadow-sm flex items-center justify-between gap-2">
      <h3 className="text-[0.65rem] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
        <Bot className="w-4 h-4 text-accent-runestone" /> AI AGENT ERC-8004
        <span className="text-xs cursor-help relative group/tt flex items-center">
          <Info className="w-3.5 h-3.5" />
        </span>
      </h3>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1 bg-surface-2 hover:bg-surface-1 border border-border-color rounded-lg text-[0.65rem] font-bold text-text-muted transition-colors">
          <AlertTriangle className="w-3 h-3" />
          Register an Agent (Arc)
        </button>
      </div>
    </div>
  );
}
