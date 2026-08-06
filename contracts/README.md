# Soroban Smart Contracts

Soroban (Rust) smart contracts powering the payment platform. Each contract is
self-contained with events, typed errors, unit tests and documentation.

| Contract       | Crates.io name             | Purpose                                        |
| -------------- | -------------------------- | ---------------------------------------------- |
| `payment`      | `stellar-pay-payment`      | Send XLM/assets, batch & split payments        |
| `escrow`       | `stellar-pay-escrow`       | Timed escrow with release & refund             |
| `multisig`     | `stellar-pay-multisig`     | Multi-signature proposal approval & execution  |
| `treasury`     | `stellar-pay-treasury`     | Allowlisted treasury (deposits/withdrawals)    |
| `subscriptions`| `stellar-pay-subscriptions`| Recurring payment plans                        |
| `invoices`     | `stellar-pay-invoices`     | On-chain invoice issuance & payment            |
| `merchant`     | `stellar-pay-merchant`     | Merchant registry + commission & settlement    |
| `rewards`      | `stellar-pay-rewards`      | Loyalty tiers, earn & redeem points            |

## Requirements

- Rust stable (`rustup`)
- `wasm32-unknown-unknown` target: `rustup target add wasm32-unknown-unknown`
- [Soroban CLI](https://soroban.stellar.org/docs/cli) (optional, for `soroban contract build`)

## Build & test

```bash
# Compile all contracts to wasm (optimized release profile)
pnpm contracts:build
# or: cargo build --manifest-path contracts/Cargo.toml --workspace --release --target wasm32-unknown-unknown

# Run all unit tests (native host)
pnpm contracts:test
```

## Deploy

```bash
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/stellar_pay_payment.wasm \
  --source <admin-secret> --network testnet
```

Deployed addresses are recorded in the API database (`Setting` table) so the
backend can route contract calls through the Soroban RPC.

## Security

- All contracts use `require_auth` for privileged operations.
- Amounts are `i128` stroops - never floats.
- Errors are typed (`#[contracterror]`) and events are emitted for every state change.
- See each contract's README for the upgrade strategy and security considerations.
