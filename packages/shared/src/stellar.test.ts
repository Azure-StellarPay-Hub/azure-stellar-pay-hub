import { describe, expect, it } from '@jest/globals';
import { isValidAssetCode, isValidMemo, isValidPublicKey, verifyStrkeyChecksum } from './stellar';

// Well-known public key (SDF multi-sig on mainnet).
const VALID_G = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

describe('isValidPublicKey', () => {
  it('accepts valid G addresses', () => {
    expect(isValidPublicKey(VALID_G)).toBe(true);
  });

  it('rejects malformed addresses', () => {
    expect(isValidPublicKey('')).toBe(false);
    expect(isValidPublicKey('G123')).toBe(false);
    expect(isValidPublicKey('A' + VALID_G.slice(1))).toBe(false);
    expect(isValidPublicKey(VALID_G.slice(0, -1) + '0')).toBe(false); // '0' not in alphabet
  });
});

describe('verifyStrkeyChecksum', () => {
  it('validates the CRC16 checksum of a known address', () => {
    expect(verifyStrkeyChecksum(VALID_G)).toBe(true);
  });

  it('rejects an address with a corrupted checksum', () => {
    const corrupted = VALID_G.slice(0, -2) + (VALID_G.slice(-2) === 'ZN' ? 'ZZ' : 'ZN');
    expect(verifyStrkeyChecksum(corrupted)).toBe(false);
  });
});

describe('isValidAssetCode', () => {
  it('accepts 1-12 alphanumeric codes', () => {
    expect(isValidAssetCode('XLM')).toBe(true);
    expect(isValidAssetCode('USDC')).toBe(true);
    expect(isValidAssetCode('A')).toBe(true);
    expect(isValidAssetCode('123456789012')).toBe(true);
  });

  it('rejects invalid codes', () => {
    expect(isValidAssetCode('')).toBe(false);
    expect(isValidAssetCode('US DC')).toBe(false);
    expect(isValidAssetCode('1234567890123')).toBe(false);
    expect(isValidAssetCode('usdc-!')).toBe(false);
  });
});

describe('isValidMemo', () => {
  it('accepts empty memos', () => {
    expect(isValidMemo(null)).toBe(true);
    expect(isValidMemo(undefined)).toBe(true);
    expect(isValidMemo('')).toBe(true);
  });

  it('accepts short memos', () => {
    expect(isValidMemo('invoice-123')).toBe(true);
  });

  it('rejects memos longer than 28 bytes', () => {
    expect(isValidMemo('a'.repeat(29))).toBe(false);
  });
});
