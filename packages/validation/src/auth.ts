import { z } from 'zod';
import { publicKeySchema } from './common';

export const challengeRequestSchema = z.object({
  publicKey: publicKeySchema,
});

export type ChallengeRequest = z.infer<typeof challengeRequestSchema>;

export const verifyRequestSchema = z.object({
  publicKey: publicKeySchema,
  /** Signature (hex) produced by the wallet over the challenge message. */
  signature: z.string().min(1, 'Signature is required'),
  /** The challenge message that was signed. */
  message: z.string().min(1, 'Message is required'),
  /** Nonce originally issued by POST /auth/challenge. */
  nonce: z.string().min(16, 'Invalid nonce'),
  provider: z.enum(['FREIGHTER', 'XBULL', 'ALBEDO']).optional(),
  /** Device description shown to the user in session management. */
  deviceName: z.string().max(120).optional(),
});

export type VerifyRequest = z.infer<typeof verifyRequestSchema>;

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type AdminLogin = z.infer<typeof adminLoginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshToken = z.infer<typeof refreshTokenSchema>;
