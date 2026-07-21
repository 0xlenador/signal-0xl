'use client';

export default function LiveSignals() {
  return (
    <div className="w-full mt-4 h-64 shrink-0 flex flex-col bg-black/60 rounded-xl border border-accent-primary/20 p-3 overflow-hidden relative z-10 shadow-[inset_0_0_20px_rgba(0,229,255,0.05)]">
      <div className="text-[0.55rem] font-bold text-accent-primary uppercase tracking-widest mb-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse shadow-glow-cyan"></span>
        <span>Live Signals</span>
      </div>
      <div className="flex-grow w-full font-mono text-[0.6rem] text-accent-primary/80 overflow-y-hidden flex flex-col justify-end relative mask-image-fade-top gap-1.5">
        {/* Placeholder for dynamic logs */}
        <div className="signal-line text-text-muted">Esperando señales en vivo...</div>
      </div>
    </div>
  );
}
