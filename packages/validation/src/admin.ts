import { z } from 'zod';
import { publicKeySchema } from './common';

export const roleAssignmentSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['USER', 'MERCHANT', 'SUPPORT', 'ADMIN']),
});

export type RoleAssignment = z.infer<typeof roleAssignmentSchema>;

export const userStatusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(['PENDING', 'VERIFIED', 'ACTIVE', 'SUSPENDED']),
  reason: z.string().max(500).optional(),
});

export type UserStatusUpdate = z.infer<typeof userStatusSchema>;

export const merchantStatusSchema = z.object({
  merchantId: z.string().uuid(),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED']),
  reason: z.string().max(500).optional(),
});

export type MerchantStatusUpdate = z.infer<typeof merchantStatusSchema>;

export const settingsSchema = z.object({
  key: z.string().min(1).max(120),
  value: z.any(),
  description: z.string().max(500).optional(),
});

export type UpsertSetting = z.infer<typeof settingsSchema>;

export const assetCreateSchema = z.object({
  code: z.string().regex(/^[a-zA-Z0-9]{1,12}$/),
  issuer: publicKeySchema.optional(),
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  decimals: z.number().int().min(0).max(18).optional().default(7),
  isNative: z.boolean().optional().default(false),
  isCrossBorder: z.boolean().optional().default(false),
});

export type CreateAsset = z.infer<typeof assetCreateSchema>;
