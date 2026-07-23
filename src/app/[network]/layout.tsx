import { Web3Provider } from '@/components/Web3Provider';
import { Header } from '@/components/Header';
import { ReactNode } from 'react';

interface NetworkLayoutProps {
  children: ReactNode;
  params: Promise<{ network: string }>;
}

export default async function NetworkLayout({ children, params }: NetworkLayoutProps) {
  const p = await params;
  
  if (p.network !== 'arc-testnet') {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full flex-grow">
        <h1 className="text-3xl font-bold text-white mb-4">Red no soportada</h1>
        <p className="text-text-muted">Actualmente solo soportamos Arc Testnet.</p>
      </main>
    );
  }

  return (
    <Web3Provider>
      <Header networkParam={p.network} />
      {children}
    </Web3Provider>
  );
}
