const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network', 5042002, { staticNetwork: true });
const abi = ["event GMDone(address indexed user, uint256 pointsEarned, uint256 totalPoints, uint256 streak, uint256 forkLevel, bool superGM)"];
const contract = new ethers.Contract('0x108E51F9af4aF2D8CAa1f41E81b91B84B1304d36', abi, provider);

async function main() {
    console.log("Consultando directamente a la blockchain Arc Testnet...");
    const latest = await provider.getBlockNumber();
    console.log("Bloque actual:", latest);
    
    let from = 53000000;
    const users = new Set();
    let totalEvents = 0;
    
    while(from <= latest) {
        const to = Math.min(from + 2000, latest); // Chunks de 2000 bloques
        try {
            const logs = await contract.queryFilter(contract.filters.GMDone(), from, to);
            for(const log of logs) {
                users.add(log.args[0].toLowerCase());
                totalEvents++;
            }
        } catch(e) {
            console.log("RPC Error (Rate Limit) en el chunk", from, "-", to, "reintentando...");
            await new Promise(r => setTimeout(r, 1000));
            continue; // reintenta el mismo chunk
        }
        from = to + 1;
    }
    
    console.log("====================================");
    console.log("Total de eventos GMDone emitidos:", totalEvents);
    console.log("Total de billeteras únicas:", users.size);
    console.log("Lista de billeteras:", [...users]);
    console.log("====================================");
}
main();
