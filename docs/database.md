---
title: Database
description: Prisma schema overview — models, relationships, and indexes.
---

# Database

PostgreSQL via Prisma. The schema lives in `packages/database/prisma/schema.prisma` and is
shared by every app through `@stellar-pay/database`.

## Core models

```text
User ─┬─ Wallet (verified public keys, network)
      ├─ Contact (address book)
      ├─ Session (JWT refresh sessions, device info)
      ├─ ApiKey (merchant API keys)
      ├─ Merchant ─┬─ Product
      │            ├─ Invoice ─ Payment
      │            └─ PaymentLink ─ Payment
      ├─ Notification
      ├─ Subscription / SubscriptionPlan (recurring billing)
      ├─ ScheduledPayment
      └─ AuditLog (who did what, when)

Asset (code + issuer) ─ Trustline (user ↔ asset)
Role ─ Permission  (RBAC; User hasMany Role)
Webhook (endpoint + events + secret)
```

## Highlights

- **Enums** — `Network` (testnet/mainnet), `TransactionStatus`, `PaymentStatus`,
  `Role`, `WebhookEvent`, `NotificationType`, `InvoiceStatus`, …
- **Indexes** — every FK and hot lookup column is indexed (`@@index`), including
  `Transaction.fromAccount`, `Transaction.toAccount`, `Transaction.status`,
  `PaymentLink.code`, `Invoice.number`, `AuditLog.actorId`, and composite
  `(userId, createdAt)` for feed queries.
- **Money** — amounts stored as `Decimal` strings, never floats.
- **Soft-delete & timestamps** — `createdAt`/`updatedAt` on all models.

## Workflow

```bash
pnpm db:generate   # build client from schema
pnpm db:push       # push schema to dev DB (no migration files)
pnpm db:migrate    # create + apply a migration
pnpm db:seed       # seed admin user, demo merchant, assets
pnpm db:studio     # Prisma Studio
```

In CI, `prisma generate` runs as part of the database package build so the generated client
is always in sync with the schema.

## ERD generation

```bash
npx --yes prisma-erd-generator --schema packages/database/prisma/schema.prisma
```

produces `packages/database/ERD.svg` for visual review.
