'use client';
import { useWeb3 } from '@/components/Web3Provider';
import { use } from 'react';
import NetworkStats from '@/components/dashboard/NetworkStats';
import RankingTable from '@/components/dashboard/RankingTable';
import { Lock } from 'lucide-react';
import type { ILeaderboardUser } from '@/lib/leaderboardService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface NetworkPageProps {
  params: Promise<{ network: string }>;
  leaderboardData: ILeaderboardUser[];
}

export default function ClientPage({ params, leaderboardData }: NetworkPageProps) {
  const { connect } = useWeb3();
  const { network } = use(params);

  return (
    <main className="p-4 md:p-6 lg:p-8 w-full mx-auto flex flex-col gap-6 flex-1">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        
        {/* COLUMNA IZQUIERDA (Span 3) - Muted Runestone/Agent Panel */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          <div className="bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl relative flex flex-col p-4 xl:p-6 items-center justify-center flex-grow group min-h-[600px] xl:min-h-[700px] overflow-hidden text-center">
            {/* Real Content overlay / Connect message */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-sm">
               <Lock className="w-12 h-12 text-accent-runestone mb-6 opacity-80" />
               <h2 className="text-2xl font-bold text-slate-100 mb-2">Signals & Agent</h2>
               <p className="text-slate-400 text-sm max-w-xs mb-8">
                 Connect your wallet to access your Runestone Panel, interact with the Agent, and broadcast signals on the network.
               </p>
               <Button onClick={connect} size="lg" className="bg-accent-runestone hover:bg-accent-runestone/90 text-white rounded-full px-8 shadow-sm font-semibold">
                 Connect Wallet
               </Button>
            </div>
            
            {/* Background dummy shapes to simulate the actual panel behind the blur */}
            <div className="absolute inset-0 p-6 flex flex-col gap-6 opacity-20 pointer-events-none">
                <div className="h-64 bg-slate-900 rounded-3xl w-full border border-slate-800"></div>
                <div className="h-40 bg-slate-900 rounded-3xl w-full border border-slate-800"></div>
                <div className="flex-1 bg-slate-900 rounded-3xl w-full border border-slate-800"></div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (Span 9) */}
        <div className="xl:col-span-9 flex flex-col gap-4 h-full min-h-[700px]">
          {/* Tarjeta de red (Normal) */}
          <NetworkStats />
          
          {/* Panel de Nodos (Muted) */}
          <Card className="relative flex flex-col items-center justify-center min-h-[250px] overflow-hidden">
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-background/60 backdrop-blur-sm">
               <Lock className="w-10 h-10 text-muted-foreground mb-4 opacity-80" />
               <h3 className="text-xl font-bold text-foreground mb-2">Node Network</h3>
               <p className="text-muted-foreground text-sm max-w-xs text-center mb-6">
                 Connect your wallet to view the status and activity of the nodes.
               </p>
               <Button onClick={connect} variant="outline" className="rounded-full shadow-sm font-semibold">
                 Connect Wallet
               </Button>
            </div>
            
            {/* Background elements simulating the nodes grid */}
            <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-3 p-6 opacity-30 pointer-events-none">
               {Array.from({ length: 8 }).map((_, i) => (
                 <div key={i} className="bg-muted rounded-2xl w-full h-full border border-border"></div>
               ))}
            </div>
          </Card>

          {/* Leaderboard (Normal) */}
          <RankingTable initialData={leaderboardData} />
        </div>

      </div>
    </main>
  );
}
