import { defineChain } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
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
});
