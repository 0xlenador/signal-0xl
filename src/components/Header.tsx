'use client';
import Image from 'next/image';
import { useWeb3 } from './Web3Provider';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Link, ChevronDown, LayoutDashboard } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import { NETWORK, SUPPORTED_NETWORKS } from '@/lib/config';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4"></path>
  </svg>
);

export function Header({ networkParam }: { networkParam?: string }) {
  const { address, connect, isInitializing, status, isReconnecting } = useWeb3();
  const router = useRouter();

  const params = useParams();
  const isOnOwnDashboard = address && params.wallet && (params.wallet as string).toLowerCase() === address.toLowerCase();

  useEffect(() => {
    // No hacer nada mientras se inicializa o reconecta
    if (isInitializing) return;

    // Solo redirigir al dashboard cuando el usuario se conecta manualmente
    // (no durante reconexión silenciosa), y solo si no está ya en un dashboard
    if (networkParam && address && !params.wallet) {
      if (!isReconnecting && status === 'connected') {
        router.push(`/${networkParam}/${address}`);
      }
    }
  }, [address, networkParam, router, params.wallet, isInitializing, isReconnecting, status]);

  return (
    <header className="app-header w-full flex items-center justify-between p-4 px-6 bg-surface-1/95 backdrop-blur-2xl border-b border-border-light sticky top-0 z-50 shadow-lg transition-all">
      <div className="flex items-center gap-4">
        <div className="app-logo flex items-center gap-2 text-xl font-bold tracking-tight text-white cursor-pointer" onClick={() => router.push('/')}>
          <Image src="/icon.svg" alt="Signal 0xL Logo" width={24} height={24} className="drop-shadow-[0_0_5px_rgba(0,229,255,0.3)]" />
          <div>Signal <span className="text-accent-primary drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">0xL</span></div>
        </div>

        <button 
          onClick={() => {
            if (!address) {
              connect();
            } else if (!isOnOwnDashboard) {
              router.push(`/${networkParam || 'arc-testnet'}/${address}`);
            }
          }}
          className={`bg-surface-2 border border-border-light text-white font-bold text-xs px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${!isOnOwnDashboard ? 'hover:bg-surface-1 hover:border-accent-primary/50 cursor-pointer' : 'cursor-default'}`}
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-accent-primary" />
          <span className="hidden sm:inline">My Dashboard</span>
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        {/* GitHub */}
        <a href="https://github.com/0xlenador/signal-0xl" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white transition-colors flex items-center" aria-label="GitHub">
          <GithubIcon className="w-5 h-5" />
        </a>

        {/* Separador */}
        <div className="h-5 w-[1px] bg-border-light mx-1 hidden sm:block"></div>

        {/* Network Badge */}
        {networkParam && SUPPORTED_NETWORKS.includes(networkParam) && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-1 border border-border-light text-[0.65rem] font-bold text-text-muted">
            <Image src="/assets/arc-logo.jpg" alt="Logo de Arc (Circle)" width={16} height={16} className="rounded-full object-cover" />
            {NETWORK.name}
          </div>
        )}

        <div className="relative flex items-center gap-2">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== 'loading';
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === 'authenticated');

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    'style': {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button onClick={openConnectModal} type="button" className="bg-accent-primary hover:bg-accent-primary-dim text-bg-primary font-bold text-sm px-4 py-1.5 rounded-full transition-all shadow-glow-cyan flex items-center gap-2">
                          <Link className="w-4 h-4" />
                          <span>Connect</span>
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button onClick={openChainModal} type="button" className="bg-accent-error hover:bg-red-600 text-white font-bold text-sm px-4 py-1.5 rounded-full transition-all flex items-center gap-2">
                          Wrong network
                        </button>
                      );
                    }

                    return (
                      <button 
                        onClick={openAccountModal}
                        type="button"
                        className="flex items-center gap-2 bg-surface-2 hover:bg-surface-1 transition-colors px-2 py-1.5 rounded-full border border-border-light hover:border-accent-primary/50 cursor-pointer shadow-sm">
                        
                        {/* Mini Avatar */}
                        <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-tr from-accent-primary to-accent-runestone shadow-[0_0_5px_rgba(0,229,255,0.3)]">
                          <Image unoptimized src={getAvatarUrl(account.address)} alt="Avatar" width={20} height={20} className="w-full h-full opacity-90" />
                        </div>
                        
                        {/* Address */}
                        <span className="text-xs font-mono font-bold text-white tracking-wider pt-0.5">
                          {account.displayName}
                        </span>
                        
                        <ChevronDown className="w-3.5 h-3.5 text-text-muted transition-transform duration-200" />
                      </button>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
}
