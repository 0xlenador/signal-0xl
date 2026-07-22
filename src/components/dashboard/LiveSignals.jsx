'use client';

import { useEffect, useRef } from 'react';

export default function LiveSignals() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
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
      const container = containerRef.current;
      if (!container) return;
      
      const eventText = events[Math.floor(Math.random() * events.length)]();
      const line = document.createElement('div');
      line.className = 'signal-line flex items-center gap-1.5 whitespace-nowrap';
      
      if (eventText.includes('NETWORK') || eventText.includes('SYSTEM')) {
        line.classList.add('text-text-muted');
      } else if (eventText.includes('GM') || eventText.includes('joined')) {
        line.classList.add('text-accent-success');
      } else if (eventText.includes('GAS')) {
        line.classList.add('text-accent-warning');
      } else {
        line.classList.add('text-accent-primary');
      }

      line.textContent = eventText;
      container.appendChild(line);

      const currentLines = container.querySelectorAll('.signal-line');
      if (currentLines.length > 10) {
        container.removeChild(currentLines[0]);
      }
    };

    const interval = setInterval(addSignal, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full mt-4 h-64 shrink-0 flex flex-col bg-black/60 rounded-xl border border-accent-primary/20 p-3 overflow-hidden relative z-10 shadow-[inset_0_0_20px_rgba(0,229,255,0.05)]">
      <div className="text-[0.55rem] font-bold text-accent-primary uppercase tracking-widest mb-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse shadow-glow-cyan"></span>
        <span>Live Signals</span>
      </div>
      <div 
        ref={containerRef}
        className="flex-grow w-full font-mono text-[0.6rem] text-accent-primary/80 overflow-y-hidden flex flex-col justify-end relative mask-image-fade-top gap-1.5"
      >
        {/* Dynamic logs are injected here */}
      </div>
    </div>
  );
}
