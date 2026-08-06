# @stellar-pay/types

Shared, dependency-free TypeScript type definitions for the entire Stellar Pay
platform. These types are consumed by the SDK, wallet, UI, API and web apps so
that domain concepts (payments, assets, merchants, invoices…) stay consistent
across the stack.

## Contents

- `common.ts` – shared enums (roles, statuses, networks)
- `user.ts`, `wallet.ts` – users, wallets, sessions, devices, contacts
- `asset.ts` – assets, trustlines, balances
- `payment.ts`, `transaction.ts` – payment intents and transaction records
- `merchant.ts` – merchants, products, invoices, payment links, settlements
- `notification.ts`, `webhook.ts`, `analytics.ts` – supporting domains
- `api.ts` – API envelope + pagination contracts

## Usage

```ts
import type { PaymentIntent, PaymentType } from '@stellar-pay/types';
```
