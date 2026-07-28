'use client';
import Image from 'next/image';
import { useWeb3 } from './Web3Provider';
import { ClientOnly } from './ClientOnly';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Link, ChevronDown, LayoutDashboard } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import { NETWORK, SUPPORTED_NETWORKS } from '@/lib/config';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';

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
    if (isInitializing) return;

    if (networkParam && address && !params.wallet) {
      if (!isReconnecting && status === 'connected') {
        router.push(`/${networkParam}/${address}`);
      }
    }
  }, [address, networkParam, router, params.wallet, isInitializing, isReconnecting, status]);

  return (
    <header className="w-full flex items-center justify-between p-4 px-6 bg-background/95 backdrop-blur-2xl border-b border-border sticky top-0 z-50 shadow-sm transition-all">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground cursor-pointer" onClick={() => router.push('/')}>
          <Image src="/icon.svg" alt="Signal 0xL Logo" width={24} height={24} className="shadow-sm" />
          <div>Signal <span className="text-accent-runestone">0xL</span></div>
        </div>

        <ClientOnly>
          <Button 
            variant={!isOnOwnDashboard ? "outline" : "secondary"}
            size="sm"
            className="rounded-full h-8 px-3 gap-1.5 font-medium"
            disabled={!!isOnOwnDashboard}
            onClick={() => {
              if (!address) {
                connect();
              } else if (!isOnOwnDashboard) {
                router.push(`/${networkParam || 'arc-testnet'}/${address}`);
              }
            }}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Dashboard</span>
          </Button>
        </ClientOnly>
      </div>
      
      <div className="flex items-center gap-3">
        {/* GitHub */}
        <a href="https://github.com/0xlenador/signal-0xl" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex items-center" aria-label="GitHub">
          <GithubIcon className="w-5 h-5" />
        </a>

        {/* Separador */}
        <div className="h-5 w-[1px] bg-border mx-1 hidden sm:block"></div>

        {/* Network Badge */}
        {networkParam && SUPPORTED_NETWORKS.includes(networkParam) && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-[0.65rem] font-semibold text-foreground shadow-sm">
            <Image src="/assets/arc-logo.jpg" alt="Logo de Arc (Circle)" width={16} height={16} className="rounded-full object-cover" />
            {NETWORK.name}
          </div>
        )}

        <div className="relative flex items-center gap-2">
          <ClientOnly fallback={<div className="w-24 h-8 bg-muted animate-pulse rounded-full"></div>}>
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
                          <Button onClick={openConnectModal} size="sm" className="rounded-full h-8 px-4 gap-2 font-medium bg-accent-runestone hover:bg-accent-runestone/90 text-white">
                            <Link className="w-4 h-4" />
                            <span>Connect</span>
                          </Button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <Button onClick={openChainModal} variant="destructive" size="sm" className="rounded-full h-8 px-4 font-medium">
                            Wrong network
                          </Button>
                        );
                      }

                      return (
                        <button 
                          onClick={openAccountModal}
                          type="button"
                          className="flex items-center gap-2 bg-background hover:bg-accent transition-colors px-2 py-1.5 rounded-full border border-border cursor-pointer shadow-sm">
                          
                          {/* Mini Avatar */}
                          <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-tr from-accent-runestone to-indigo-600 shadow-sm">
                            <Image unoptimized src={getAvatarUrl(account.address)} alt="Avatar" width={20} height={20} className="w-full h-full opacity-90" />
                          </div>
                          
                          {/* Address */}
                          <span className="text-xs font-mono font-medium text-foreground tracking-wider pt-0.5">
                            {account.displayName}
                          </span>
                          
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200" />
                        </button>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </ClientOnly>
        </div>
      </div>
    </header>
  );
}
