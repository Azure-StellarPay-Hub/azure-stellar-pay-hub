import { z } from 'zod';

export const assetQuerySchema = z.object({
  search: z.string().max(60).optional(),
  type: z.enum(['NATIVE', 'STELLAR', 'CUSTOM']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type AssetQuery = z.infer<typeof assetQuerySchema>;
