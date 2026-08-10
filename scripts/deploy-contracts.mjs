// deploy-contracts.mjs — Deploy Soroban contracts to Stellar testnet
import {
  Server,
  TransactionBuilder,
  Operation,
  Networks,
  Keypair,
  nativeToScVal,
  xdr,
} from 'soroban-client';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const SECRET_KEY = process.env.STELLAR_SECRET_KEY;
if (!SECRET_KEY) {
  console.error('Set STELLAR_SECRET_KEY environment variable');
  process.exit(1);
}

const RPC_URL = 'https://soroban-testnet.stellar.org';
const keypair = Keypair.fromSecret(SECRET_KEY);
const publicKey = keypair.publicKey();
const server = new Server(RPC_URL);

const CONTRACTS = [
  'stellar_pay_payment',
  'stellar_pay_escrow',
  'stellar_pay_multisig',
  'stellar_pay_treasury',
  'stellar_pay_subscriptions',
  'stellar_pay_invoices',
  'stellar_pay_merchant',
  'stellar_pay_rewards',
];

const WASM_DIR = resolve(process.cwd(), 'contracts/target/wasm32-unknown-unknown/release');
const OUTPUT_FILE = resolve(process.cwd(), '.deployed-contracts.env');

async function getAccount() {
  return server.getAccount(publicKey);
}

async function deploy(name, wasmPath) {
  console.log(`\n📦 ${name}...`);
  const wasmBytes = readFileSync(wasmPath);
  console.log(`   WASM: ${(wasmBytes.length / 1024).toFixed(1)} KB`);

  const account = await getAccount();

  // Build upload + create contract transaction
  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeUploadContractWasm(wasmBytes),
        auth: [],
      }),
    )
    .addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeCreateContractV2({
          contractIdPreimage: xdr.ContractIdPreimage.contractIdPreimageFromAddress(
            xdr.ContractIdPreimageFromAddress.fromXDR(
              {
                address: xdr.ScAddress.scAddressTypeContract(wasmBytes.slice(0, 32)),
                salt: Buffer.alloc(32),
              },
              'base64',
            ),
          ),
          // Use the current source account ID + salt as preimage
        }),
        auth: [],
      }),
    )
    .setTimeout(300)
    .build();

  console.log('   Simulating...');
  const sim = await server.simulateTransaction(tx);
  if (sim.error) {
    throw new Error(`Simulation failed: ${JSON.stringify(sim.error)}`);
  }

  console.log('   Sending...');
  const prepared = await server.prepareTransaction(tx);
  prepared.sign(keypair);
  const result = await server.sendTransaction(prepared);

  if (result.status === 'ERROR') {
    throw new Error(
      `Transaction failed: ${result.errorResult?.result() || JSON.stringify(result)}`,
    );
  }

  // Wait for confirmation and get contract ID
  console.log('   Waiting for confirmation...');
  let contractId = null;
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const txInfo = await server.getTransaction(result.hash);
    if (txInfo.status === 'SUCCESS') {
      // Extract contract ID from result
      if (txInfo.returnValue && txInfo.returnValue._value) {
        const buf = txInfo.returnValue._value;
        if (Buffer.isBuffer(buf)) {
          contractId = 'C' + Buffer.from(buf).toString('hex').slice(0, 55);
        }
      }
      console.log(`   ✅ ${contractId || result.hash}`);
      return contractId || result.hash;
    }
    if (txInfo.status === 'FAILED') {
      throw new Error(`Transaction failed`);
    }
  }
  throw new Error(`Timeout waiting for confirmation`);
}

async function main() {
  console.log(`🚀 Deploying 8 Soroban contracts to testnet`);
  console.log(`   Deployer: ${publicKey}\n`);

  const lines = [`# Deployed contract addresses — ${new Date().toISOString()}`];

  for (const name of CONTRACTS) {
    const wasmPath = resolve(WASM_DIR, `${name}.wasm`);
    try {
      const address = await deploy(name, wasmPath);
      lines.push(`CONTRACT_${name.toUpperCase()}=${address}`);
    } catch (err) {
      console.error(`   ❌ ${err.message}`);
      lines.push(`# CONTRACT_${name.toUpperCase()}=FAILED`);
    }
  }

  writeFileSync(OUTPUT_FILE, lines.join('\n') + '\n');
  console.log(`\n📝 ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
