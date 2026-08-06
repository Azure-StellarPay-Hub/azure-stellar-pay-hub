---
title: SDK
description: Usage guide for @stellar-pay/sdk — the type-safe Stellar payment SDK.
---

# SDK

`@stellar-pay/sdk` is the single client used by all apps. It is fully typed and works in
browsers (web app) and Node (scripts, tests, merchants).

## Installation

```bash
pnpm --filter @stellar-pay/sdk build
```

Then import from your package: `import { StellarPayClient } from '@stellar-pay/sdk';`

## Client

```ts
import { StellarPayClient, StellarNetwork } from '@stellar-pay/sdk';

const client = new StellarPayClient({
  apiUrl: 'http://localhost:4000',
  network: StellarNetwork.Testnet,
  horizonUrl: 'https://horizon-testnet.stellar.org',
  publicKey: 'G…',
});
```

### Authentication helpers

```ts
const { challenge } = await client.getChallenge(address);
const session = await client.verifySignature({ address, signature, network });
client.setToken(session.accessToken);
```

### Payments

```ts
const tx = await client.buildPaymentTx({
  destination: 'G…',
  amount: '10',
  asset: 'XLM', // or 'USDC:G…' for custom assets
  memo: 'invoice #42',
});

// sign with the wallet package, then:
const result = await client.submitPayment(tx.signedXdr);
```

The SDK also ships `buildTrustlineTx`, `getBalances`, `listTransactions`, `getRates`,
`createInvoice`, `createPaymentLink`, `getCheckoutQuote`, and merchant/checkout helpers.

## Server-side helpers (`@stellar-pay/sdk/server`)

Used by the NestJS API for fee estimation, simulation, and submission.

## Wallet package

`@stellar-pay/wallet` provides the React context for connecting wallets:

```tsx
import { WalletProvider, useWallet } from '@stellar-pay/wallet';

function App() {
  const { connect, wallet, balances, signTransaction } = useWallet();
  // …
}
```

Supported wallets: **Freighter**, **xBull**, **Albedo** — with automatic detection,
network switching, and reconnect from `localStorage`.
