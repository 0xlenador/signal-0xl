const ethers = require('ethers');
const rpc = 'https://rpc.testnet.arc.network';
const provider = new ethers.JsonRpcProvider(rpc);

const abi10 = [
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"users","outputs":[{"internalType":"uint256","name":"totalPoints","type":"uint256"},{"internalType":"uint256","name":"lastGmDay","type":"uint256"},{"internalType":"uint256","name":"currentStreak","type":"uint256"},{"internalType":"uint256","name":"forkLevel","type":"uint256"},{"internalType":"uint256","name":"gmCount","type":"uint256"},{"internalType":"bool","name":"nodeCommitment","type":"bool"},{"internalType":"bool","name":"nodeConviction","type":"bool"},{"internalType":"bool","name":"nodeLegacy","type":"bool"},{"internalType":"bool","name":"exists","type":"bool"},{"internalType":"uint256","name":"attachedAgentId","type":"uint256"}],"stateMutability":"view","type":"function"}
];

const abi9 = [
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"users","outputs":[{"internalType":"uint256","name":"totalPoints","type":"uint256"},{"internalType":"uint256","name":"lastGmDay","type":"uint256"},{"internalType":"uint256","name":"currentStreak","type":"uint256"},{"internalType":"uint256","name":"forkLevel","type":"uint256"},{"internalType":"uint256","name":"gmCount","type":"uint256"},{"internalType":"bool","name":"nodeCommitment","type":"bool"},{"internalType":"bool","name":"nodeConviction","type":"bool"},{"internalType":"bool","name":"nodeLegacy","type":"bool"},{"internalType":"bool","name":"exists","type":"bool"}],"stateMutability":"view","type":"function"}
];

async function run() {
  const c10 = new ethers.Contract('0x108E51F9af4aF2D8CAa1f41E81b91B84B1304d36', abi10, provider);
  const c9 = new ethers.Contract('0x108E51F9af4aF2D8CAa1f41E81b91B84B1304d36', abi9, provider);
  
  try {
    const res = await c9.users('0x108E51F9af4aF2D8CAa1f41E81b91B84B1304d36');
    console.log("ABI 9 SUCCESS", res);
  } catch(e) {
    console.log("ABI 9 FAILED", e.message);
  }

  try {
    const res = await c10.users('0x108E51F9af4aF2D8CAa1f41E81b91B84B1304d36');
    console.log("ABI 10 SUCCESS", res);
  } catch(e) {
    console.log("ABI 10 FAILED", e.message);
  }
}
run();
