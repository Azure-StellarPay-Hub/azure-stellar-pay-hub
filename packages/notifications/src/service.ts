import type { NotificationType } from '@stellar-pay/types';
import type { ChannelProvider, NotificationMessage } from './providers';

export interface NotificationTemplates {
  title(message: NotificationMessage): string;
  body?(message: NotificationMessage): string | undefined;
}

const DEFAULT_TITLES: Record<NotificationType, string> = {
  PAYMENT_SENT: 'Payment sent',
  PAYMENT_RECEIVED: 'Payment received',
  INVOICE_PAID: 'Invoice paid',
  FAILED_TRANSACTION: 'Transaction failed',
  ACCOUNT_ACTIVITY: 'Account activity',
};

const DEFAULT_BODIES: Record<NotificationType, (m: NotificationMessage) => string> = {
  PAYMENT_SENT: (m) =>
    `Your payment of ${String(m.payload?.amount ?? '')} ${String(m.payload?.assetCode ?? '')} was sent.`,
  PAYMENT_RECEIVED: (m) =>
    `You received ${String(m.payload?.amount ?? '')} ${String(m.payload?.assetCode ?? '')}.`,
  INVOICE_PAID: (m) => `Invoice ${String(m.payload?.invoiceNumber ?? '')} was paid.`,
  FAILED_TRANSACTION: (m) =>
    String(m.payload?.reason ?? 'Your transaction could not be completed.'),
  ACCOUNT_ACTIVITY: () => 'There is new activity on your account.',
};

export class NotificationService {
  private providers: ChannelProvider[] = [];
  private templates: Partial<Record<NotificationType, NotificationTemplates>> = {};

  addProvider(provider: ChannelProvider): this {
    this.providers.push(provider);
    return this;
  }

  setTemplate(type: NotificationType, template: NotificationTemplates): this {
    this.templates[type] = template;
    return this;
  }

  /** Dispatch a message to the matching provider. Never throws to callers. */
  async dispatch(message: NotificationMessage): Promise<void> {
    const provider = this.providers.find((p) => p.channel === message.channel);
    if (!provider) {
      return;
    }
    const template = this.templates[message.type];
    const title = template?.title(message) ?? DEFAULT_TITLES[message.type] ?? message.title;
    const body =
      template?.body?.(message) ??
      (message.type in DEFAULT_BODIES
        ? DEFAULT_BODIES[message.type as keyof typeof DEFAULT_BODIES](message)
        : message.body);
    const enriched: NotificationMessage = { ...message, title, body: body ?? message.body };
    await provider.send(enriched);
  }

  async dispatchAll(
    messages: NotificationMessage[],
  ): Promise<Array<{ ok: boolean; error?: string }>> {
    return Promise.all(
      messages.map(async (message) => {
        try {
          await this.dispatch(message);
          return { ok: true };
        } catch (error) {
          return { ok: false, error: (error as Error).message };
        }
      }),
    );
  }
}
