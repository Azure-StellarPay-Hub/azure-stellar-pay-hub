import type { AnalyticsEvent, AnalyticsEventName } from '@stellar-pay/types';

/** Provider contract - implement to wire in PostHog, Segment, etc. */
export interface AnalyticsProvider {
  readonly name: string;
  track(event: AnalyticsEvent): Promise<void> | void;
  identify?(userId: string): Promise<void> | void;
}

export class NoopAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'noop';
  track(): void {
    /* no-op */
  }
}

export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'console';
  track(event: AnalyticsEvent): void {
    console.log(`[analytics] ${event.name}`, event.properties, event.timestamp);
  }
}

/** Adapter for PostHog (pass an initialized posthog-js instance). */
export class PostHogProvider implements AnalyticsProvider {
  readonly name = 'posthog';
  constructor(
    private readonly posthog: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
      identify: (userId: string) => void;
    },
  ) {}

  track(event: AnalyticsEvent): void {
    this.posthog.capture(event.name, {
      ...event.properties,
      distinct_id: event.userId,
      timestamp: event.timestamp,
    });
  }

  identify(userId: string): void {
    this.posthog.identify(userId);
  }
}

class AnalyticsClient {
  private provider: AnalyticsProvider = new NoopAnalyticsProvider();

  setProvider(provider: AnalyticsProvider): void {
    this.provider = provider;
  }

  track(name: AnalyticsEventName, properties: Record<string, unknown> = {}, userId?: string): void {
    const event: AnalyticsEvent = {
      name,
      userId,
      properties,
      timestamp: new Date().toISOString(),
    };
    void this.provider.track(event);
  }

  identify(userId: string): void {
    this.provider.identify?.(userId);
  }
}

/** Global analytics singleton. */
export const analytics = new AnalyticsClient();
