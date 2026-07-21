import { createEthersAdapterFromProvider } from "@circle-fin/adapter-ethers-v6";
import { UnifiedBalanceKit } from "@circle-fin/unified-balance-kit";
import { getProvider } from "./wallet.js";

let kit = null;
let ethersAdapter = null;

export async function initAppKit() {
    try {
        kit = new UnifiedBalanceKit();
        // createEthersAdapterFromProvider espera un objeto con el EIP-1193 provider (ej. window.ethereum)
        if (!window.ethereum) throw new Error("No window.ethereum detected");
        ethersAdapter = await createEthersAdapterFromProvider({ provider: window.ethereum });
        console.log("Unified Balance Kit inicializado.");
    } catch(e) {
        console.error("Error inicializando App Kit:", e);
    }
}

export async function depositFromBase() {
    if (!kit || !ethersAdapter) throw new Error("Unified Balance Kit no inicializado.");
    try {
        const result = await kit.deposit({
            from: { adapter: ethersAdapter, chain: "Base_Sepolia" },
            amount: "1.00",
            token: "USDC",
        });
        console.log("Depósito desde Base exitoso:", result);
        return result;
    } catch (err) {
        console.error("Error en SDK de Circle (depositFromBase):", err);
        throw new Error("Fallo en la comunicación con Base Sepolia. Verifica que tengas balance y estés en la red correcta.");
    }
}

export async function depositFromArb() {
    if (!kit || !ethersAdapter) throw new Error("Unified Balance Kit no inicializado.");
    try {
        const result = await kit.deposit({
            from: { adapter: ethersAdapter, chain: "Arbitrum_Sepolia" },
            amount: "1.00",
            token: "USDC",
        });
        console.log("Depósito desde Arbitrum exitoso:", result);
        return result;
    } catch (err) {
        console.error("Error en SDK de Circle (depositFromArb):", err);
        throw new Error("Fallo en la comunicación con Arbitrum Sepolia. Verifica que tengas balance y estés en la red correcta.");
    }
}

export async function spendToArc() {
    if (!kit || !ethersAdapter) throw new Error("Unified Balance Kit no inicializado. Verifica tu conexión.");
    
    const provider = getProvider();
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    try {
        // Intentamos gastar del Unified Balance hacia nuestra propia wallet en Arc Testnet
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
    } catch (err) {
        console.error("Error en SDK de Circle (spendToArc):", err);
        
        // Verificamos si el error proviene de una cadena no soportada por el SDK
        const errMsg = err.message || "";
        if (errMsg.includes("chain") || errMsg.includes("unsupported") || errMsg.includes("Arc_Testnet")) {
            throw new Error("El puente CCTP hacia Arc Testnet se encuentra en fase de espera de despliegue oficial por parte de Circle.");
        }
        
        throw new Error("Error interno del puente de liquidez. Por favor, intenta de nuevo más tarde.");
    }
}
