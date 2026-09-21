'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAccount, useWalletClient, useBalance, useWriteContract } from 'wagmi';
import { ArrowDownUp, Loader2, Wallet } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { parseUnits, erc20Abi } from 'viem';
import { SwapKit, SwapChain, getChainByEnum } from '@circle-fin/swap-kit';
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import type { NetworkConfig } from '@/lib/config';

const TOKENS = ['USDC', 'EURC', 'cirBTC'] as const;

// Token Addresses by Chain ID
const CHAIN_TOKENS: Record<number, Record<string, `0x${string}`>> = {
  5042002: { // Arc Testnet
    USDC: '0x3600000000000000000000000000000000000000',
    EURC: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
    cirBTC: '0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF',
  },
  5042: { // Arc Mainnet
    USDC: '0x3600000000000000000000000000000000000000',
    EURC: '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1',
    cirBTC: '0x171A4217b86A807A64eB94757Db6849fb4bDbAA0',
  }
};

const DEX_ROUTER_ADDRESS_TESTNET = '0x54599C3e0bcb99ca37b286242b5eC5D331AB9D18'; // Known Arc Testnet V2 Router

const ROUTER_ABI = [
  { inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'path', type: 'address[]' }], name: 'getAmountsOut', outputs: [{ name: 'amounts', type: 'uint256[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'amountOutMin', type: 'uint256' }, { name: 'path', type: 'address[]' }, { name: 'to', type: 'address' }, { name: 'deadline', type: 'uint256' }], name: 'swapExactTokensForTokens', outputs: [{ name: 'amounts', type: 'uint256[]' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'amountOutMin', type: 'uint256' }, { name: 'path', type: 'address[]' }, { name: 'to', type: 'address' }, { name: 'deadline', type: 'uint256' }], name: 'swapExactETHForTokens', outputs: [{ name: 'amounts', type: 'uint256[]' }], stateMutability: 'payable', type: 'function' }
];

const DECIMALS: Record<string, number> = { USDC: 18, EURC: 6, cirBTC: 8 };

const FALLBACK_RATES: Record<string, Record<string, number>> = {
  USDC: { EURC: 1 / 1.09 },
  EURC: { USDC: 1.09 },
};

export default function MiniSwap({ config }: { config: NetworkConfig }) {
  const { address, connector } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  const [tokenIn, setTokenIn] = useState<string>('USDC');
  const [tokenOut, setTokenOut] = useState<string>('EURC');
  const [amountIn, setAmountIn] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [estimatedOutput, setEstimatedOutput] = useState<string>('');
  const [isEstimating, setIsEstimating] = useState(false);

  const tokenAddresses = CHAIN_TOKENS[config.chainId] || CHAIN_TOKENS[5042002];
  const swapChainStr = config.chainId === 5042 ? 'Arc' : 'Arc_Testnet';

  const { data: balanceIn } = useBalance({
    address,
    token: tokenAddresses[tokenIn],
    query: { enabled: !!address }
  });

  const { data: balanceOut } = useBalance({
    address,
    token: tokenAddresses[tokenOut],
    query: { enabled: !!address }
  });

  const formatBalance = (data?: { formatted: string; symbol: string }) => {
    if (!data) return '0.00';
    return Number(data.formatted).toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  const swapInProgress = useRef(false);

  useEffect(() => {
    let active = true;

    const handler = setTimeout(async () => {
      if (!amountIn || isNaN(Number(amountIn)) || Number(amountIn) <= 0) {
        if (active) {
          setEstimatedOutput('');
          setError(null);
        }
        return;
      }

      if (!address || !walletClient || !connector) {
        if (active) setEstimatedOutput('N/A');
        return;
      }

      if (active) setIsEstimating(true);
      if (active) setError(null);

      // cirBTC fallback for Testnet, or if SwapKit doesn't natively support it yet
      if (tokenIn === 'cirBTC' || tokenOut === 'cirBTC') {
        setTimeout(() => {
          if (!active) return;
          try {
             const btcPriceInUsdc = 60000; 
             let outVal = 0;
             if (tokenIn === 'USDC' && tokenOut === 'cirBTC') outVal = Number(amountIn) / btcPriceInUsdc;
             if (tokenIn === 'cirBTC' && tokenOut === 'USDC') outVal = Number(amountIn) * btcPriceInUsdc;
             if (tokenIn === 'EURC' && tokenOut === 'cirBTC') outVal = (Number(amountIn) * 1.1) / btcPriceInUsdc;
             if (tokenIn === 'cirBTC' && tokenOut === 'EURC') outVal = (Number(amountIn) * btcPriceInUsdc) / 1.1;
             
             if (outVal > 0) {
               setEstimatedOutput(outVal.toFixed(6));
             } else {
               setEstimatedOutput('N/A');
             }
          } catch(e) {
             setEstimatedOutput('N/A');
          } finally {
             setIsEstimating(false);
          }
        }, 600);
        return;
      }

      try {
        const provider = await connector.getProvider();
        const arcChainDef = getChainByEnum(swapChainStr as any);
        const adapter = await createViemAdapterFromProvider({
          provider: provider as any,
          capabilities: {
            addressContext: 'user-controlled',
            supportedChains: [arcChainDef],
          },
        });

        const kit = new SwapKit();
        const estimateResult = await kit.estimate({
          from: { adapter, chain: swapChainStr as SwapChain },
          tokenIn: tokenIn as any,
          tokenOut: tokenOut as any,
          amountIn,
        });

        if (active) {
          if (estimateResult.estimatedOutput?.amount) {
            setEstimatedOutput(estimateResult.estimatedOutput.amount);
          } else {
            setEstimatedOutput('N/A');
          }
        }
      } catch (err: unknown) {
        console.warn(`SwapKit estimate unavailable on ${swapChainStr}:`, (err as Error)?.message || err);
        if (active) {
          const rate = FALLBACK_RATES[tokenIn]?.[tokenOut];
          if (rate) {
            const approx = (Number(amountIn) * rate).toFixed(6);
            setEstimatedOutput(`~${approx}`);
          } else {
            setEstimatedOutput('N/A');
          }
        }
      } finally {
        if (active) setIsEstimating(false);
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [amountIn, tokenIn, tokenOut, address, walletClient, connector, swapChainStr]);

  const handleSwap = useCallback(async () => {
    if (!address || !walletClient || !connector) return;
    if (!amountIn || isNaN(Number(amountIn)) || Number(amountIn) <= 0) return;
    if (swapInProgress.current) return;

    swapInProgress.current = true;
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // DEX Router Fallback para cirBTC
      if (tokenIn === 'cirBTC' || tokenOut === 'cirBTC') {
        const amountInWei = parseUnits(amountIn, DECIMALS[tokenIn]);
        // 1. Aprobar el token de entrada si es ERC20
        if (tokenAddresses[tokenIn] !== tokenAddresses['USDC']) { 
           // Asumiendo que USDC es nativo en Arc, si no es USDC, aprobamos.
           await writeContractAsync({
             address: tokenAddresses[tokenIn],
             abi: erc20Abi,
             functionName: 'approve',
             args: [DEX_ROUTER_ADDRESS_TESTNET, amountInWei]
           });
        }
        
        // 2. Ejecutar Swap en Router V2
        const path = [tokenAddresses[tokenIn], tokenAddresses[tokenOut]];
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 mins
        
        // Mock swap execution request (will trigger wallet)
        const result = await writeContractAsync({
          address: DEX_ROUTER_ADDRESS_TESTNET,
          abi: ROUTER_ABI,
          functionName: 'swapExactTokensForTokens',
          args: [amountInWei, 0n, path, address, deadline]
        });

        console.log('DEX Swap executed:', result);
        setSuccess(true);
        setAmountIn('');
        return;
      }

      // 1. Get the EIP-1193 provider from the active connector
      const provider = await connector.getProvider();

      // 2. Get the chain definition for the adapter capabilities
      const arcChainDef = getChainByEnum(swapChainStr as any);

      // 3. Create adapter using the official factory method (browser wallets)
      const adapter = await createViemAdapterFromProvider({
        provider: provider as any,
        capabilities: {
          addressContext: 'user-controlled',
          supportedChains: [arcChainDef as any],
        },
      });

      // 4. Execute the swap via SwapKit (human-readable amountIn)
      const kit = new SwapKit();
      const result = await kit.swap({
        from: { adapter, chain: swapChainStr as SwapChain },
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
  }, [address, walletClient, connector, amountIn, tokenIn, tokenOut, tokenAddresses, swapChainStr]);

  const handleSwitchTokens = useCallback(() => {
    setTokenIn(prev => {
      setTokenOut(prev);
      return tokenOut;
    });
  }, [tokenOut]);

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden group rounded-xl bg-card border border-border/40 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none group-hover:from-primary/10 transition-colors duration-500"></div>

      <div className="w-full relative z-10 p-3 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            Swap Tokens
          </h4>
          {success && <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-sm border border-emerald-200 dark:border-emerald-900/50">Success</span>}
        </div>

        <div className="flex-1 flex flex-col justify-center gap-1">
          {/* Token In */}
          <div className="bg-background/60 border border-border/60 rounded-xl p-2.5 flex flex-col justify-between shadow-sm focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <div className="flex items-center justify-between mb-1">
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                disabled={isLoading}
                className="w-1/2 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/40 disabled:opacity-50"
              />
              <DropdownMenu>
                <DropdownMenuTrigger disabled={isLoading} className="text-xs font-semibold bg-secondary/50 hover:bg-secondary text-secondary-foreground px-2 py-1 rounded-md transition-colors border border-border/50 disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-sm">
                  {tokenIn} <span className="text-[10px] opacity-60">▼</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-24 z-[9999] min-w-0">
                  {TOKENS.map(t => (
                    <DropdownMenuItem key={`in-${t}`} onClick={() => setTokenIn(t)} disabled={t === tokenOut} className="text-xs cursor-pointer">
                      {t}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {address && (
              <div className="flex items-center text-[10px] text-muted-foreground/70 font-medium cursor-pointer hover:text-primary/70 transition-colors" onClick={() => {
                if (balanceIn?.formatted) setAmountIn(balanceIn.formatted);
              }}>
                <Wallet className="w-3 h-3 mr-1" />
                {formatBalance(balanceIn)} {tokenIn}
              </div>
            )}
          </div>

          {/* Switch Button */}
          <div className="flex justify-center -my-3.5 relative z-20">
            <button
              type="button"
              onClick={handleSwitchTokens}
              disabled={isLoading}
              className="bg-background border border-border/80 rounded-full p-1.5 hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-all disabled:opacity-50 shadow-sm active:scale-95"
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Token Out */}
          <div className="bg-background/60 border border-border/60 rounded-xl p-2.5 flex flex-col justify-between shadow-sm focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <div className="flex items-center justify-between mb-1">
              <div className="w-1/2 flex items-center h-5">
                {isEstimating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground/60" />
                ) : (
                  <input
                    type="text"
                    placeholder="0.0"
                    readOnly
                    value={estimatedOutput || (amountIn ? '~' : '')}
                    className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/40 opacity-90 cursor-default"
                  />
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger disabled={isLoading} className="text-xs font-semibold bg-secondary/50 hover:bg-secondary text-secondary-foreground px-2 py-1 rounded-md transition-colors border border-border/50 disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-sm">
                  {tokenOut} <span className="text-[10px] opacity-60">▼</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-24 z-[9999] min-w-0">
                  {TOKENS.map(t => (
                    <DropdownMenuItem key={`out-${t}`} onClick={() => setTokenOut(t)} disabled={t === tokenIn} className="text-xs cursor-pointer">
                      {t}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {address && (
              <div className="flex items-center text-[10px] text-muted-foreground/70 font-medium">
                <Wallet className="w-3 h-3 mr-1" />
                {formatBalance(balanceOut)} {tokenOut}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-2 text-[10px] text-destructive/90 leading-tight px-1 break-words font-medium">
            {error}
          </div>
        )}

        <button
          onClick={handleSwap}
          disabled={isLoading || !address || !amountIn || Number(amountIn) <= 0 || estimatedOutput === 'N/A'}
          className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold tracking-wide py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center h-8 shadow-sm active:scale-[0.98]"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (!address ? 'Connect Wallet' : 'Swap')}
        </button>
      </div>
    </div>
  );
}
