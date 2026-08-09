# @stellar-pay/wallet

React provider unifying Freighter, xBull and Albedo behind one adapter
interface:

```tsx
import { WalletProvider, useWallet, SUPPORTED_WALLETS } from '@stellar-pay/wallet';

function ConnectButton() {
  const { connect, publicKey, disconnect, connected } = useWallet();
  return (
    <button onClick={() => connect('FREIGHTER')}>
      {connected ? publicKey : 'Connect Freighter'}
    </button>
  );
}

<WalletProvider defaultNetwork="testnet">
  <App />
</WalletProvider>;
```

Features: connect / disconnect / auto-reconnect (localStorage), wallet
switching, transaction signing (`signTx`), message signing for wallet auth
(`signMessage`) and network detection.

## Notes on adapter compatibility

- **Freighter** – official `@stellar/freighter-api` (v2.x). `signMessage`
  results are normalized whether they resolve to a string or
  `{ signedMessage }`.
- **xBull** – `@creit.tech/xbull-wallet-connect` v10. The adapter duck-types the
  bridge (`connect`, `sign({xdr})`, optional `signXdr`/`signMessage`, `close`),
  so it keeps working as the SDK evolves. xBull message signing may be
  unavailable in some SDK versions.
- **Albedo** – `@albedo-link/intent`. `signMessage` uses `signBlob` with a
  base64-encoded UTF-8 payload; the API verifies the resulting signature over
  the message bytes.
