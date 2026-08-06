# @stellar-pay/analytics

Pluggable analytics instrumentation.

```ts
import { analytics, AnalyticsProvider } from '@stellar-pay/analytics';

analytics.setProvider(new PostHogProvider({ token }));
analytics.track('payment.succeeded', { userId, properties: { amount: '10' } });
```

Built-in providers: `ConsoleAnalyticsProvider` (development), `NoopAnalyticsProvider`
(tests) and `PostHogProvider` (production, uses `posthog-js` — install it in the
consuming app and pass an instance).
