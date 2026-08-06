# @stellar-pay/logger

Structured logging on top of [pino](https://getpino.io). Pretty-printed in
development, JSON in production, with per-service child loggers:

```ts
import { createLogger } from '@stellar-pay/logger';

const log = createLogger('api');
log.info({ txHash: 'abc' }, 'payment submitted');
```
