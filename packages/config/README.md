# @stellar-pay/config

Typed environment configuration for Node services (API, workers, seeds).

```ts
import { loadConfig, networkPassphrase } from '@stellar-pay/config';

const config = loadConfig();
const passphrase = networkPassphrase(config);
```

Every variable is declared in a single Zod schema (`src/schema.ts`), so adding
an environment variable updates the API boot-time validation in one place.
