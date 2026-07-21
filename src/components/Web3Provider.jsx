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

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
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
    if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
      alert('MetaMask no detectado.');
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
    }
  };

  const disconnect = () => {
    setAddress(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
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
      }
    }
  };

  return (
    <Web3Context.Provider value={{ address, chainId, provider, signer, connect, disconnect }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
