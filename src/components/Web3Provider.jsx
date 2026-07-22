'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { NETWORK } from '@/lib/config';

const Web3Context = createContext();

export function Web3Provider({ children }) {
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [error, setError] = useState(null);

  const clearError = () => setError(null);

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // eth_accounts no abre el popup de MetaMask, solo devuelve las cuentas ya aprobadas
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const ethersProvider = new ethers.BrowserProvider(window.ethereum);
            const ethersSigner = await ethersProvider.getSigner();
            const addr = await ethersSigner.getAddress();
            const net = await ethersProvider.getNetwork();
            
            setProvider(ethersProvider);
            setSigner(ethersSigner);
            setAddress(addr);
            setChainId(Number(net.chainId));
          }
        } catch (err) {
          console.error("Auto-connect failed:", err);
        }
      }
    };

    if (typeof window !== 'undefined' && window.ethereum) {
      checkConnection();
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) disconnect();
    else setAddress(accounts[0]);
  };

  const handleChainChanged = (newChainIdHex) => {
    setChainId(parseInt(newChainIdHex, 16));
    window.location.reload();
  };

  const connect = async () => {
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
    } catch (err) {
      console.error(err);
      if (err.code === 4001) {
        setError("Solicitud rechazada por el usuario.");
      } else {
        setError(err.message || "Error al intentar conectar la wallet.");
      }
    }
  };

  const disconnect = () => {
    setAddress(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setError(null);
  };

  const switchToArcTestnet = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK.chainIdHex }],
      });
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: NETWORK.chainIdHex,
            chainName: NETWORK.name,
            nativeCurrency: NETWORK.nativeCurrency,
            rpcUrls: NETWORK.rpcUrls,
            blockExplorerUrls: [NETWORK.blockExplorer],
          }],
        });
      } else {
        throw err;
      }
    }
  };

  return (
    <Web3Context.Provider value={{ address, chainId, provider, signer, connect, disconnect, error, clearError }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
