'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { NETWORK } from '@/lib/config';

// 1. Definición estricta del Contexto
export interface IWeb3Context {
  address: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  error: string | null;
  isInitializing: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

// 2. Extender Window con una interfaz de proveedor básica en lugar de 'any'
interface WindowEthereum {
  isMetaMask?: boolean;
  request: (request: { method: string, params?: unknown[] }) => Promise<unknown>;
  on: (eventName: string, handler: (args: unknown) => void) => void;
  removeListener: (eventName: string, handler: (args: unknown) => void) => void;
}

declare global {
  interface Window {
    ethereum?: WindowEthereum;
  }
}

const Web3Context = createContext<IWeb3Context | undefined>(undefined);

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const clearError = useCallback(() => setError(null), []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setError(null);
  }, []);

  // 3. Resolución de Linter: Declarar funciones antes de usarlas y con useCallback
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) disconnect();
    else setAddress(accounts[0]);
  }, [disconnect]);

  const handleChainChanged = useCallback((newChainIdHex: string) => {
    setChainId(parseInt(newChainIdHex, 16));
    window.location.reload();
  }, []);

  useEffect(() => {
    let isMounted = true; // Patrón avanzado para prevenir fugas de memoria si el componente se desmonta antes de que acabe el await

    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const response = await window.ethereum.request({ method: 'eth_accounts' });
          const accounts = response as string[];
          if (accounts && accounts.length > 0 && isMounted) {
            const ethersProvider = new ethers.BrowserProvider(window.ethereum);
            const ethersSigner = await ethersProvider.getSigner();
            const addr = await ethersSigner.getAddress();
            const net = await ethersProvider.getNetwork();
            
            if (isMounted) {
              setProvider(ethersProvider);
              setSigner(ethersSigner);
              setAddress(addr);
              setChainId(Number(net.chainId));
            }
          }
        } catch (error) {
          if (isMounted) console.error("Auto-connect failed:", error);
        }
      }
      if (isMounted) setIsInitializing(false);
    };

    if (typeof window !== 'undefined' && window.ethereum) {
      checkConnection();
      window.ethereum.on('accountsChanged', (args: unknown) => handleAccountsChanged(args as string[]));
      window.ethereum.on('chainChanged', (args: unknown) => handleChainChanged(args as string));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (isMounted) setIsInitializing(false);
    }
    
    return () => {
      isMounted = false; // El desmontaje previene llamadas a setState zombies
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', (args: unknown) => handleAccountsChanged(args as string[]));
        window.ethereum.removeListener('chainChanged', (args: unknown) => handleChainChanged(args as string));
      }
    };
  }, [handleAccountsChanged, handleChainChanged]); // Dependencias requeridas por ESLint

  const switchToArcTestnet = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK.chainIdHex }],
      });
    } catch (error) {
      const err = error as { code?: number; message?: string };
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: NETWORK.chainIdHex,
            chainName: NETWORK.name,
            nativeCurrency: NETWORK.nativeCurrency,
            rpcUrls: [...NETWORK.rpcUrls], // Romper readonly del as const para la API de Metamask
            blockExplorerUrls: [NETWORK.blockExplorer],
          }],
        });
      } else {
        throw err;
      }
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
      setError('MetaMask u otra wallet Web3 no detectada en el navegador.');
      return;
    }
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const ethersSigner = await ethersProvider.getSigner();
      const addr = await ethersSigner.getAddress();
      const net = await ethersProvider.getNetwork();
      
      setProvider(ethersProvider);
      setSigner(ethersSigner);
      setAddress(addr);
      setChainId(Number(net.chainId));

      if (Number(net.chainId) !== NETWORK.chainId) {
        await switchToArcTestnet();
      }
    } catch (error) {
      const err = error as { code?: number; message?: string };
      console.error(err);
      if (err.code === 4001) {
        setError("Solicitud rechazada por el usuario.");
      } else {
        setError(err.message || "Error al intentar conectar la wallet.");
      }
    }
  }, [switchToArcTestnet]);

  // 5. Memoización del Contexto (Mejores prácticas de rendimiento en React)
  const contextValue = useMemo(() => ({
    address,
    chainId,
    provider,
    signer,
    connect,
    disconnect,
    error,
    isInitializing,
    clearError
  }), [address, chainId, provider, signer, connect, disconnect, error, isInitializing, clearError]);

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
}

// 4. Hook tipado y seguro
export const useWeb3 = (): IWeb3Context => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
