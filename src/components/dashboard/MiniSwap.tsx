'use client';

import { useState, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ArrowDownUp, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SwapKit, SwapChain, getChainByEnum } from '@circle-fin/swap-kit';
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';

const TOKENS = ['USDC', 'EURC', 'NATIVE'] as const;

export default function MiniSwap() {
  const { address, connector } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [tokenIn, setTokenIn] = useState<string>('USDC');
  const [tokenOut, setTokenOut] = useState<string>('EURC');
  const [amountIn, setAmountIn] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Guard against double-clicks
  const swapInProgress = useRef(false);

  const handleSwap = useCallback(async () => {
    if (!address || !walletClient || !connector) return;
    if (!amountIn || isNaN(Number(amountIn)) || Number(amountIn) <= 0) return;
    if (swapInProgress.current) return;

    swapInProgress.current = true;
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Get the EIP-1193 provider from the active connector
      const provider = await connector.getProvider();

      // 2. Get the Arc Testnet chain definition for the adapter capabilities
      const arcChainDef = getChainByEnum('Arc_Testnet');

      // 3. Create adapter using the official factory method (browser wallets)
      const adapter = await createViemAdapterFromProvider({
        provider: provider as any,
        capabilities: {
          addressContext: 'user-controlled',
          supportedChains: [arcChainDef],
        },
      });

      // 4. Execute the swap via SwapKit (using the typed SwapChain enum)
      const kit = new SwapKit();
      const result = await kit.swap({
        from: { adapter, chain: SwapChain.Arc_Testnet },
        tokenIn,
        tokenOut,
        amountIn,
      });

      console.log('Swap executed:', result);
      setSuccess(true);
      setAmountIn('');
    } catch (err: unknown) {
      console.error('Swap failed:', err);
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setError(message);
    } finally {
      setIsLoading(false);
      swapInProgress.current = false;
    }
  }, [address, walletClient, connector, amountIn, tokenIn, tokenOut]);

  const handleSwitchTokens = useCallback(() => {
    setTokenIn(prev => {
      setTokenOut(prev);
      return tokenOut;
    });
  }, [tokenOut]);

  return (
    <div className="w-full flex flex-col items-center justify-center relative overflow-hidden group h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-transparent to-accent-runestone/5 pointer-events-none group-hover:from-accent-primary/10 transition-colors duration-500 rounded-xl"></div>

      <div className="w-full relative z-10 px-1 py-1">
        <h4 className="text-xs font-bold text-foreground/90 mb-3 flex items-center justify-between uppercase tracking-wider">
          <span>Swap Tokens</span>
          {success && <span className="text-[0.6rem] text-accent-success bg-accent-success/10 px-1.5 py-0.5 rounded-sm">Success</span>}
        </h4>

        {/* Token In */}
        <div className="bg-background/40 border border-border/50 rounded-lg p-2 mb-1.5 flex items-center justify-between shadow-sm focus-within:border-accent-primary/50 transition-colors">
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0.0"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            disabled={isLoading}
            className="w-1/2 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
          />
          <DropdownMenu>
            <DropdownMenuTrigger disabled={isLoading} className="text-xs font-bold bg-muted/60 hover:bg-muted text-foreground px-2 py-1 rounded-md transition-colors border border-border/50 disabled:opacity-50 flex items-center gap-1 shrink-0">
              {tokenIn} <span className="text-[10px] opacity-60">▼</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-24 z-[9999] min-w-0 bg-popover text-popover-foreground">
              {TOKENS.map(t => (
                <DropdownMenuItem key={`in-${t}`} onClick={() => setTokenIn(t)} disabled={t === tokenOut} className="text-xs">
                  {t}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            type="button"
            onClick={handleSwitchTokens}
            disabled={isLoading}
            className="bg-background border border-border/80 rounded-full p-1 hover:bg-muted transition-colors disabled:opacity-50 shadow-sm"
          >
            <ArrowDownUp className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>

        {/* Token Out */}
        <div className="bg-background/40 border border-border/50 rounded-lg p-2 mt-1.5 flex items-center justify-between shadow-sm focus-within:border-accent-primary/50 transition-colors">
          <input
            type="text"
            placeholder="0.0"
            disabled
            value={amountIn ? '~' : ''}
            className="w-1/2 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/50 opacity-70"
          />
          <DropdownMenu>
            <DropdownMenuTrigger disabled={isLoading} className="text-xs font-bold bg-muted/60 hover:bg-muted text-foreground px-2 py-1 rounded-md transition-colors border border-border/50 disabled:opacity-50 flex items-center gap-1 shrink-0">
              {tokenOut} <span className="text-[10px] opacity-60">▼</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-24 z-[9999] min-w-0 bg-popover text-popover-foreground">
              {TOKENS.map(t => (
                <DropdownMenuItem key={`out-${t}`} onClick={() => setTokenOut(t)} disabled={t === tokenIn} className="text-xs">
                  {t}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {error && (
          <div className="mt-2 text-[0.6rem] text-destructive leading-tight px-1 break-words">
            {error}
          </div>
        )}

        <button
          onClick={handleSwap}
          disabled={isLoading || !address || !amountIn || Number(amountIn) <= 0}
          className="w-full mt-3 bg-accent-primary/20 hover:bg-accent-primary/30 text-accent-primary border border-accent-primary/50 text-xs font-bold uppercase tracking-wider py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center h-7 shadow-sm"
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : (!address ? 'Connect Wallet' : 'Swap')}
        </button>
      </div>
    </div>
  );
}
