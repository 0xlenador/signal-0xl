'use client';
import Image from 'next/image';
import { useWeb3 } from './Web3Provider';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Link, LogOut, ChevronDown } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4"></path>
  </svg>
);

export function Header({ networkParam }: { networkParam?: string }) {
  const { address, connect, disconnect, isInitializing } = useWeb3();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const params = useParams();

  useEffect(() => {
    if (isInitializing) return; // Evitar parpadeos mientras lee la wallet de MetaMask

    if (networkParam && address && !params.wallet) {
      // Solo enviamos al usuario a su dashboard si se conecta desde la página de inicio (root network)
      router.push(`/${networkParam}/${address}`);
    }
  }, [address, networkParam, router, params.wallet, isInitializing]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <header className="app-header w-full flex items-center justify-between p-4 px-6 bg-surface-1/95 backdrop-blur-2xl border-b border-border-light sticky top-0 z-50 shadow-lg transition-all">
      <div className="app-logo text-xl font-bold tracking-tight text-white cursor-pointer" onClick={() => router.push('/')}>
        Signal <span className="text-accent-primary drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">0xL</span>
      </div>
      
      <div className="flex items-center gap-3">
        {/* GitHub */}
        <a href="https://github.com/0xlenador/signal-0xl" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white transition-colors flex items-center" aria-label="GitHub">
          <GithubIcon className="w-5 h-5" />
        </a>

        {/* Separador */}
        <div className="h-5 w-[1px] bg-border-light mx-1 hidden sm:block"></div>

        {/* Network Badge */}
        {networkParam === 'arc-testnet' && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-1 border border-border-light text-[0.65rem] font-bold text-text-muted">
            <Image src="/assets/arc-logo.jpg" alt="Arc" width={16} height={16} className="rounded-full object-cover" />
            Arc Testnet
          </div>
        )}

        <div className="relative flex items-center gap-2" ref={dropdownRef}>
          {!address ? (
            <button onClick={connect} className="bg-accent-primary hover:bg-accent-primary-dim text-bg-primary font-bold text-sm px-4 py-1.5 rounded-full transition-all shadow-glow-cyan flex items-center gap-2">
              <Link className="w-4 h-4" />
              <span>Connect</span>
            </button>
          ) : (
            <div className="relative">
              {/* Connected Pill */}
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-surface-2 hover:bg-surface-1 transition-colors px-2 py-1.5 rounded-full border border-border-light hover:border-accent-primary/50 cursor-pointer shadow-sm">
                
                {/* Mini Avatar */}
                <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-tr from-accent-primary to-accent-runestone shadow-[0_0_5px_rgba(0,229,255,0.3)]">
                  <Image unoptimized src={getAvatarUrl(address)} alt="Avatar" width={20} height={20} className="w-full h-full opacity-90" />
                </div>
                
                {/* Address */}
                <span className="text-xs font-mono font-bold text-white tracking-wider pt-0.5">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                
                <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-3 border border-border-light rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,1)] min-w-[170px] z-50 overflow-hidden bg-[#05050A]">
                  <div className="flex flex-col p-1.5 w-full">
                    <button 
                      onClick={() => {
                        setDropdownOpen(false);
                        disconnect();
                      }} 
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-accent-error font-bold hover:bg-accent-error/10 transition-colors flex items-center gap-2">
                      <LogOut className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
