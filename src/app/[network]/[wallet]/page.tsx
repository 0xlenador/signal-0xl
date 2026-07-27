import ClientPage from './ClientPage';
import { getLeaderboard } from '@/lib/leaderboardService';

interface DashboardPageProps {
  params: Promise<{ network: string; wallet: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  // ISR: Obtiene el leaderboard en el servidor (caché revalidada cada 60s)
  const leaderboardData = await getLeaderboard();

  return <ClientPage leaderboardData={leaderboardData} params={params} />;
}
