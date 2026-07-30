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

  return (
    <main className="p-4 md:p-6 lg:p-8 w-full mx-auto flex flex-col gap-6">
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* COLUMNA IZQUIERDA (Span 4) */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* Tarjeta Unificada (Tu Señal + Runestone + Agent + Live Signals) */}
          <div className="bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-xl relative flex flex-col p-5 justify-between flex-grow group hover:shadow-[0_0_40px_rgba(147,51,234,0.15)] transition-shadow duration-700 md:min-h-[800px] hover:z-50">
            {/* Glow effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-runestone/10 via-transparent to-transparent pointer-events-none group-hover:from-accent-runestone/20 transition-colors duration-700 rounded-[2.5rem]"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
              <RunestonePanel />
              <div className="hidden md:block w-full"><AgentPanel /></div>
              <div className="hidden md:block w-full"><LiveSignals /></div>
            </div>
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
