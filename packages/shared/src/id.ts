const cryptoImpl =
  typeof globalThis !== 'undefined' && globalThis.crypto ? globalThis.crypto : null;

/** Generate a v4 UUID (browser + Node 18+ compatible). */
export function createId(): string {
  if (cryptoImpl?.randomUUID) {
    return cryptoImpl.randomUUID();
  }
  // Fallback for older environments.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Generate a cryptographically random hex nonce (challenge for wallet auth). */
export function newNonce(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  if (cryptoImpl?.getRandomValues) {
    cryptoImpl.getRandomValues(buffer);
  } else {
    for (let i = 0; i < bytes; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(buffer, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Generate a URL-safe random secret (API keys, webhook secrets). */
export function newSecret(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  if (cryptoImpl?.getRandomValues) {
    cryptoImpl.getRandomValues(buffer);
  } else {
    for (let i = 0; i < bytes; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
  }
  return btoaSafe(buffer);
}

function btoaSafe(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa === 'function') {
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return Buffer.from(binary, 'binary').toString('base64url');
}

/** SHA-256 hash a secret (hex) for at-rest storage. Async: browser + Node. */
export async function hashSecret(secret: string): Promise<string> {
  if (cryptoImpl?.subtle) {
    const digest = await cryptoImpl.subtle.digest('SHA-256', new TextEncoder().encode(secret));
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('WebCrypto (crypto.subtle) is required to hash secrets');
}
