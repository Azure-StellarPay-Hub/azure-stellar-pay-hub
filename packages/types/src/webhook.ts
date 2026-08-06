import type { WebhookEventType } from './common';

export interface WebhookRegistration {
  id: string;
  merchantId: string;
  url: string;
  events: WebhookEventType[];
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEventType;
  payload: Record<string, unknown>;
  status: 'PENDING' | 'DELIVERED' | 'FAILED';
  attempts: number;
  lastError: string | null;
  createdAt: string;
}
