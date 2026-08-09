import { describe, expect, it } from '@jest/globals';
import {
  verifyMessageSignature,
  verifyFreighterMessageSignature,
  verifySignedXdrOwner,
} from './signature';

const VALID_KEY = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

describe('signature verification', () => {
  describe('verifyMessageSignature', () => {
    it('rejects invalid public keys', () => {
      expect(
        verifyMessageSignature({
          publicKey: 'not-a-key',
          message: 'hello',
          signature: 'a'.repeat(128),
        }),
      ).toBe(false);
    });

    it('rejects empty signatures', () => {
      expect(
        verifyMessageSignature({
          publicKey: VALID_KEY,
          message: 'hello',
          signature: '',
        }),
      ).toBe(false);
    });

    it('rejects short hex signatures', () => {
      expect(
        verifyMessageSignature({
          publicKey: VALID_KEY,
          message: 'hello',
          signature: 'aabbcc',
        }),
      ).toBe(false);
    });

    it('rejects invalid base64 signatures', () => {
      expect(
        verifyMessageSignature({
          publicKey: VALID_KEY,
          message: 'hello',
          signature: '!!!invalid!!!',
        }),
      ).toBe(false);
    });
  });

  describe('verifyFreighterMessageSignature', () => {
    it('rejects a tampered challenge with wrong public key', () => {
      const fakeKey = 'GB5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
      const result = verifyFreighterMessageSignature({
        publicKey: fakeKey,
        message: 'stellar-pay:auth:' + fakeKey + ':nonce123',
        signature: 'a'.repeat(128),
      });
      expect(result).toBe(false);
    });

    it('attempts hex decode when message is valid hex', () => {
      const hexMessage = '7465737400000000000000000000000000000000000000000000000000000000';
      const result = verifyFreighterMessageSignature({
        publicKey: VALID_KEY,
        message: hexMessage,
        signature: 'a'.repeat(128),
      });
      // Should reject signature but not crash.
      expect(result).toBe(false);
    });
  });

  describe('verifySignedXdrOwner', () => {
    it('rejects malformed XDR', () => {
      expect(verifySignedXdrOwner('not-valid-xdr', VALID_KEY)).toBe(false);
    });

    it('rejects empty XDR', () => {
      expect(verifySignedXdrOwner('', VALID_KEY)).toBe(false);
    });
  });
});
