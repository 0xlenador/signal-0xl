'use client';
import { use } from 'react';
import { useWeb3 } from '@/components/Web3Provider';
import RunestonePanel from '@/components/dashboard/RunestonePanel';
import AgentPanel from '@/components/dashboard/AgentPanel';
import LiveSignals from '@/components/dashboard/LiveSignals';
import NetworkStats from '@/components/dashboard/NetworkStats';
import NodesGrid from '@/components/dashboard/NodesGrid';
import RankingTable from '@/components/dashboard/RankingTable';

export default function DashboardPage({ params }) {
  const { network, wallet } = use(params);
  const { address } = useWeb3();
  const isOwner = address?.toLowerCase() === wallet.toLowerCase();

  return (
    <main className="app-content p-4 md:p-6 lg:p-8 w-full mx-auto flex flex-col gap-6">
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* COLUMNA IZQUIERDA (Span 4) */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* Tarjeta Unificada (Tu Señal + Runestone + Agent + Live Signals) */}
          <div className="bg-bg-primary rounded-[2.5rem] border border-border-light shadow-glow-magenta relative flex flex-col p-6 justify-between flex-grow group hover:shadow-glow-magenta-lg transition-shadow duration-700 min-h-[800px]">
            {/* Glow effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-runestone/15 via-transparent to-transparent pointer-events-none group-hover:from-accent-runestone/25 transition-colors duration-700 rounded-[2.5rem]"></div>
            
            <RunestonePanel />
            <AgentPanel />
            <LiveSignals />
          </div>
        </div>

        {/* COLUMNA DERECHA (Span 8) */}
        <div className="xl:col-span-8 flex flex-col gap-4 h-full min-h-[800px]">
          <NetworkStats />
          <NodesGrid />
          <RankingTable />
        </div>

      </div>
    </main>
  );
}
