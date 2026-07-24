const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network', 5042002);
const abi = [
    "function getUserCount() external view returns (uint256)",
    "function userList(uint256) external view returns (address)",
    "function users(address) external view returns (uint256 totalPoints, uint256 lastGmDay, uint256 currentStreak, uint256 forkLevel, uint256 gmCount, bool nodeCommitment, bool nodeConviction, bool nodeLegacy, bool exists, uint256 attachedAgentId)"
];
const contract = new ethers.Contract('0x108E51F9af4aF2D8CAa1f41E81b91B84B1304d36', abi, provider);

async function main() {
    const count = await contract.getUserCount();
    console.log("Total de usuarios en userList:", count.toString());
    
    for(let i=0; i<count; i++) {
        const addr = await contract.userList(i);
        const userData = await contract.users(addr);
        console.log(`${i+1}. ${addr} | Points: ${userData.totalPoints.toString()} | Streak: ${userData.currentStreak.toString()}`);
        await new Promise(r => setTimeout(r, 200)); // anti rate-limit
    }
}
main();
