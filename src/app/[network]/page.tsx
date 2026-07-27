import ClientPage from './ClientPage';
import { getLeaderboard } from '@/lib/leaderboardService';

interface NetworkPageProps {
  params: Promise<{ network: string }>;
}

export default async function NetworkPage({ params }: NetworkPageProps) {
  // ISR: Obtiene el leaderboard en el servidor (caché revalidada cada 60s)
  const leaderboardData = await getLeaderboard();

  return <ClientPage leaderboardData={leaderboardData} params={params} />;
}
