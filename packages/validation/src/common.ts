import { z } from 'zod';

export const publicKeySchema = z
  .string()
  .regex(/^[GA][A-Z2-7]{55}$/, 'Must be a valid Stellar public key (G... or M...)');

export const idSchema = z.string().uuid();

export const amountSchema = z
  .string()
  .regex(/^[0-9]+(\.[0-9]+)?$/, 'Amount must be a non-negative decimal string');

export const assetCodeSchema = z.string().regex(/^[a-zA-Z0-9]{1,12}$/);

export const issuerSchema = publicKeySchema.nullable().optional();

export const memoSchema = z
  .string()
  .max(28, 'Memo must be at most 28 bytes')
  .optional();

export const memoTypeSchema = z.enum(['text', 'hash', 'id']).optional();

export const pageSchema = z.coerce.number().int().min(1).optional().default(1);
export const pageSizeSchema = z.coerce.number().int().min(1).max(100).optional().default(20);

export const paginationQuerySchema = z.object({
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
