import { useState, useEffect } from 'react';
import { getNextWsRpc } from '@/lib/rpcEngine';
import { DEFAULT_CHAIN_ID } from '@/lib/config';

export interface INetworkStats {
  gasPrice: string;
  blockTime: string;
  totalBlocks: string;
  totalTxs: string;
  isLoading: boolean;
  isError: boolean;
  history: {
    gas: number[];
    time: number[];
    blocks: number[];
    txs: number[];
  };
}

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 10000;
const MAX_BUFFER = 60;
const MAX_HISTORY = 20;

function hexToNumber(hex: string): number {
  return Number(hex);
}

function hexToBigInt(hex: string): bigint {
  return BigInt(hex);
}

const defaultStats: INetworkStats = {
  gasPrice: '...',
  blockTime: '...',
  totalBlocks: '...',
  totalTxs: '...',
  isLoading: true,
  isError: false,
  history: { gas: [], time: [], blocks: [], txs: [] }
};

class NetworkStatsManager {
  private ws: WebSocket | null = null;
  public stats: INetworkStats = { ...defaultStats };
  private subscribers: Set<(stats: INetworkStats) => void> = new Set();
  
  private prevTimestamp: number | null = null;
  private finalityBuffer: number[] = [];
  private latestProcessedBlock: number = 0;
  private backoffMs: number = INITIAL_BACKOFF_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  
  private fallbackTimer: ReturnType<typeof setInterval> | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private isFallbackMode = false;
  
  constructor(private chainId: number) {}

  public subscribe = (callback: (stats: INetworkStats) => void) => {
    this.subscribers.add(callback);
    callback(this.stats);
    
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
      this.disconnectTimeout = null;
    }
    
