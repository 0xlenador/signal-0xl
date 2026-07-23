import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, NETWORK } from '../src/lib/config';

// ABI mínimo para interactuar con la función de configuración
const ABI = [
  "function setIdentityRegistry(address _registry) external"
];

// RPC de Arc Testnet
const RPC_URL = NETWORK.rpcUrls[0];

async function main() {
  console.log('🤖 Configuración del Identity Registry para Signal 0xL');
  console.log('======================================================');

  // Lee la clave privada. Idealmente debería venir de variables de entorno,
  // pero para este script la pasaremos como argumento o leeremos un archivo seguro.
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ Error: Falta la clave privada.');
    console.error('Ejecuta el script así: $env:PRIVATE_KEY="tu_clave"; npx tsx scripts/configureRegistry.ts <direccion_del_registro>');
    process.exit(1);
  }

  const registryAddress = process.argv[2];
  if (!registryAddress || !ethers.isAddress(registryAddress)) {
    console.error('❌ Error: Debes proporcionar una dirección válida para el registro como argumento.');
    console.error('Ejemplo: $env:PRIVATE_KEY="..." ; npx tsx scripts/configureRegistry.ts 0x123...abc');
    process.exit(1);
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    console.log(`🔌 Conectado con la wallet administradora: ${wallet.address}`);
    console.log(`📝 Actualizando Identity Registry a: ${registryAddress}`);
    console.log('⏳ Enviando transacción a Arc Testnet...');

    const tx = await contract.setIdentityRegistry(registryAddress);
    console.log(`✅ Transacción enviada! Hash: ${tx.hash}`);
    
    console.log('⏳ Esperando confirmación...');
    const receipt = await tx.wait();
    console.log(`✅ ¡Éxito! Registro configurado correctamente en el bloque ${receipt?.blockNumber}.`);
    
  } catch (err: any) {
    console.error('❌ Falló la transacción:');
    if (err.reason) {
      console.error('Motivo:', err.reason);
    } else {
      console.error(err);
    }
  }
}

main().catch(console.error);
