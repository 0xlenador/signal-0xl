'use client';
import { useWeb3 } from './Web3Provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function Header({ networkParam }) {
  const { address, connect, disconnect } = useWeb3();
  const router = useRouter();

  useEffect(() => {
    if (address && networkParam) {
      router.push(`/${networkParam}/${address}`);
    }
  }, [address, networkParam, router]);

  return (
    <header className="app-header w-full flex items-center justify-between p-4 px-6 bg-surface-1/95 backdrop-blur-2xl border-b border-border-light sticky top-0 z-50 shadow-lg">
      <div className="app-logo text-xl font-bold tracking-tight text-white cursor-pointer" onClick={() => router.push('/')}>
        Signal <span className="text-accent-primary drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">0xL</span>
      </div>
      <div className="flex items-center gap-3">
        {networkParam === 'arc-testnet' && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-1 border border-border-light text-[0.65rem] font-bold text-text-muted">
            <img src="/assets/arc-logo.jpg" alt="Arc" className="w-4 h-4 rounded-full object-cover" />
            Arc Testnet
          </div>
        )}
        <div className="relative flex items-center gap-2">
          {!address ? (
            <button onClick={connect} className="bg-accent-primary hover:bg-accent-primary-dim text-bg-primary font-bold text-sm px-4 py-1.5 rounded-full transition-all shadow-glow-cyan flex items-center gap-2">
              <span>Conectar</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-text-primary bg-surface-2 px-3 py-1 rounded-full border border-border-color">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <button onClick={disconnect} className="text-accent-error hover:bg-accent-error/10 px-3 py-1.5 rounded-full transition-colors text-xs font-bold border border-accent-error/20">
                Desconectar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
