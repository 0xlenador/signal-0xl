'use client';
import { useWeb3 } from '@/components/Web3Provider';
import { use } from 'react';
import { NETWORK } from '@/lib/config';

interface NetworkPageProps {
  params: Promise<{ network: string }>;
}

export default function NetworkPage({ params }: NetworkPageProps) {
  const { connect } = useWeb3();
  const { network } = use(params);

  return (
    <main className="app-content p-4 md:p-6 lg:p-8 w-full mx-auto flex flex-col gap-6 flex-1">
      <section className="flex flex-col items-center justify-center text-center py-24 glass-panel rounded-[2.5rem] shadow-glow-cyan-lg relative overflow-hidden my-8">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/5 to-transparent pointer-events-none"></div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-md">
          Signal <span className="text-accent-primary drop-shadow-[0_0_20px_rgba(0,229,255,0.6)]">0xL</span>
        </h1>
        <p className="text-text-muted max-w-lg mx-auto text-lg mb-10 font-light">
          Plataforma de señales en cadena para Arc Testnet. Deja tu huella diaria, analiza tu compromiso y escala en el ranking.
        </p>
        <button onClick={connect} className="bg-accent-primary hover:bg-accent-primary-dim text-bg-primary font-bold px-10 py-4 rounded-full transition-all shadow-glow-cyan hover:scale-105 hover:shadow-glow-cyan-lg flex items-center justify-center gap-2">
          Conectar Wallet
        </button>
        <p className="mt-8 text-sm text-text-muted font-mono bg-bg-primary/50 px-5 py-2 rounded-full border border-border-color">
          Red: {NETWORK.name} · Chain ID: {NETWORK.chainId}
        </p>
      </section>
    </main>
  );
}
