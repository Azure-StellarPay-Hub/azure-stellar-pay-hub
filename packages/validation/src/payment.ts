import { z } from 'zod';
import {
  amountSchema,
  assetCodeSchema,
  issuerSchema,
  memoSchema,
  memoTypeSchema,
  publicKeySchema,
} from './common';

const destinationSchema = z
  .object({
    publicKey: publicKeySchema,
    amount: amountSchema,
    memo: memoSchema,
  })
  .strict();

export const createPaymentSchema = z
  .object({
    type: z.enum(['SEND', 'QR', 'PAYMENT_LINK', 'SCHEDULED', 'RECURRING', 'BATCH', 'SPLIT', 'INVOICE', 'CROSS_BORDER']),
    fromPublicKey: publicKeySchema,
    destinations: z.array(destinationSchema).min(1, 'At least one destination is required'),
    assetCode: assetCodeSchema.default('XLM'),
    assetIssuer: issuerSchema,
    memo: memoSchema,
    memoType: memoTypeSchema,
    /** ISO timestamp - when to execute (scheduled/recurring). */
    scheduledFor: z.string().datetime().optional(),
    recurring: z
      .object({
        interval: z.enum(['daily', 'weekly', 'monthly']),
        count: z.number().int().min(1).max(365).optional(),
      })
      .optional(),
  })
  .strict();

export type CreatePayment = z.infer<typeof createPaymentSchema>;

export const paymentRequestSchema = z
  .object({
    publicKey: publicKeySchema,
    assetCode: assetCodeSchema.default('XLM'),
    assetIssuer: issuerSchema,
    amount: amountSchema.optional(),
    memo: memoSchema,
    message: z.string().max(280).optional(),
  })
  .strict();

export type PaymentRequestInput = z.infer<typeof paymentRequestSchema>;

export const transactionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['PENDING', 'SUBMITTED', 'SUCCEEDED', 'FAILED', 'CANCELED']).optional(),
  direction: z.enum(['INCOMING', 'OUTGOING']).optional(),
  assetCode: assetCodeSchema.optional(),
});

export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>;
