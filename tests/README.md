# Test Suites

| Suite                  | Location                          | Command                                   |
| ---------------------- | --------------------------------- | ----------------------------------------- |
| Package unit tests     | `packages/*/src/*.test.ts`        | `pnpm test`                               |
| API integration (Nest) | `apps/api/test/app.e2e-spec.ts`   | `pnpm --filter @stellar-pay/api test:e2e` |
| Soroban contract tests | `contracts/*/src/test.rs`         | `pnpm contracts:test`                     |
| End-to-end smoke       | `tests/smoke.mjs`                 | `pnpm test:e2e`                           |
| Auth + payment E2E     | `tests/e2e/auth-payment-flow.mjs` | `pnpm test:e2e:flow`                      |
| Load test (k6)         | `tests/load/payment-load.js`      | `k6 run tests/load/payment-load.js`       |
| Security checks        | `.github/workflows/ci.yml`        | zizmor + npm audit (CI)                   |

## Running everything

```bash
pnpm test
pnpm contracts:test   # requires Rust toolchain
pnpm test:e2e         # boots API against a live DB + Redis
```
