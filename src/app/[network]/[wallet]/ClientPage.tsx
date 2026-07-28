'use client';
import { use } from 'react';
import RunestonePanel from '@/components/dashboard/RunestonePanel';
import AgentPanel from '@/components/dashboard/AgentPanel';
import LiveSignals from '@/components/dashboard/LiveSignals';
import NetworkStats from '@/components/dashboard/NetworkStats';
import NodesGrid from '@/components/dashboard/NodesGrid';
import RankingTable from '@/components/dashboard/RankingTable';
import type { ILeaderboardUser } from '@/lib/leaderboardService';

interface DashboardPageProps {
  params: Promise<{ network: string; wallet: string }>;
  leaderboardData: ILeaderboardUser[];
}

export default function ClientPage({ params, leaderboardData }: DashboardPageProps) {
  const { network, wallet } = use(params);
  // Address can be checked via useWeb3() inside child components if needed

  return (
    <main className="app-content p-4 md:p-6 lg:p-8 w-full mx-auto flex flex-col gap-6">
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* COLUMNA IZQUIERDA (Span 4) */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* Tarjeta Unificada (Tu Señal + Runestone + Agent + Live Signals) */}
          <div className="bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl relative flex flex-col p-6 justify-between flex-grow group hover:shadow-[0_0_40px_rgba(255,0,127,0.2)] transition-shadow duration-700 min-h-[800px] hover:z-50">
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
          <RankingTable initialData={leaderboardData} />
        </div>

      </div>
    </main>
  );
}
