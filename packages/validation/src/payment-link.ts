import { z } from 'zod';
import { amountSchema, assetCodeSchema, issuerSchema } from './common';

export const createPaymentLinkSchema = z
  .object({
    title: z.string().min(1).max(160),
    description: z.string().max(500).optional(),
    amount: amountSchema.optional(),
    assetCode: assetCodeSchema.optional().default('USDC'),
    assetIssuer: issuerSchema,
    fixedAmount: z.boolean().optional().default(true),
    expiresAt: z.string().datetime().optional(),
    redirectUrl: z.string().url().optional(),
  })
  .strict();

export type CreatePaymentLink = z.infer<typeof createPaymentLinkSchema>;
