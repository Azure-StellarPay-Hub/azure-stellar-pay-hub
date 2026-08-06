# @stellar-pay/validation

Centralized [Zod](https://zod.dev) schemas for every API input in the platform:

- `auth` – wallet challenge/verify, admin login, refresh tokens
- `payment` – send / batch / split / scheduled / recurring payments
- `merchant`, `invoice`, `payment-link`, `product` – merchant domain
- `user`, `wallet` – profiles, contacts, beneficiaries, trustlines
- `webhook`, `admin` – webhook registration, role & status changes, settings

The NestJS API validates every request body/query with these schemas via the
shared `ZodValidationPipe`, so frontends and SDKs never re-implement rules.

```ts
import { createPaymentSchema } from '@stellar-pay/validation';
```
