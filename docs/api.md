---
title: API Reference
description: REST endpoints, authentication, and WebSocket events of the NestJS API.
---

# API Reference

Base URL: `http://localhost:4000` (see `apps/api/.env.example`). All JSON.

## Authentication

### Request a challenge

```
GET /auth/challenge?address=GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890
```

Returns `{ challenge, nonce, expiresAt }`. The wallet signs the challenge message.

### Verify signature

```
POST /auth/verify
Content-Type: application/json

{ "address": "G…", "signature": "<base64 ed25519 sig>", "network": "testnet" }
```

Returns `{ accessToken, refreshToken, user, wallet }`. The access token is a JWT; send it as
`Authorization: Bearer <token>` on every protected route.

### Refresh / logout

```
POST /auth/refresh   { refreshToken }
POST /auth/logout    (Bearer)
```

## Payments

| Method | Path                  | Auth | Description                        |
| ------ | --------------------- | ---- | ---------------------------------- |
| POST   | `/payments/quote`     | ✓    | Fee/quote preview for a transfer   |
| POST   | `/payments/preview`   | ✓    | Simulate a transaction server-side |
| POST   | `/payments/submit`    | ✓    | Submit a signed XDR                |
| GET    | `/payments`           | ✓    | List user payments (paginated)     |
| GET    | `/payments/:id`       | ✓    | Payment detail                     |
| POST   | `/payments/schedule`  | ✓    | Schedule a future payment          |
| POST   | `/payments/recurring` | ✓    | Create a recurring payment         |
| POST   | `/payments/batch`     | ✓    | Submit many payments at once       |
| GET    | `/payments/rates`     |      | Exchange rates (public)            |

## Assets, Trustlines & Transactions

| Method | Path                       | Auth | Description             |
| ------ | -------------------------- | ---- | ----------------------- |
| GET    | `/assets`                  | ✓    | Known assets + balances |
| POST   | `/assets/trustline`        | ✓    | Create a trustline      |
| POST   | `/assets/trustline/remove` | ✓    | Remove a trustline      |
| GET    | `/transactions`            | ✓    | Transaction history     |
| GET    | `/transactions/:id`        | ✓    | Transaction detail      |

## Merchants, Invoices, Payment Links

| Method | Path                    | Auth | Description                |
| ------ | ----------------------- | ---- | -------------------------- |
| POST   | `/merchants`            | ✓    | Onboard a merchant         |
| GET    | `/merchants/me`         | ✓    | Own merchant profile       |
| PATCH  | `/merchants/:id`        | ✓    | Update profile             |
| POST   | `/invoices`             | ✓    | Create an invoice          |
| GET    | `/invoices`             | ✓    | List invoices              |
| GET    | `/invoices/:number`     |      | Public invoice lookup      |
| POST   | `/payment-links`        | ✓    | Create a payment link      |
| GET    | `/payment-links/:code`  |      | Public payment link lookup |
| POST   | `/checkout/:code/quote` |      | Quote for a payment link   |
| POST   | `/checkout/:code/pay`   |      | Record a checkout payment  |

## Users, Wallet, Notifications, Webhooks

| Method | Path                      | Auth | Description               |
| ------ | ------------------------- | ---- | ------------------------- |
| GET    | `/users/me`               | ✓    | Current profile           |
| PATCH  | `/users/me`               | ✓    | Update profile            |
| GET    | `/users/me/contacts`      | ✓    | Address book              |
| POST   | `/users/me/contacts`      | ✓    | Add contact               |
| GET    | `/wallets/me`             | ✓    | Wallet + balances         |
| POST   | `/wallets/switch-network` | ✓    | Change network            |
| GET    | `/notifications`          | ✓    | In-app notifications      |
| PATCH  | `/notifications/:id/read` | ✓    | Mark read                 |
| POST   | `/webhooks`               | ✓    | Register webhook endpoint |
| POST   | `/webhooks/:id/test`      | ✓    | Send test event           |

## Admin (RBAC: `admin`)

All admin routes live under `/admin/*`: users, merchants, transactions, assets, analytics,
audit logs, notifications, settings. They require a JWT with the `admin` role.

## WebSocket events

Connect to `/socket.io` with `auth: { token }` and listen on your user room:

```
payment.sent        { txId, amount, asset, recipient }
payment.received    { txId, amount, asset, sender }
payment.failed      { txId, reason }
invoice.paid        { invoiceId, amount, currency }
notification        { id, type, title, body }
```

## Errors

```json
{ "statusCode": 400, "message": "Validation failed", "errors": { "amount": "Required" } }
```

Common codes: `400` validation, `401` unauthorized, `403` forbidden, `404` not found,
`409` conflict, `429` rate limited, `500` internal.
