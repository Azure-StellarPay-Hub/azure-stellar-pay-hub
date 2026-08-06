import { describe, expect, it } from '@jest/globals';
import {
  challengeRequestSchema,
  verifyRequestSchema,
  adminLoginSchema,
  refreshTokenSchema,
} from './auth';

const VALID_KEY = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

describe('auth validation schemas', () => {
  describe('challengeRequestSchema', () => {
    it('accepts valid public key', () => {
      const result = challengeRequestSchema.safeParse({ publicKey: VALID_KEY });
      expect(result.success).toBe(true);
    });

    it('rejects invalid public key', () => {
      const result = challengeRequestSchema.safeParse({ publicKey: 'bad' });
      expect(result.success).toBe(false);
    });

    it('rejects missing public key', () => {
      const result = challengeRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('verifyRequestSchema', () => {
    it('accepts a valid verify request', () => {
      const result = verifyRequestSchema.safeParse({
        publicKey: VALID_KEY,
        signature: 'a'.repeat(128),
        message: 'sign this message please',
        nonce: 'a'.repeat(32),
      });
      expect(result.success).toBe(true);
    });

    it('accepts with optional provider and deviceName', () => {
      const result = verifyRequestSchema.safeParse({
        publicKey: VALID_KEY,
        signature: 'a'.repeat(128),
        message: 'sign this',
        nonce: 'a'.repeat(32),
        provider: 'FREIGHTER',
        deviceName: 'Chrome on macOS',
      });
      expect(result.success).toBe(true);
    });

    it('rejects short nonce', () => {
      const result = verifyRequestSchema.safeParse({
        publicKey: VALID_KEY,
        signature: 'a'.repeat(128),
        message: 'sign this',
        nonce: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid provider', () => {
      const result = verifyRequestSchema.safeParse({
        publicKey: VALID_KEY,
        signature: 'a'.repeat(128),
        message: 'sign this',
        nonce: 'a'.repeat(32),
        provider: 'METAMASK',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('adminLoginSchema', () => {
    it('accepts valid admin credentials', () => {
      const result = adminLoginSchema.safeParse({
        email: 'admin@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = adminLoginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const result = adminLoginSchema.safeParse({
        email: 'admin@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('refreshTokenSchema', () => {
    it('accepts valid refresh token', () => {
      const result = refreshTokenSchema.safeParse({ refreshToken: 'valid-token' });
      expect(result.success).toBe(true);
    });

    it('rejects empty token', () => {
      const result = refreshTokenSchema.safeParse({ refreshToken: '' });
      expect(result.success).toBe(false);
    });
  });
});
