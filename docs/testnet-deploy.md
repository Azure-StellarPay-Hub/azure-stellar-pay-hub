---
title: Testnet Deployment
description: Complete guide to deploying Azure StellarPay Hub to Stellar testnet.
---

# Testnet Deployment

This guide walks through deploying the full platform — smart contracts, API, database,
and frontend apps — to Stellar testnet.

## Prerequisites

| Requirement | How to get it |
|-------------|---------------|
| **Stellar testnet account** | Create at [laboratory.stellar.org](https://laboratory.stellar.org/#create-account?network=test) |
| **Funded with XLM** | Fund at [laboratory.stellar.org](https://laboratory.stellar.org/#create-account?network=test) or use Friendbot: `curl "https://friendbot.stellar.org?addr=G..."` |
| **Secret key** | Save the secret key (starts with `S...`) — you'll need it for contract deployment |
| **Node.js ≥ 20.9** | `nvm install && nvm use` |
| **pnpm ≥ 9** | `corepack enable` |
| **Rust + wasm32 target** | `rustup target add wasm32-unknown-unknown` |
| **soroban-cli** | `cargo install soroban-cli` |
| **Docker** | For local Postgres + Redis |

## Quick Deploy (One Command)

```bash
# Set your testnet account secret key
export STELLAR_SECRET_KEY=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Run the deploy script
bash scripts/deploy-testnet.sh
```

The script will:
1. Verify prerequisites (soroban-cli, Node, pnpm, Docker, funded account)
2. Install dependencies
3. Start Postgres + Redis
4. Create and seed the database
5. Build all 8 Soroban contracts
6. Deploy each contract to testnet
7. Save contract addresses to `.deployed-contracts.env`
8. Create `.env.testnet` with all configuration
9. Build the API and frontend apps
10. Provide instructions to start the API

After the script completes:

```bash
cp .env.testnet .env        # Use the generated config
pnpm dev:api                # Start the API on testnet
```

## Manual Deployment

### 1. Configure Environment

```bash
pnpm generate:env           # Creates .env from templates
```

Edit `.env` and set:

```env
STELLAR_NETWORK=testnet
HORIZON_URL=https://horizon-testnet.stellar.org
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015

JWT_SECRET=<generate a strong random secret>
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stellar_pay?schema=public
```

### 2. Start Infrastructure

```bash
pnpm docker:up              # Postgres + Redis
```

### 3. Set Up Database

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed                # Creates admin user + demo data
```

### 4. Build Contracts

```bash
pnpm contracts:build
```

### 5. Deploy Contracts

```bash
# Deploy each contract to testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_pay_payment.wasm \
  --source SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  --network testnet

# Repeat for: escrow, multisig, treasury, subscriptions, invoices, merchant, rewards

# Save the returned addresses — you'll need them for the API
```

### 6. Initialize Contracts (if needed)

Some contracts require initialization after deployment:

```bash
# Example: initialize multisig with signers and threshold
soroban contract invoke \
  --id <MULTISIG_ADDRESS> \
  --source S... \
  --network testnet \
  -- initialize --signers '["G...","G..."]' --threshold 2
```

### 7. Record Contract Addresses

Add deployed addresses to your `.env`:

```env
CONTRACT_STELLAR_PAY_PAYMENT=C...
CONTRACT_STELLAR_PAY_ESCROW=C...
CONTRACT_STELLAR_PAY_MULTISIG=C...
CONTRACT_STELLAR_PAY_TREASURY=C...
CONTRACT_STELLAR_PAY_SUBSCRIPTIONS=C...
CONTRACT_STELLAR_PAY_INVOICES=C...
CONTRACT_STELLAR_PAY_MERCHANT=C...
CONTRACT_STELLAR_PAY_REWARDS=C...
```

### 8. Build and Start

```bash
pnpm build:packages
pnpm build:apps
pnpm dev:api                # API on http://localhost:4000
```

## Verify Deployment

```bash
# Health check
curl http://localhost:4000/api/health

# Expected response:
# { "status": "ok", "network": "testnet", "version": "0.1.0" }

# Fund a test account
curl "https://friendbot.stellar.org?addr=G..."

# Create a payment via the API
curl -X POST http://localhost:4000/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"to":"G...","amount":"10","assetCode":"XLM"}'
```

## Funding Test Accounts

Stellar testnet uses Friendbot to fund accounts:

```bash
# Fund with 10,000 XLM
curl "https://friendbot.stellar.org?addr=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

You can also use the [Stellar Laboratory](https://laboratory.stellar.org/#create-account?network=test):
1. Select "Test" network
2. Click "Create Account"
3. Fund with Friendbot

## Switching to Mainnet

When ready for production, update these values:

```env
STELLAR_NETWORK=public
HORIZON_URL=https://horizon.stellar.org
SOROBAN_RPC_URL=https://soroban.stellar.org
NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015
```

Then re-deploy contracts to mainnet and update the contract addresses in `.env`.

## Troubleshooting

### "soroban: command not found"

```bash
cargo install soroban-cli
# Or: npm install -g soroban-cli
```

### "Account not found" during deploy

Your testnet account needs to exist and be funded before deploying contracts.
Visit [laboratory.stellar.org](https://laboratory.stellar.org/#create-account?network=test)
to create and fund your account.

### "Insufficient balance" during deploy

Each contract deployment costs a small fee in XLM. Make sure your account
has at least 100 XLM. Fund with Friendbot:

```bash
curl "https://friendbot.stellar.org?addr=G..."
```

### Database connection errors

Make sure Docker is running and Postgres is healthy:

```bash
docker ps | grep postgres
pnpm docker:down && pnpm docker:up  # restart if needed
```

### Contract build failures

```bash
rustup update stable
rustup target add wasm32-unknown-unknown
pnpm contracts:build
```
