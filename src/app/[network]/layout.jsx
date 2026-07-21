import { Web3Provider } from '@/components/Web3Provider';
import { Header } from '@/components/Header';

export default async function NetworkLayout({ children, params }) {
  const p = await params;
  
  return (
    <Web3Provider>
      <Header networkParam={p.network} />
      {children}
    </Web3Provider>
  );
}
