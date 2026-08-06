import { describe, expect, it } from '@jest/globals';
import {
  addAmounts,
  formatAmount,
  fromStroops,
  gteAmount,
  subtractAmounts,
  toStroops,
  validateAmount,
} from './money';

describe('toStroops / fromStroops', () => {
  it('converts XLM to stroops exactly', () => {
    expect(toStroops('1')).toBe(10_000_000n);
    expect(toStroops('0.0000001')).toBe(1n);
    expect(toStroops('10.5')).toBe(105_000_000n);
  });

  it('round-trips amounts', () => {
    expect(fromStroops(toStroops('123.4567891'))).toBe('123.4567891');
    expect(fromStroops(10_000_000n)).toBe('1');
  });

  it('trims trailing zeros', () => {
    expect(fromStroops(10_000_000n + 500_000n)).toBe('1.05');
  });

  it('handles values with more precision than supported by rounding down', () => {
    expect(toStroops('0.00000001')).toBe(0n);
  });
});

describe('validateAmount', () => {
  it('accepts valid amounts', () => {
    expect(() => validateAmount('0')).not.toThrow();
    expect(() => validateAmount('12.34')).not.toThrow();
    expect(() => validateAmount('007.5')).not.toThrow();
  });

  it('rejects invalid amounts', () => {
    expect(() => validateAmount('-1')).toThrow();
    expect(() => validateAmount('abc')).toThrow();
    expect(() => validateAmount('1,000')).toThrow();
    expect(() => validateAmount('')).toThrow();
  });
});

describe('addAmounts / subtractAmounts / gteAmount', () => {
  it('adds exactly', () => {
    expect(addAmounts('0.1', '0.2')).toBe('0.3');
    expect(addAmounts('10.0000001', '0.0000009')).toBe('10.000001');
  });

  it('subtracts exactly', () => {
    expect(subtractAmounts('1', '0.3')).toBe('0.7');
  });

  it('compares amounts', () => {
    expect(gteAmount('2', '1.9999999')).toBe(true);
    expect(gteAmount('1', '1.0000001')).toBe(false);
  });
});

describe('formatAmount', () => {
  it('formats for display', () => {
    expect(formatAmount('12.3400000')).toBe('12.34');
    expect(formatAmount('5')).toBe('5');
    expect(formatAmount('0.0000001', 4)).toBe('0.0000');
  });
});
