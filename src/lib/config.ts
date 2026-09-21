export interface RpcEndpoint {
  url: string;
  rateLimit: number;
  isMain?: boolean;
}

export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  name: string;
  slug: string;
  rpcUrls: string[];
  wsUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
  contractAddress: `0x${string}`;
  indexerUrl: string;
  blockscoutApi: string;
  iconUrl?: string;
  httpRpcEndpoints: RpcEndpoint[];
}

export const EVM_NETWORKS: Record<number, NetworkConfig> = {
  // ARC Testnet
  5042002: {
    chainId: 5042002,
    chainIdHex: '0x4cef52',
    name: 'Arc Testnet',
    slug: 'arc-testnet',
    rpcUrls: [
      'https://arc-testnet.drpc.org',
      'https://rpc.blockdaemon.testnet.arc.io',
      'https://rpc.drpc.testnet.arc.io',
      'https://rpc.quicknode.testnet.arc.io'
    ],
    wsUrls: [
      'wss://arc-testnet.drpc.org'
    ],
    nativeCurrency: {
      name: 'USDC',
      symbol: 'USDC',
      decimals: 18,
    },
    blockExplorer: 'https://testnet.arcscan.app',
    contractAddress: '0x108E51F9af4aF2D8CAa1f41E81b91B84B1304d36',
    indexerUrl: process.env.NEXT_PUBLIC_WORKER_URL || "https://signal0xl-ranking.ellenador-eth.workers.dev",
    blockscoutApi: 'https://testnet.arcscan.app/api/v2',
    iconUrl: '/assets/arc-logo.jpg',
    httpRpcEndpoints: [
      { url: 'https://arc-testnet.drpc.org', rateLimit: 200, isMain: true },  
      { url: 'https://rpc.blockdaemon.testnet.arc.io', rateLimit: 100 },
      { url: 'https://rpc.drpc.testnet.arc.io', rateLimit: 100 },
      { url: 'https://rpc.quicknode.testnet.arc.io', rateLimit: 3 }
    ]
  },
  
  // ARC Mainnet (Draft - To be updated with real Mainnet data)
  5042: {
    chainId: 5042,
    chainIdHex: '0x13b2',
    name: 'Arc Mainnet',
    slug: 'arc-mainnet',
    rpcUrls: [
      'https://rpc.mainnet.arc.io'
    ],
    wsUrls: [
      'wss://rpc.blockdaemon.mainnet.arc.io/websocket',
      'wss://rpc.quicknode.mainnet.arc.io'
    ],
    nativeCurrency: {
      name: 'USDC',
      symbol: 'USDC',
      decimals: 18,
    },
    blockExplorer: 'https://arc.etherscan.io/',
    contractAddress: '0x9582A2D84b762719217814B93E33a9c4E2545c8b', // Update when deployed
    indexerUrl: process.env.NEXT_PUBLIC_MAINNET_WORKER_URL || "https://signal0xl-ranking-mainnet.ellenador-eth.workers.dev",
    blockscoutApi: 'https://arcscan.app/api/v2',
    iconUrl: '/assets/arc-logo.jpg',
    httpRpcEndpoints: [
      { url: 'https://rpc.blockdaemon.mainnet.arc.io', rateLimit: 100, isMain: true },
      { url: 'https://rpc.drpc.mainnet.arc.io', rateLimit: 100 },
      { url: 'https://rpc.quicknode.mainnet.arc.io', rateLimit: 100 }
    ]
  }
} as const;

export const SUPPORTED_CHAIN_IDS = Object.keys(EVM_NETWORKS).map(Number);
export const DEFAULT_CHAIN_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID) || 5042002;


