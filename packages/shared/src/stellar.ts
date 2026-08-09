/**
 * Stellar address / code / memo validation helpers.
 *
 * These checks are intentionally dependency-free (no stellar-sdk) so they can
 * run in the browser and in low-trust environments.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const ACCOUNT_LENGTH = 56;

/** Base32 (RFC 4648) check for Stellar account ids. */
export function isValidPublicKey(publicKey: string): boolean {
  if (typeof publicKey !== 'string' || publicKey.length !== ACCOUNT_LENGTH) {
    return false;
  }
  const version = publicKey[0];
  if (version !== 'G' && version !== 'M') {
    return false;
  }
  for (let i = 0; i < publicKey.length; i++) {
    if (!ALPHABET.includes(publicKey[i])) {
      return false;
    }
  }
  return true;
}

/** Stellar asset codes: 1-12 alphanumeric characters. */
export function isValidAssetCode(code: string): boolean {
  return typeof code === 'string' && /^[a-zA-Z0-9]{1,12}$/.test(code);
}

/** Memo text length guard (max 28 bytes for text memos). */
export function isValidMemo(memo: string | null | undefined): boolean {
  if (memo === null || memo === undefined || memo === '') {
    return true;
  }
  // TextEncoder is available in browsers and Node >= 11, keeping this isomorphic.
  return new TextEncoder().encode(memo).length <= 28;
}

/** Memo types supported by the Stellar protocol. */
export type MemoType = 'none' | 'text' | 'hash' | 'id';

export function isValidMemoType(type: string): type is MemoType {
  return type === 'none' || type === 'text' || type === 'hash' || type === 'id';
}

/**
 * Best-effort checksum validation of a strkey (G/M addresses).
 * `true` when the address is structurally valid; a strkey CRC16-XModem
 * checksum is validated when the algorithm is available.
 */
export function verifyStrkeyChecksum(publicKey: string): boolean {
  if (!isValidPublicKey(publicKey)) {
    return false;
  }
  // CRC16-XModem over base32-decoded payload (version byte + 32 bytes + 2 bytes checksum)
  const alphabetIndex = new Map<string, number>();
  for (let i = 0; i < ALPHABET.length; i++) {
    alphabetIndex.set(ALPHABET[i], i);
  }
  const decoded: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;
  for (const char of publicKey) {
    const value = alphabetIndex.get(char);
    if (value === undefined) {
      return false;
    }
    buffer = (buffer << 5) | value;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      decoded.push((buffer >>> (bitsLeft - 8)) & 0xff);
      bitsLeft -= 8;
    }
  }
  const data = decoded.slice(0, decoded.length - 2);
  const expected = decoded.slice(decoded.length - 2);
  const crc = crc16Xmodem(data);
  return (crc & 0xff) === expected[0] && crc >>> 8 === expected[1];
}

function crc16Xmodem(bytes: number[]): number {
  let crc = 0x0000;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
}
