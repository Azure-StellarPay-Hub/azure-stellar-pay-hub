import { z } from 'zod';
import { publicKeySchema } from './common';

export const linkWalletSchema = z
  .object({
    publicKey: publicKeySchema,
    provider: z.enum(['FREIGHTER', 'XBULL', 'ALBEDO']),
    network: z.enum(['public', 'testnet', 'standalone']).optional().default('testnet'),
    /** Short-lived signature of a nonce proving wallet ownership. */
    signature: z.string().min(1).optional(),
  })
  .strict();

export type LinkWallet = z.infer<typeof linkWalletSchema>;

export const trustlineSchema = z
  .object({
    assetCode: z.string().regex(/^[a-zA-Z0-9]{1,12}$/),
    assetIssuer: publicKeySchema,
    /** Trust limit in units (defaults to max). */
    limit: z.string().regex(/^[0-9]+(\.[0-9]+)?$/).optional(),
  })
  .strict();

export type TrustlineInput = z.infer<typeof trustlineSchema>;
