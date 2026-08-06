# @stellar-pay/database

Single source of truth for the platform's relational persistence.

- `prisma/schema.prisma` – the full PostgreSQL schema (users, wallets,
  transactions, assets, trustlines, merchants, products, invoices, payment
  links, sessions, notifications, API keys, audit logs, roles/permissions…)
- `src/generated/prisma` – the typed Prisma client (generated at build time)
- `src/prisma.service.ts` – `PrismaService` wrapper used by the NestJS API
- `scripts/seed.ts` – idempotent seed (roles, permissions, admin, demo data)

## Commands

```bash
pnpm db:generate   # build (generates client)
pnpm db:migrate    # create & apply a migration
pnpm db:seed       # seed demo data
pnpm db:studio     # browse the database
```

> Requires a running PostgreSQL. See `infrastructure/docker/docker-compose.yml`.
