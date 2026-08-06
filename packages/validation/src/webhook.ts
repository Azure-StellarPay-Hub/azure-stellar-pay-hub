import { z } from 'zod';

export const registerWebhookSchema = z
  .object({
    url: z.string().url(),
    events: z
      .array(
        z.enum([
          'payment.received',
          'payment.failed',
          'invoice.paid',
          'settlement.completed',
          'customer.created',
        ]),
      )
      .min(1),
    secret: z.string().min(16).optional(),
  })
  .strict();

export type RegisterWebhook = z.infer<typeof registerWebhookSchema>;

export const notificationPrefsSchema = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
  webhook: z.boolean().optional(),
});

export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;
