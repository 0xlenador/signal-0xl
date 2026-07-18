import { createEthersAdapterFromProvider } from "@circle-fin/adapter-ethers-v6";
import { UnifiedBalanceKit } from "@circle-fin/unified-balance-kit";
import { getProvider } from "./wallet.js";

let kit = null;
let ethersAdapter = null;

export async function initAppKit() {
    try {
        kit = new UnifiedBalanceKit();
        const provider = getProvider();
        // Fallback or generic initialization if getProvider returns browser provider
        ethersAdapter = createEthersAdapterFromProvider(provider);
        console.log("Unified Balance Kit inicializado.");
    } catch(e) {
        console.error("Error inicializando App Kit:", e);
    }
}

export async function depositFromBase() {
    if (!kit || !ethersAdapter) throw new Error("Kit no inicializado");
    const result = await kit.deposit({
        from: { adapter: ethersAdapter, chain: "Base_Sepolia" },
        amount: "1.00",
        token: "USDC",
    });
    console.log("Depósito desde Base exitoso:", result);
    return result;
}

export async function depositFromArb() {
    if (!kit || !ethersAdapter) throw new Error("Kit no inicializado");
    const result = await kit.deposit({
        from: { adapter: ethersAdapter, chain: "Arbitrum_Sepolia" },
        amount: "1.00",
        token: "USDC",
    });
    console.log("Depósito desde Arbitrum exitoso:", result);
    return result;
}

export async function spendToArc() {
    if (!kit || !ethersAdapter) throw new Error("Kit no inicializado");
    const provider = getProvider();
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    // Gastamos del Unified Balance hacia nuestra propia wallet en Arc Testnet
    const spendResult = await kit.spend({
        amount: "1.00",
        from: { adapter: ethersAdapter },
        to: {
            adapter: ethersAdapter,
            chain: "Arc_Testnet",
            recipientAddress: address,
        },
    });
    console.log("Envío a Arc exitoso:", spendResult);
    return spendResult;
}
