# @stellar-pay/sdk

The public client SDK, consumed by the web, admin and explorer apps:

- **`ApiClient`** – fully typed HTTP client for the NestJS API (auth, payments,
  wallet, merchants, checkout, admin, notifications)
- **`StellarNetwork`** – Horizon-backed helpers: balances, payment transaction
  building, changeTrust (trustlines), submission & fee estimation
- Re-exports all shared types from `@stellar-pay/types`

```ts
import { ApiClient, StellarNetwork } from '@stellar-pay/sdk';

const api = new ApiClient({ baseUrl: 'http://localhost:4000', getToken: () => token });
const network = StellarNetwork.forTestnet();

const xdr = await network.buildPaymentTransaction({ from, to, amount, assetCode: 'XLM' });
// user signs the XDR with their wallet, then:
await network.submitSignedTransaction(signedXdr);
```
