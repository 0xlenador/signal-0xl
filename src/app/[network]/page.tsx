import ClientPage from './ClientPage';
import { getLeaderboard } from '@/lib/leaderboardService';
import { EVM_NETWORKS, DEFAULT_CHAIN_ID } from '@/lib/config';

interface NetworkPageProps {
  params: Promise<{ network: string }>;
}

export default async function NetworkPage({ params }: NetworkPageProps) {
  const { network } = await params;
  const config = Object.values(EVM_NETWORKS).find(c => c.slug === network) || EVM_NETWORKS[DEFAULT_CHAIN_ID];

  // ISR: Obtiene el leaderboard en el servidor (caché revalidada cada 60s)
  const leaderboardData = await getLeaderboard(config.indexerUrl);

  return <ClientPage leaderboardData={leaderboardData} params={params} />;
}
