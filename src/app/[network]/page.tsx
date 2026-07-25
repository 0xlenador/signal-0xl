'use client';
import { useWeb3 } from '@/components/Web3Provider';
import { use } from 'react';
import { NETWORK } from '@/lib/config';
import NetworkStats from '@/components/dashboard/NetworkStats';
import RankingTable from '@/components/dashboard/RankingTable';
import { Lock } from 'lucide-react';

interface NetworkPageProps {
  params: Promise<{ network: string }>;
}

export default function NetworkPage({ params }: NetworkPageProps) {
  const { connect } = useWeb3();
  const { network } = use(params);

  return (
    <main className="app-content p-4 md:p-6 lg:p-8 w-full mx-auto flex flex-col gap-6 flex-1">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        
        {/* COLUMNA IZQUIERDA (Span 4) - Muted Runestone/Agent Panel */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="bg-bg-primary rounded-[2.5rem] border border-border-light shadow-glow-magenta relative flex flex-col p-6 items-center justify-center flex-grow group min-h-[800px] overflow-hidden text-center">
            {/* Real Content overlay / Connect message */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-sm">
               <Lock className="w-12 h-12 text-accent-primary mb-6 opacity-80" />
               <h2 className="text-2xl font-bold text-white mb-2">Señales & Agente</h2>
               <p className="text-text-muted text-sm max-w-xs mb-8">
                 Conecta tu wallet para acceder a tu Panel de Runestone, interactuar con el Agente y emitir señales en la red.
               </p>
               <button onClick={connect} className="bg-accent-primary hover:bg-accent-primary-dim text-bg-primary font-bold px-8 py-3 rounded-full transition-all shadow-glow-cyan hover:scale-105 flex items-center justify-center gap-2">
                 Conectar Wallet
               </button>
            </div>
            
            {/* Background dummy shapes to simulate the actual panel behind the blur */}
            <div className="absolute inset-0 p-6 flex flex-col gap-6 opacity-30 pointer-events-none">
                <div className="h-64 bg-surface-2 rounded-3xl w-full border border-border-light"></div>
                <div className="h-40 bg-surface-2 rounded-3xl w-full border border-border-light"></div>
                <div className="flex-1 bg-surface-2 rounded-3xl w-full border border-border-light"></div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (Span 8) */}
        <div className="xl:col-span-8 flex flex-col gap-4 h-full min-h-[800px]">
          {/* Tarjeta de red (Normal) */}
          <NetworkStats />
          
          {/* Panel de Nodos (Muted) */}
          <div className="relative flex flex-col items-center justify-center min-h-[250px] bg-bg-primary rounded-[2.5rem] border border-border-light overflow-hidden shadow-glow-cyan">
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-sm">
               <Lock className="w-10 h-10 text-accent-secondary mb-4 opacity-80" />
               <h3 className="text-xl font-bold text-white mb-2">Red de Nodos</h3>
               <p className="text-text-muted text-sm max-w-xs text-center mb-6">
                 Conecta tu wallet para ver el estado y actividad de los nodos.
               </p>
               <button onClick={connect} className="bg-accent-secondary hover:bg-accent-secondary-dim text-white font-bold px-6 py-2 rounded-full transition-all shadow-glow-magenta hover:scale-105 flex items-center justify-center gap-2 text-sm">
                 Conectar Wallet
               </button>
            </div>
            
            {/* Background elements simulating the nodes grid */}
            <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-3 p-6 opacity-30 pointer-events-none">
               {Array.from({ length: 8 }).map((_, i) => (
                 <div key={i} className="bg-surface-2 rounded-2xl w-full h-full border border-border-light"></div>
               ))}
            </div>
          </div>

          {/* Leaderboard (Normal) */}
          <RankingTable />
        </div>

      </div>
    </main>
  );
}
