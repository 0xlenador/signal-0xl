import { useState, useEffect, useRef, useCallback } from 'react';

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

const WS_URL = 'wss://arc-testnet.drpc.org';
const DEFAULT_FINALITY_MS = 2000;
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

export function useNetworkStats(): INetworkStats {
  const [stats, setStats] = useState<INetworkStats>({
    gasPrice: '...',
    blockTime: '...',
    totalBlocks: '...',
    totalTxs: '...',
    isLoading: true,
    isError: false,
    history: {
      gas: [],
      time: [],
      blocks: [],
      txs: []
    }
  });

  const wsRef = useRef<WebSocket | null>(null);
  const prevTimestampRef = useRef<number | null>(null);
  const finalityBufferRef = useRef<number[]>([]);
  const latestProcessedBlockRef = useRef<number>(0);
  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const processBlockHeader = useCallback((header: Record<string, string>, ws: WebSocket) => {
    if (!mountedRef.current) return;

    const blockNumber = header.number ? hexToNumber(header.number) : 0;
    
    // Gas Cost
    const baseFeePerGas = header.baseFeePerGas ? hexToBigInt(header.baseFeePerGas) : 0n;
    const costWei = baseFeePerGas * 21000n;
    const intermediate = costWei / 10n ** 12n;
    const gasCost = Number(intermediate) / 1e6;
    const gasCostStr = gasCost < 0.0001 ? '<0.0001' : gasCost.toFixed(4);

    // Block Time (Average)
    // Para redes con tiempos de bloque < 1s (como ARC con 0.5s), el timestamp del header (EVM) 
    // viene en segundos enteros, lo que genera saltos de 0s a 1s.
    // Usamos el tiempo local de llegada del WebSocket para mayor precisión.
    const localNow = performance.now();
    const prev = prevTimestampRef.current;
    
    // Si es el primer bloque, o si hubo un salto irreal por inactividad de pestaña (> 5s), asumimos 500ms
    let finalityMs = 500;
    if (prev !== null) {
      const delta = localNow - prev;
      finalityMs = delta > 5000 ? 500 : delta;
    }
    prevTimestampRef.current = localNow;

    const updatedBuffer = [...finalityBufferRef.current, finalityMs];
    if (updatedBuffer.length > MAX_BUFFER) {
      updatedBuffer.splice(0, updatedBuffer.length - MAX_BUFFER);
    }
    finalityBufferRef.current = updatedBuffer;

    const avgFinalityMs = updatedBuffer.reduce((a, b) => a + b, 0) / updatedBuffer.length;
    const blockTimeMs = Math.round(avgFinalityMs).toString();

    // Actualizamos las métricas instantáneas y el historial
    setStats(prevStats => {
      // Usamos el último valor de txs conocido como "placeholder" para no perder sincronía de longitud
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

    // Solicitamos la cantidad de TXS por el MISMO WebSocket
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: blockNumber, // ID único = blockNumber
        method: 'eth_getBlockTransactionCountByNumber',
        params: [header.number],
      }));
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    if (wsRef.current) {
      try { wsRef.current.close(); } catch { /* ignore */ }
      wsRef.current = null;
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }
      backoffRef.current = INITIAL_BACKOFF_MS;
      setStats(prev => ({ ...prev, isError: false }));
      
      // Suscripción al evento newHeads (ID fijo 1)
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_subscribe',
        params: ['newHeads'],
      }));
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(event.data as string);
        
        // 1. Es un evento de suscripción (Nuevo Bloque)
        if (data.method === 'eth_subscription' && data.params?.result) {
          const header = data.params.result;
          const blockNumber = header.number ? hexToNumber(header.number) : 0;
          
          if (blockNumber >= latestProcessedBlockRef.current) {
            latestProcessedBlockRef.current = blockNumber;
            processBlockHeader(header, ws);
          }
        } 
        // 2. Es la respuesta a nuestra petición de Transacciones (ID = BlockNumber > 1)
        else if (data.id && typeof data.id === 'number' && data.id > 1) {
          const blockNumber = data.id;
          
          if (blockNumber >= latestProcessedBlockRef.current) {
            const txCount = data.result ? hexToNumber(data.result) : 0;
            setStats(prev => {
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
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStats(prev => ({ ...prev, isError: true }));
      scheduleReconnect();
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setStats(prev => ({ ...prev, isError: true }));
    };
  }, [processBlockHeader]);

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

    reconnectTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      connect();
    }, backoffRef.current);

    backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        try { wsRef.current.close(); } catch { /* ignore */ }
        wsRef.current = null;
      }
    };
  }, [connect]);

  return stats;
}
