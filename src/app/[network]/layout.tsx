import { Web3Provider } from '@/components/Web3Provider';
import { Header } from '@/components/Header';
import { ReactNode } from 'react';
import { SUPPORTED_NETWORKS } from '@/lib/config';
import { headers } from 'next/headers';
import { cookieToInitialState, createConfig, createStorage, cookieStorage, http } from 'wagmi';
import { mainnet } from 'viem/chains';

export const runtime = 'edge';

interface NetworkLayoutProps {
  children: ReactNode;
  params: Promise<{ network: string }>;
}

// Creamos un config básico solo para que cookieToInitialState pueda extraer la cookie en el SSR.
// Esto evita importar wagmi.config.ts, el cual usa getDefaultConfig (función exclusiva de cliente en RainbowKit).
const serverConfig = createConfig({
  chains: [mainnet],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: { [mainnet.id]: http() },
});

export default async function NetworkLayout({ children, params }: NetworkLayoutProps) {
  const p = await params;
  
  if (!SUPPORTED_NETWORKS.includes(p.network)) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full flex-grow">
        <h1 className="text-3xl font-bold text-white mb-4">Red no soportada</h1>
        <p className="text-text-muted">Actualmente solo soportamos Arc Testnet.</p>
      </main>
    );
  }

  const headersList = await headers();
  const initialState = cookieToInitialState(serverConfig, headersList.get('cookie'));

  return (
    <Web3Provider initialState={initialState}>
      <Header networkParam={p.network} />
      {children}
    </Web3Provider>
  );
}

