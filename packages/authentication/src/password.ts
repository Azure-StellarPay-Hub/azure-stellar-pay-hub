import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const PREFIX = 'scrypt';
const KEY_LENGTH = 64;

/** Hash a password: `scrypt$<salt-hex>$<hash-hex>`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${PREFIX}$${salt}$${hash}`;
}

/** Constant-time verification of a stored hash. */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [prefix, salt, hash] = stored.split('$');
    if (prefix !== PREFIX || !salt || !hash) {
      return false;
    }
    const derived = scryptSync(password, salt, KEY_LENGTH);
    const expected = Buffer.from(hash, 'hex');
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
