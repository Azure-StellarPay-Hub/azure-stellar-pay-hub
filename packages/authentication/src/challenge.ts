import { newNonce } from '@stellar-pay/shared';

export const CHALLENGE_PREFIX = 'stellar-pay:auth';
export const CHALLENGE_TTL_SECONDS = 300; // 5 minutes

export interface Challenge {
  nonce: string;
  message: string;
  expiresAt: string;
}

/**
 * Build the challenge message a wallet must sign:
 *   stellar-pay:auth:<publicKey>:<nonce>
 */
export function buildChallenge(publicKey: string, nonce: string = newNonce()): Challenge {
  const message = `${CHALLENGE_PREFIX}:${publicKey}:${nonce}`;
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_SECONDS * 1000).toISOString();
  return { nonce, message, expiresAt };
}

/** Verify a challenge message matches the expected shape for a public key. */
export function parseChallengeMessage(
  message: string,
  publicKey: string,
): { nonce: string } | null {
  const parts = message.split(':');
  // Format: stellar-pay:auth:<publicKey>:<nonce>
  if (parts.length !== 4) {
    return null;
  }
  const prefix = parts[0] + ':' + parts[1];
  const key = parts[2];
  const nonce = parts[3];
  if (prefix !== CHALLENGE_PREFIX || key !== publicKey || !nonce || nonce.length < 16) {
    return null;
  }
  return { nonce };
}
