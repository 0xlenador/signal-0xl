'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useAccount, useDisconnect, useChainId, State } from 'wagmi';
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

  const clearError = useCallback(() => setError(null), []);

  const disconnect = useCallback(() => {
    wagmiDisconnect();
  }, [wagmiDisconnect]);

  const connect = useCallback(() => {
    if (openConnectModal) {
      openConnectModal();
    }
  }, [openConnectModal]);

  // Preservar la dirección durante la reconexión para evitar parpadeos de null
  // que rompen el botón de wallet, el dashboard y los componentes hijos.
  // Durante el 'reconnecting', wagmi ya tiene el address gracias al cookieStorage,
  // así que es seguro exponerlo mientras se restaura la sesión completa.
  const isConnectedOrReconnecting = status === 'connected' || status === 'reconnecting';

  const contextValue = useMemo<IWeb3Context>(() => ({
    address: isConnectedOrReconnecting && address ? address : null,
    chainId: chainId || null,
    status,
    isReconnecting,
    connect,
    disconnect,
    error,
    isInitializing: isConnecting || isReconnecting,
    clearError
  }), [isConnectedOrReconnecting, status, address, chainId, isReconnecting, connect, disconnect, error, isConnecting, clearError]);

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
}

// Proveedor principal que envuelve con Wagmi, React Query y RainbowKit
// Configuramos el QueryClient para ser "silencioso". No queremos que RainbowKit sature
// nuestros RPCs (ni consuma rate limits) haciendo polling cada vez que el usuario cambia de pestaña.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // No recargar al cambiar de pestaña
      refetchOnMount: false,       // No recargar al montar componentes repetidos
      staleTime: 60 * 1000 * 5,    // Mantener caché intacta por 5 minutos (solo refrescamos con refresh() manual)
      retry: 0,                    // Evitar tormentas de reintentos
    },
  },
});

interface Web3ProviderProps {
  children: ReactNode;
  initialState?: State;
}

export function Web3Provider({ children, initialState }: Web3ProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          locale="en-US"
          theme={darkTheme({
            accentColor: '#000000',
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