    if (this.subscribers.size === 1 && !this.ws && !this.isFallbackMode) {
      this.connect();
    }

    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.disconnectTimeout = setTimeout(() => {
          if (this.subscribers.size === 0) {
            this.disconnect();
          }
        }, 5000);
      }
    };
  }

  private updateStats = (updater: (prev: INetworkStats) => INetworkStats) => {
    this.stats = updater(this.stats);
    this.subscribers.forEach(cb => cb(this.stats));
  }

  private startFallbackMode = () => {
    if (this.isFallbackMode) return;
    this.isFallbackMode = true;
    console.warn(`[NetworkStats] WS blocked/timeout. Switching to robust HTTP polling for Chain ${this.chainId}`);
    this.updateStats(prev => ({ ...prev, isError: false })); // Don't show error, just use HTTP
    
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }

    this.pollHttp();
    this.fallbackTimer = setInterval(() => {
      if (this.subscribers.size > 0) {
        this.pollHttp();
      }
    }, 4000); // Poll every 4 seconds on fallback
  }

  private pollHttp = async () => {
    try {
      const { getAvailableHttpRpcs, fetchWithFallback } = await import('@/lib/rpcEngine');
      const urls = getAvailableHttpRpcs(this.chainId);
      if (!urls || urls.length === 0) return;

      const res = await fetchWithFallback(urls, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBlockByNumber',
          params: ['latest', false]
        })
      });

      const data = await res.json();
      if (data.result) {
        const blockNumber = data.result.number ? hexToNumber(data.result.number) : 0;
        if (blockNumber >= this.latestProcessedBlock) {
          this.latestProcessedBlock = blockNumber;
          this.processBlockHeader(data.result, null);
        }
      }
    } catch (e) {
      console.error("[NetworkStats] HTTP Fallback error", e);
    }
  }

  private processBlockHeader = (header: Record<string, string>, ws: WebSocket | null) => {
    // Clear connection timeout since we received data
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    const blockNumber = header.number ? hexToNumber(header.number) : 0;
    const baseFeePerGas = header.baseFeePerGas ? hexToBigInt(header.baseFeePerGas) : 0n;
    const costWei = baseFeePerGas * 21000n;
    const intermediate = costWei / 10n ** 12n;
    const gasCost = Number(intermediate) / 1e6;
    const gasCostStr = gasCost < 0.0001 ? '<0.0001' : gasCost.toFixed(4);

    const localNow = performance.now();
    const prev = this.prevTimestamp;
    
    let finalityMs = 500;
    if (prev !== null) {
      const delta = localNow - prev;
      finalityMs = delta > 5000 ? 500 : delta;
    }
    this.prevTimestamp = localNow;

    const updatedBuffer = [...this.finalityBuffer, finalityMs];
    if (updatedBuffer.length > MAX_BUFFER) {
      updatedBuffer.splice(0, updatedBuffer.length - MAX_BUFFER);
    }
    this.finalityBuffer = updatedBuffer;

    const avgFinalityMs = updatedBuffer.reduce((a, b) => a + b, 0) / updatedBuffer.length;
    const blockTimeMs = Math.round(avgFinalityMs).toString();

    this.updateStats(prevStats => {
      const lastTxCount = prevStats.history.txs.length > 0 
        ? prevStats.history.txs[prevStats.history.txs.length - 1] 
        : 0;

      return {
        ...prevStats,
        gasPrice: gasCostStr,
        blockTime: blockTimeMs,
        totalBlocks: blockNumber.toLocaleString(),
        isLoading: false,
        isError: false,
        history: {
          gas: [...prevStats.history.gas, gasCost].slice(-MAX_HISTORY),
          time: [...prevStats.history.time, Math.round(avgFinalityMs)].slice(-MAX_HISTORY),
          blocks: [...prevStats.history.blocks, blockNumber].slice(-MAX_HISTORY),
          txs: [...prevStats.history.txs, lastTxCount].slice(-MAX_HISTORY),
        }
      };
    });

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: blockNumber,
        method: 'eth_getBlockTransactionCountByNumber',
        params: [header.number],
      }));
    } else if (this.isFallbackMode) {
      this.fetchTxCountHttp(header.number, blockNumber);
    }
  }

  private fetchTxCountHttp = async (hexNumber: string, blockId: number) => {
    try {
      const { getAvailableHttpRpcs, fetchWithFallback } = await import('@/lib/rpcEngine');
      const urls = getAvailableHttpRpcs(this.chainId);
      if (!urls || urls.length === 0) return;
      
      const res = await fetchWithFallback(urls, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: blockId,
          method: 'eth_getBlockTransactionCountByNumber',
          params: [hexNumber]
        })
      });
      const data = await res.json();
      if (data.result) {
        const txCount = hexToNumber(data.result);
        this.updateStats(prev => {
          const txsCopy = [...prev.history.txs];
          const blockIndex = prev.history.blocks.indexOf(blockId);
          if (blockIndex !== -1) {
            txsCopy[blockIndex] = txCount;
          }
          return { ...prev, totalTxs: txCount.toString(), history: { ...prev.history, txs: txsCopy } };
        });
      }
    } catch {}
  }

  private connect = () => {
    if (this.ws) {
      try { this.ws.close(); } catch { }
      this.ws = null;
    }

    const wsUrl = getNextWsRpc(this.chainId);
    if (!wsUrl) {
      this.startFallbackMode();
      return;
    }

    const ws = new WebSocket(wsUrl);
    this.ws = ws;

    // Set a strict 8-second timeout for the WebSocket to connect and send us the first block
    if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
    this.connectionTimeout = setTimeout(() => {
      if (this.stats.isLoading) {
        this.startFallbackMode();
      }
    }, 8000);

    ws.onopen = () => {
      if (this.ws !== ws) return;
      this.backoffMs = INITIAL_BACKOFF_MS;
      this.updateStats(prev => ({ ...prev, isError: false }));
      
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_subscribe',
        params: ['newHeads'],
      }));
    };

    ws.onmessage = (event: MessageEvent) => {
      if (this.ws !== ws) return;
      try {
        const data = JSON.parse(event.data as string);
        
        if (data.method === 'eth_subscription' && data.params?.result) {
          const header = data.params.result;
          const blockNumber = header.number ? hexToNumber(header.number) : 0;
          
          if (blockNumber >= this.latestProcessedBlock) {
            this.latestProcessedBlock = blockNumber;
            this.processBlockHeader(header, ws);
          }
        } 
        else if (data.id && typeof data.id === 'number' && data.id > 1) {
          const blockNumber = data.id;
          
          if (blockNumber >= this.latestProcessedBlock) {
            const txCount = data.result ? hexToNumber(data.result) : 0;
            this.updateStats(prev => {
              const txsCopy = [...prev.history.txs];
              const blockIndex = prev.history.blocks.indexOf(blockNumber);
              if (blockIndex !== -1) {
                txsCopy[blockIndex] = txCount;
              }
              
              return { 
                ...prev, 
                totalTxs: txCount.toString(),
                history: {
                  ...prev.history,
                  txs: txsCopy
                }
              };
            });
          }
        }
      } catch { }
    };

    ws.onclose = () => {
      if (this.ws !== ws) return;
      if (this.stats.isLoading) {
        // Closed before receiving data
        this.startFallbackMode();
      } else {
        this.updateStats(prev => ({ ...prev, isError: true }));
        this.scheduleReconnect();
      }
    };

    ws.onerror = () => {
      if (this.ws !== ws) return;
      if (this.stats.isLoading) {
        this.startFallbackMode();
      } else {
        this.updateStats(prev => ({ ...prev, isError: true }));
      }
    };
  }

  private scheduleReconnect = () => {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.subscribers.size === 0 || this.isFallbackMode) return;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.backoffMs);

    this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS);
  }

  private disconnect = () => {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.fallbackTimer) {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    this.isFallbackMode = false;
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
  }
}

const managers: Record<number, NetworkStatsManager> = {};

function getManager(chainId: number) {
  if (!managers[chainId]) {
    managers[chainId] = new NetworkStatsManager(chainId);
  }
  return managers[chainId];
}

export function useNetworkStats(chainId: number = DEFAULT_CHAIN_ID): INetworkStats {
  const manager = getManager(chainId);
  const [stats, setStats] = useState<INetworkStats>(manager.stats);

  useEffect(() => {
    return manager.subscribe(setStats);
  }, [manager]);

  return stats;
}

