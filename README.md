# Azure StellarPay Hub

**The open-source Stellar payments platform for businesses.**

Send and accept instant, low-cost payments on Stellar — backed by on-chain Soroban smart
contracts for escrow, multisig, subscriptions, invoicing, merchant settlement, and rewards.
Built for real-world commerce, not just demos.

[![Stellar](https://img.shields.io/badge/Stellar-7B3FE4?logo=stellar&logoColor=white)](https://stellar.org/developers)
[![Soroban SDK](https://img.shields.io/badge/Soroban_SDK-21.7.1-7B3FE4?logo=stellar&logoColor=white)](https://soroban.stellar.org/docs)
[![CI](https://github.com/Azure-StellarPay-Hub/azure-stellar-pay-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/Azure-StellarPay-Hub/azure-stellar-pay-hub/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

| | |
| --- | --- |
| **Payments** | XLM, USDC, custom assets · QR + payment links · scheduled/recurring/batch/split |
| **Wallets** | Freighter · xBull · Albedo · wallet auth (Ed25519 challenge → JWT) |
| **Merchants** | Onboarding, catalog, invoices, hosted checkout, POS, settlement, analytics |
| **Smart contracts** | payment · escrow · multisig · treasury · subscriptions · invoices · merchant |
| **Stack** | Nx + pnpm · NestJS · Next.js (App Router) · PostgreSQL + Prisma · Redis · Zod · Docker |

## Repository structure

```text
apps/            web · admin · api · explorer · docs
contracts/       payment · escrow · multisig · treasury · subscriptions · invoices · merchant
packages/        sdk · wallet · ui · authentication · database · validation · analytics
                 notifications · config · logger · shared · types
infrastructure/  docker · kubernetes · terraform · monitoring
docs/            architecture · api · sdk · contracts · database · deployment · development · contributing
scripts/         bootstrap & env tooling
tests/           end-to-end smoke + load suites
.github/         CI/CD workflows
```

## Quick start

```bash
corepack enable
pnpm install
pnpm generate:env      # scaffold .env files
pnpm docker:up         # Postgres + Redis
pnpm db:generate && pnpm db:push && pnpm db:seed
pnpm dev               # api:4000 · web:3000 · admin:3001 · explorer:3002 · docs:3003
```

## Scripts

| Command              | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `pnpm dev`           | Run all apps in watch mode               |
| `pnpm build`         | Build every app & package                |
| `pnpm test`          | Run all unit/integration tests           |
| `pnpm lint`          | ESLint across the workspace              |
| `pnpm typecheck`     | `tsc --noEmit` everywhere                |
| `pnpm contracts:build` | Compile Soroban contracts to wasm      |
| `pnpm contracts:test`  | Run Rust contract tests                |
| `pnpm db:seed`       | Seed admin user + demo data              |
| `pnpm docker:up`     | Start Postgres + Redis via compose       |

## Documentation

The full documentation set lives in [`docs/`](docs/) and is rendered by the `docs` app:

- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [SDK](docs/sdk.md)
- [Smart contracts](docs/contracts.md)
- [Database](docs/database.md)
- [Deployment](docs/deployment.md)
- [Development](docs/development.md)
- [Contributing](docs/contributing.md)

## Testing

Unit, integration, contract, API, and end-to-end suites — see [`tests/`](tests/README.md)
and each package's `*.test.ts` files. Contracts include per-entry-point Rust tests.

## CI/CD

GitHub Actions runs lint, typecheck, tests, contract builds, app builds, image builds and
deployment on push to `main` (see `.github/workflows/`).

## Contributing

We welcome contributions! See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full process —
branch naming, PR checklist, commit conventions, and code style. All contributors must
follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

See [`SECURITY.md`](SECURITY.md) for the vulnerability reporting process and
[`docs/architecture.md`](docs/architecture.md) for the security model.

## License

MIT © Azure StellarPay Hub contributors — see [`LICENSE`](LICENSE).
