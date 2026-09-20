import { defineChain, fallback, http, type Chain } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { cookieStorage, createStorage } from 'wagmi';
import { EVM_NETWORKS, SUPPORTED_CHAIN_IDS } from '@/lib/config';

/**
 * Mapeo dinámico de todas las redes configuradas en EVM_NETWORKS
 */
export const supportedChains = SUPPORTED_CHAIN_IDS.map(chainId => {
  const config = EVM_NETWORKS[chainId];
  return defineChain({
    id: config.chainId,
    name: config.name,
    nativeCurrency: config.nativeCurrency,
    rpcUrls: {
      default: { http: [...config.rpcUrls] },
    },
    blockExplorers: {
      default: {
        name: 'Explorer',
        url: config.blockExplorer,
      },
    },
    iconUrl: config.iconUrl,
    testnet: config.chainId === 5042002, // O usar una property explícita en config
  });
}) as unknown as [Chain, ...Chain[]];

/**
 * Transports dinámicos basados en la lista de endpoints de cada red.
 */
const dynamicTransports = SUPPORTED_CHAIN_IDS.reduce((acc, chainId) => {
  const endpoints = EVM_NETWORKS[chainId].httpRpcEndpoints;
  acc[chainId] = fallback(
    endpoints.map(rpc => 
      http(rpc.url, { 
        retryCount: rpc.isMain ? 2 : 0, 
        retryDelay: rpc.isMain ? 500 : undefined 
      })
    ),
    { rank: false }
  );
  return acc;
}, {} as Record<number, any>);

/**
 * Configuración central de Wagmi + RainbowKit.
 * - `ssr: true` para compatibilidad con Next.js App Router (previene hydration mismatch).
 * - `projectId` de WalletConnect es requerido por RainbowKit para conectores como WalletConnect.
 */
export const wagmiConfig = getDefaultConfig({
  appName: 'Signal 0xL',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'signal0xl-dev',
  chains: supportedChains,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: dynamicTransports,
});
