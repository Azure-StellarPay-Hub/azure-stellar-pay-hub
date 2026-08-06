import type { AmountString } from '@stellar-pay/types';

/** 1 unit = 10^7 stroops (fixed-point precision used by Soroban + Horizon). */
export const STROOPS_PER_UNIT = 10_000_000n;

export const XLM_DECIMALS = 7;
export const FIAT_DECIMALS = 2;

/**
 * Validate an amount string: optional sign, digits, optional fraction.
 * Throws on malformed input.
 */
export function validateAmount(amount: string): void {
  if (typeof amount !== 'string' || !/^[0-9]+(\.[0-9]+)?$/.test(amount)) {
    throw new Error(`Invalid amount: "${amount}"`);
  }
  // The regex already rejects negative signs, so no BigInt parse needed here.
  // Paranoid check: ensure no leading minus slipped through.
  if (amount.startsWith('-')) {
    throw new Error(`Amount must not be negative: "${amount}"`);
  }
}

function normalizeForBigInt(amount: string): string {
  return amount.replace(/^0+(?=\d)/, '') || '0';
}

/** Convert a decimal amount string into stroops (bigint). */
export function toStroops(amount: AmountString, decimals = 7): bigint {
  validateAmount(amount);
  const [whole = '0', frac = ''] = amount.split('.');
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  return (
    BigInt(normalizeForBigInt(whole)) * 10n ** BigInt(decimals) +
    BigInt(fracPadded || '0')
  );
}

/** Convert stroops into a decimal amount string (trailing zeros trimmed). */
export function fromStroops(stroops: bigint | string, decimals = 7): AmountString {
  const value = BigInt(stroops);
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const divisor = 10n ** BigInt(decimals);
  const whole = abs / divisor;
  const frac = (abs % divisor).toString().padStart(decimals, '0').replace(/0+$/, '');
  const result = frac ? `${whole}.${frac}` : whole.toString();
  return negative ? `-${result}` : result;
}

/** Format an amount for display: trim trailing zeros, cap decimals. */
export function formatAmount(amount: AmountString, maxDecimals = 7): string {
  validateAmount(amount);
  const [whole, frac] = amount.split('.');
  if (!frac) {
    return whole;
  }
  const trimmed = frac.replace(/0+$/, '');
  if (!trimmed) {
    return whole;
  }
  return `${whole}.${trimmed.slice(0, maxDecimals)}`;
}

/** Exact decimal addition (returns a normalized decimal string). */
export function addAmounts(a: AmountString, b: AmountString, decimals = 7): AmountString {
  return fromStroops(toStroops(a, decimals) + toStroops(b, decimals), decimals);
}

/** Exact decimal subtraction. */
export function subtractAmounts(a: AmountString, b: AmountString, decimals = 7): AmountString {
  return fromStroops(toStroops(a, decimals) - toStroops(b, decimals), decimals);
}

/** Returns true when `a >= b`. */
export function gteAmount(a: AmountString, b: AmountString, decimals = 7): boolean {
  return toStroops(a, decimals) >= toStroops(b, decimals);
}
