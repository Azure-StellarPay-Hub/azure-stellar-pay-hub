import { describe, expect, it } from '@jest/globals';
import { buildPaymentUri, parsePaymentUri } from './stellar-uri';

describe('Stellar URI utilities', () => {
  describe('buildPaymentUri', () => {
    it('builds a basic payment URI', () => {
      const uri = buildPaymentUri({
        destination: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        amount: '100',
      });
      expect(uri).toContain('web+stellar:pay');
      expect(uri).toContain('destination=');
      expect(uri).toContain('amount=100');
    });

    it('includes asset code when provided', () => {
      const uri = buildPaymentUri({
        destination: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        amount: '50',
        assetCode: 'USDC',
        assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      });
      expect(uri).toContain('asset_code=USDC');
      expect(uri).toContain('asset_issuer=');
    });

    it('includes memo when provided', () => {
      const uri = buildPaymentUri({
        destination: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        amount: '10',
        memo: 'Invoice #42',
      });
      expect(uri).toContain('memo=Invoice+%2342');
    });
  });

  describe('parsePaymentUri', () => {
    it('parses a valid payment URI', () => {
      const url =
        'web+stellar:pay?destination=GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN&amount=100';
      const parsed = parsePaymentUri(url);
      expect(parsed?.destination).toBe('GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
      expect(parsed?.amount).toBe('100');
    });

    it('returns null for invalid URI', () => {
      expect(parsePaymentUri('not-a-uri')).toBeNull();
      expect(parsePaymentUri('https://example.com')).toBeNull();
    });

    it('returns null when destination is missing', () => {
      const url = 'web+stellar:pay?amount=100';
      expect(parsePaymentUri(url)).toBeNull();
    });
  });
});
