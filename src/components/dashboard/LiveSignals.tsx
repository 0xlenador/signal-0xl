'use client';

import { useEffect, useState } from 'react';

export default function LiveSignals() {
  const [signals, setSignals] = useState<{ id: number; text: string; type: string }[]>([]);

  useEffect(() => {
    let idCounter = 0;
    const events = [
      () => `> [NETWORK] Syncing block: 52788${Math.floor(Math.random() * 900 + 100)}... OK`,
      () => `> [GAS] Network average adjusted: ${(24 + Math.random() * 2).toFixed(2)} Gwei`,
      () => `> [SIGNAL] Anonymous user sent GM {+${Math.floor(Math.random() * 5 + 1)} pts}`,
      () => `> [NODES] Conviction tier activity detected (+${(Math.random() * 0.5).toFixed(2)}%)`,
      () => `> [SYSTEM] IdentityRegistry query successful`,
      () => `> [LEADERBOARD] New wallet 0x${Math.random().toString(16).substring(2, 6)}... joined Top 20`,
      () => `> [RUNESTONE] Resonance field stabilized`,
      () => `> [AGENT] ERC-8004 AI ping received`
    ];

    const addSignal = () => {
      const eventText = events[Math.floor(Math.random() * events.length)]();
      let typeClass = 'text-accent-primary';
      
      if (eventText.includes('NETWORK') || eventText.includes('SYSTEM')) {
        typeClass = 'text-text-muted';
      } else if (eventText.includes('GM') || eventText.includes('joined')) {
        typeClass = 'text-accent-success';
      } else if (eventText.includes('GAS')) {
        typeClass = 'text-accent-warning';
      }

      setSignals(prev => {
        const next = [...prev, { id: idCounter++, text: eventText, type: typeClass }];
        return next.length > 10 ? next.slice(next.length - 10) : next;
      });
    };

    const interval = setInterval(addSignal, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full mt-8 h-64 shrink-0 flex flex-col bg-black/60 rounded-xl border border-slate-800/80 p-3 overflow-hidden relative z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
      <div className="text-[0.55rem] font-bold text-accent-primary uppercase tracking-widest mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse shadow-glow-cyan"></span>
          <span>Live Signals</span>
        </div>
        <div className="group relative flex items-center justify-center cursor-help">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary/50 group-hover:text-accent-primary transition-colors">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
          </svg>
          <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block w-48 p-2 bg-black/95 border border-accent-primary/30 rounded text-[0.6rem] text-accent-primary/90 normal-case tracking-normal z-50 shadow-[0_4px_20px_rgba(0,0,0,0.8)] backdrop-blur-sm whitespace-normal">
            Live Signals is currently under development. Displayed events are a simulation.
          </div>
        </div>
      </div>
      <div className="flex-grow w-full font-mono text-[0.6rem] text-accent-primary/80 overflow-y-hidden flex flex-col justify-end relative mask-image-fade-top gap-1.5">
        {signals.map(signal => (
          <div key={signal.id} className={`signal-line flex items-center gap-1.5 whitespace-nowrap ${signal.type}`}>
            {signal.text}
          </div>
        ))}
      </div>
    </div>
  );
}
