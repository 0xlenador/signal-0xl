import { useEffect } from 'react';
import { useNodesDataStore } from '@/stores/nodesDataStore';

// Re-export types from their canonical source
export type { ICommitmentNode, IConvictionNode, ILegacyNode } from '@/stores/nodesDataStore';

export interface INodesData {
  commitment: import('@/stores/nodesDataStore').ICommitmentNode | null;
  conviction: import('@/stores/nodesDataStore').IConvictionNode | null;
  legacy: import('@/stores/nodesDataStore').ILegacyNode | null;
  isLoading: boolean;
}

/**
 * Thin wrapper over nodesDataStore. Triggers a refresh when the address
 * changes and subscribes reactively to store updates via Zustand selectors.
 */
export function useNodesData(address: string | null | undefined): INodesData {
  const commitment = useNodesDataStore((s) => s.commitment);
  const conviction = useNodesDataStore((s) => s.conviction);
  const legacy = useNodesDataStore((s) => s.legacy);
  const isLoading = useNodesDataStore((s) => s.isLoading);

  useEffect(() => {
    if (address) {
      void useNodesDataStore.getState().refresh(address);
    }
  }, [address]);

  return { commitment, conviction, legacy, isLoading };
}
