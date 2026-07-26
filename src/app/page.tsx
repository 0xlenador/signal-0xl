import Link from 'next/link';
import Image from 'next/image';
import { NETWORK } from '@/lib/config';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary px-4">
      {/* Hero Header */}
      <div className="text-center mb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/5 to-transparent pointer-events-none rounded-[2.5rem]"></div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-md">
          Signal <span className="text-accent-primary drop-shadow-[0_0_20px_rgba(0,229,255,0.6)]">0xL</span>
        </h1>
        <p className="text-text-muted max-w-lg mx-auto text-lg font-light">
          Select a network to connect your wallet and broadcast your signal.
        </p>
      </div>

      {/* Network Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        
        {/* Network Card */}
        <Link 
          href={`/${NETWORK.slug}`}
          className="glass-panel rounded-3xl p-8 shadow-lg relative flex flex-col items-center text-center group hover:shadow-glow-cyan transition-shadow duration-500 cursor-pointer overflow-hidden border border-border-light hover:border-accent-primary/50 !no-underline"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 to-transparent pointer-events-none group-hover:from-accent-primary/20 transition-colors"></div>
          
          <div className="w-20 h-20 mb-6 rounded-full overflow-hidden border-2 border-accent-primary shadow-glow-cyan">
            <Image src="/assets/arc-logo.jpg" alt="Arc Testnet" width={80} height={80} className="w-full h-full object-cover" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-accent-primary transition-colors">
            Arc Testnet
          </h2>
          <p className="text-text-muted text-sm font-light">
            Testing and validation environment. Active network for daily signal broadcasting.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 bg-accent-success/10 text-accent-success px-3 py-1 rounded-full border border-accent-success/20 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse"></span>
            Online
          </div>
        </Link>

        {/* Arc Mainnet Card (Disabled) */}
        <div className="glass-panel rounded-3xl p-8 shadow-lg relative flex flex-col items-center text-center opacity-60 cursor-not-allowed border border-border-color overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          
          <div className="w-20 h-20 mb-6 rounded-full overflow-hidden border-2 border-border-light grayscale">
            <Image src="/assets/arc-logo.jpg" alt="Arc Mainnet" width={80} height={80} className="w-full h-full object-cover opacity-50" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            Arc Mainnet
          </h2>
          <p className="text-text-muted text-sm font-light">
            Main production network. Official deployment.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 bg-surface-2 text-text-muted px-3 py-1 rounded-full border border-border-light text-xs font-bold uppercase tracking-wider">
            Coming Soon
          </div>
        </div>

      </div>
    </div>
  );
}
