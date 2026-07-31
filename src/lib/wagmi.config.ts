import { defineChain, fallback, http } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { cookieStorage, createStorage } from 'wagmi';
import { NETWORK } from '@/lib/config';

/**
 * Definición de la cadena Arc Testnet usando los datos de NETWORK en config.ts.
 * Se registra como cadena personalizada para viem/wagmi ya que no existe en el catálogo estándar.
 */
export const arcTestnet = defineChain({
  id: NETWORK.chainId,
  name: NETWORK.name,
  nativeCurrency: {
    name: NETWORK.nativeCurrency.name,
    symbol: NETWORK.nativeCurrency.symbol,
    decimals: NETWORK.nativeCurrency.decimals,
  },
  rpcUrls: {
    default: {
      http: [...NETWORK.rpcUrls],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: NETWORK.blockExplorer,
    },
  },
  testnet: true,
});

/**
 * Configuración central de Wagmi + RainbowKit.
 * - `ssr: true` para compatibilidad con Next.js App Router (previene hydration mismatch).
 * - `projectId` de WalletConnect es requerido por RainbowKit para conectores como WalletConnect.
 *    Se lee desde una variable de entorno, con un fallback de desarrollo.
 */
export const wagmiConfig = getDefaultConfig({
  appName: 'Signal 0xL',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'signal0xl-dev',
  chains: [arcTestnet],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [arcTestnet.id]: fallback([
      // Fast RPCs first (blocked by adblockers → fail instantly with retryCount: 0)
      http(NETWORK.rpcUrls[1], { retryCount: 0 }), // blockdaemon — 100 req/s
      http(NETWORK.rpcUrls[2], { retryCount: 0 }), // drpc       — 100 req/s
      http(NETWORK.rpcUrls[3], { retryCount: 0 }), // quicknode  —   3 req/s
      // Main RPC as final fallback (always available, worth retrying)
      http(NETWORK.rpcUrls[0], { retryCount: 2, retryDelay: 500 }), // arc.network — 1 req/s
    ], { rank: false }),
  },
});
