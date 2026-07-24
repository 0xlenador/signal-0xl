const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network', 5042002);
const abi = [
    "function getUserCount() external view returns (uint256)",
    "function getUsersPaginated(uint256 offset, uint256 limit) external view returns (address[] addrs, uint256[] points, uint256[] forks)"
];
const contract = new ethers.Contract('0x108E51F9af4aF2D8CAa1f41E81b91B84B1304d36', abi, provider);

async function main() {
    console.log("Verificando la verdad absoluta en el estado del contrato inteligente...");
    const count = await contract.getUserCount();
    console.log("Total de usuarios en userList:", count.toString());
    
    if (count > 0) {
        const data = await contract.getUsersPaginated(0, count);
        console.log("Usuarios:");
        for(let i=0; i<data.addrs.length; i++) {
            console.log(`- ${data.addrs[i]} (Points: ${data.points[i]})`);
        }
    }
}
main();
