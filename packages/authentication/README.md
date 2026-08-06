# @stellar-pay/authentication

Wallet-first authentication primitives used by the API:

- **JWT** – signed HS256 access + refresh tokens with session binding
- **Signature verification** – verify Ed25519 signatures from Freighter /
  xBull / Albedo over a challenge message (hex or base64 encoded)
- **Passwords** – scrypt hashing for admin/email accounts (constant-time verify)
- **RBAC** – role hierarchy + permission matrix (mirrors the DB seed)
- **Challenges** – `stellar-pay:auth:<publicKey>:<nonce>` message construction

The web app signs the challenge message with the connected wallet; the API
verifies the signature and issues tokens. See `docs/api.md` for the full flow.
