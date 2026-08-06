import { describe, expect, it } from '@jest/globals';
import { hashPassword, verifyPassword } from './password';
import { buildChallenge, parseChallengeMessage } from './challenge';

describe('hashPassword / verifyPassword', () => {
  it('hashes and verifies a password', () => {
    const stored = hashPassword('CorrectHorseBatteryStaple');
    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(verifyPassword('CorrectHorseBatteryStaple', stored)).toBe(true);
  });

  it('rejects wrong passwords', () => {
    const stored = hashPassword('password-a');
    expect(verifyPassword('password-b', stored)).toBe(false);
  });

  it('uses a fresh salt each time', () => {
    expect(hashPassword('same')).not.toBe(hashPassword('same'));
  });

  it('rejects malformed hashes', () => {
    expect(verifyPassword('x', '')).toBe(false);
    expect(verifyPassword('x', 'md5$abc$def')).toBe(false);
  });
});

describe('challenge messages', () => {
  it('builds and parses a challenge', () => {
    const key = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
    const challenge = buildChallenge(key, 'a'.repeat(32));
    const parsed = parseChallengeMessage(challenge.message, key);
    expect(parsed?.nonce).toBe('a'.repeat(32));
  });

  it('rejects tampered challenges', () => {
    const key = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
    expect(parseChallengeMessage('stellar-pay:auth:evil:notanonce', key)).toBeNull();
    expect(parseChallengeMessage('not-a-challenge', key)).toBeNull();
  });
});
