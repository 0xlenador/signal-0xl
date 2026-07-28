import { createPublicClient, http, defineChain, parseAbiItem } from 'viem';

const RPC_URL = 'https://rpc.testnet.arc.network';
const CONTRACT_ADDRESS = '0x108E51F9af4aF2D8CAa1f41E81b91B84B13136'; // Usaremos uno dummy si no lo sé, pero arc.network testnet es lo que está usando.

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] }
  }
});

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(RPC_URL, {
    retryCount: 3,
    retryDelay: 1000,
    timeout: 10000
  })
});

const GMDoneEvent = parseAbiItem('event GMDone(address indexed user, uint256 pointsEarned, uint256 totalPoints, uint256 streak, uint256 forkLevel, bool superGM)');

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function main() {
  const currentBlock = await publicClient.getBlockNumber();
  console.log(`Current block: ${currentBlock}`);

  let iterations = 0;
  while (iterations < 1) {
    let fromBlock = currentBlock;
    let toBlock = currentBlock;
    
    console.log(`Fetching logs from ${fromBlock} to ${toBlock}...`);
    try {
      const logs = await publicClient.getLogs({
        address: [CONTRACT_ADDRESS as `0x${string}`],
        event: GMDoneEvent,
        fromBlock,
        toBlock
      });
      console.log(`Found ${logs.length} logs.`);
    } catch (e: any) {
      console.error(`Error fetching logs: ${e.message}`);
    }
    
    fromBlock = toBlock + 1n;
    iterations++;
    await delay(500);
  }
}

main().catch(console.error);
