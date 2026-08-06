import { describe, expect, it } from '@jest/globals';
import { createPaymentSchema } from './payment';

const VALID_KEY = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

describe('createPaymentSchema', () => {
  it('accepts a simple send payment', () => {
    const result = createPaymentSchema.safeParse({
      type: 'SEND',
      fromPublicKey: VALID_KEY,
      destinations: [{ publicKey: VALID_KEY, amount: '10.5' }],
      assetCode: 'XLM',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a split payment', () => {
    const result = createPaymentSchema.safeParse({
      type: 'SPLIT',
      fromPublicKey: VALID_KEY,
      destinations: [
        { publicKey: VALID_KEY, amount: '1' },
        { publicKey: VALID_KEY, amount: '2' },
      ],
      assetCode: 'USDC',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid destination key', () => {
    const result = createPaymentSchema.safeParse({
      type: 'SEND',
      fromPublicKey: VALID_KEY,
      destinations: [{ publicKey: 'not-a-key', amount: '1' }],
      assetCode: 'XLM',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative amounts', () => {
    const result = createPaymentSchema.safeParse({
      type: 'SEND',
      fromPublicKey: VALID_KEY,
      destinations: [{ publicKey: VALID_KEY, amount: '-5' }],
      assetCode: 'XLM',
    });
    expect(result.success).toBe(false);
  });

  it('rejects payments without destinations', () => {
    const result = createPaymentSchema.safeParse({
      type: 'SEND',
      fromPublicKey: VALID_KEY,
      destinations: [],
      assetCode: 'XLM',
    });
    expect(result.success).toBe(false);
  });

  it('accepts recurring payments with schedule', () => {
    const result = createPaymentSchema.safeParse({
      type: 'RECURRING',
      fromPublicKey: VALID_KEY,
      destinations: [{ publicKey: VALID_KEY, amount: '5' }],
      assetCode: 'XLM',
      recurring: { interval: 'monthly', count: 12 },
    });
    expect(result.success).toBe(true);
  });
});