export const CONTRACT_ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"agentId","type":"uint256"}],"name":"AgentAttached","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newCost","type":"uint256"}],"name":"BaseCostUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"pointsEarned","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"totalPoints","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"streak","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"forkLevel","type":"uint256"},{"indexed":false,"internalType":"bool","name":"superGM","type":"bool"}],"name":"GMDone","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint8","name":"nodeId","type":"uint8"},{"indexed":false,"internalType":"bool","name":"byStreak","type":"bool"}],"name":"NodeActivated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"}],"name":"StreakReset","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdrawn","type":"event"},{"inputs":[{"internalType":"uint8","name":"nodeId","type":"uint8"}],"name":"activateNodeByStreak","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint8","name":"nodeId","type":"uint8"}],"name":"activateNodeInstant","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"agentId","type":"uint256"}],"name":"attachAgent","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"baseGMCost","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint8","name":"nodeId","type":"uint8"},{"internalType":"address","name":"_user","type":"address"}],"name":"canActivateByStreak","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"doGM","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"getCurrentUTCDay","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"getDaysSinceLastGM","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint8","name":"nodeId","type":"uint8"},{"internalType":"address","name":"_user","type":"address"}],"name":"getNodeInstantCost","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getUserCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"hasRunestone","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"identityRegistry","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"resetToVIP","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_newCost","type":"uint256"}],"name":"setBaseGMCost","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_registry","type":"address"}],"name":"setIdentityRegistry","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"userList","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"users","outputs":[{"internalType":"uint256","name":"totalPoints","type":"uint256"},{"internalType":"uint256","name":"lastGmDay","type":"uint256"},{"internalType":"uint256","name":"currentStreak","type":"uint256"},{"internalType":"uint256","name":"forkLevel","type":"uint256"},{"internalType":"uint256","name":"gmCount","type":"uint256"},{"internalType":"bool","name":"nodeCommitment","type":"bool"},{"internalType":"bool","name":"nodeConviction","type":"bool"},{"internalType":"bool","name":"nodeLegacy","type":"bool"},{"internalType":"bool","name":"exists","type":"bool"},{"internalType":"uint256","name":"attachedAgentId","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"getUserData","outputs":[{"internalType":"uint256","name":"totalPoints","type":"uint256"},{"internalType":"uint256","name":"lastGmDay","type":"uint256"},{"internalType":"uint256","name":"currentStreak","type":"uint256"},{"internalType":"uint256","name":"forkLevel","type":"uint256"},{"internalType":"uint256","name":"gmCount","type":"uint256"},{"internalType":"bool","name":"nodeCommitment","type":"bool"},{"internalType":"bool","name":"nodeConviction","type":"bool"},{"internalType":"bool","name":"nodeLegacy","type":"bool"},{"internalType":"bool","name":"exists","type":"bool"},{"internalType":"uint256","name":"attachedAgentId","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"getGMCost","outputs":[{"internalType":"uint256","name":"gmCost","type":"uint256"},{"internalType":"uint256","name":"debtCost","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"offset","type":"uint256"},{"internalType":"uint256","name":"limit","type":"uint256"}],"name":"getUsersPaginated","outputs":[{"internalType":"address[]","name":"addrs","type":"address[]"},{"internalType":"uint256[]","name":"points","type":"uint256[]"},{"internalType":"uint256[]","name":"forks","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"count","type":"uint256"}],"name":"getTopUsers","outputs":[{"internalType":"address[]","name":"addrs","type":"address[]"},{"internalType":"uint256[]","name":"points","type":"uint256[]"},{"internalType":"uint256[]","name":"forks","type":"uint256[]"}],"stateMutability":"view","type":"function"}] as const;

export const CONSTANTS = {
  DECIMALS: 18,
  BASE_GM_COST_WEI: 10000000000000000n,
  TOTAL_SUPPLY: 100000000,
  NODE_STREAK_REQUIREMENTS: { 1: 3, 2: 12, 3: 25 },
  NODE_INSTANT_MULTIPLIERS: { 1: 51, 2: 126, 3: 501 },
  LEADERBOARD_DISPLAY_LIMIT: 50,
} as const;
