'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { createContext, useContext, ReactNode, useState, useCallback, useMemo, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useAccount, useDisconnect, useChainId } from 'wagmi';
import { RainbowKitProvider, darkTheme, useConnectModal } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '@/lib/wagmi.config';

// Definición estricta del Contexto — ethers completamente eliminado
export interface IWeb3Context {
  address: string | null;
  chainId: number | null;
  error: string | null;
  isInitializing: boolean;
  status: 'connected' | 'reconnecting' | 'connecting' | 'disconnected' | undefined;
  isReconnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  clearError: () => void;
}

const Web3Context = createContext<IWeb3Context | undefined>(undefined);

// Hook tipado y seguro
export const useWeb3 = (): IWeb3Context => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Componente interno que usa los hooks de Wagmi/RainbowKit
function Web3ContextManager({ children }: { children: ReactNode }) {
  const { address, isConnecting, isReconnecting, status } = useAccount();
  const chainId = useChainId();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  const [error, setError] = useState<string | null>(null);
  
  // Manejo del estado montado para SSR y evitar Hydration Mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const clearError = useCallback(() => setError(null), []);

  const disconnect = useCallback(() => {
    wagmiDisconnect();
  }, [wagmiDisconnect]);

  const connect = useCallback(() => {
    if (openConnectModal) {
      openConnectModal();
    }
  }, [openConnectModal]);

  const contextValue = useMemo<IWeb3Context>(() => ({
    address: mounted && status === 'connected' && address ? address : null,
    chainId: mounted ? chainId : null,
    status,
    isReconnecting,
    connect,
    disconnect,
    error,
    isInitializing: !mounted || isConnecting,
    clearError
  }), [mounted, status, address, chainId, isReconnecting, connect, disconnect, error, isConnecting, clearError]);

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
}

// Proveedor principal que envuelve con Wagmi, React Query y RainbowKit
const queryClient = new QueryClient();

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#00e5ff',
            accentColorForeground: '#0a0a0a',
            borderRadius: 'large',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          <Web3ContextManager>
            {children}
          </Web3ContextManager>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
