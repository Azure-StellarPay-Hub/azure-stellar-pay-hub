import { describe, expect, it } from '@jest/globals';
import { linkWalletSchema, trustlineSchema } from './wallet';

const VALID_KEY = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const VALID_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

describe('wallet validation schemas', () => {
  describe('linkWalletSchema', () => {
    it('accepts a valid wallet link request', () => {
      const result = linkWalletSchema.safeParse({
        publicKey: VALID_KEY,
        provider: 'FREIGHTER',
        network: 'testnet',
      });
      expect(result.success).toBe(true);
    });

    it('accepts xBull provider', () => {
      const result = linkWalletSchema.safeParse({
        publicKey: VALID_KEY,
        provider: 'XBULL',
        network: 'testnet',
      });
      expect(result.success).toBe(true);
    });

    it('accepts Albedo provider', () => {
      const result = linkWalletSchema.safeParse({
        publicKey: VALID_KEY,
        provider: 'ALBEDO',
      });
      expect(result.success).toBe(true);
    });

    it('rejects unknown provider', () => {
      const result = linkWalletSchema.safeParse({
        publicKey: VALID_KEY,
        provider: 'UNKNOWN',
      });
      expect(result.success).toBe(false);
    });

    it('defaults network to testnet', () => {
      const result = linkWalletSchema.safeParse({
        publicKey: VALID_KEY,
        provider: 'FREIGHTER',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.network).toBe('testnet');
      }
    });

    it('accepts optional signature', () => {
      const result = linkWalletSchema.safeParse({
        publicKey: VALID_KEY,
        provider: 'FREIGHTER',
        signature: 'a'.repeat(128),
      });
      expect(result.success).toBe(true);
    });
  });

  describe('trustlineSchema', () => {
    it('accepts add trustline request', () => {
      const result = trustlineSchema.safeParse({
        assetCode: 'USDC',
        assetIssuer: VALID_ISSUER,
        limit: '1000',
      });
      expect(result.success).toBe(true);
    });

    it('accepts trustline without explicit limit', () => {
      const result = trustlineSchema.safeParse({
        assetCode: 'USDC',
        assetIssuer: VALID_ISSUER,
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing assetCode', () => {
      const result = trustlineSchema.safeParse({
        assetIssuer: VALID_ISSUER,
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid assetCode', () => {
      const result = trustlineSchema.safeParse({
        assetCode: 'TOO_LONG_ASSET_CODE',
        assetIssuer: VALID_ISSUER,
      });
      expect(result.success).toBe(false);
    });
  });
});
