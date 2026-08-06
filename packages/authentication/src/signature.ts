import { Keypair, xdr } from '@stellar/stellar-sdk';

export interface SignatureInput {
  publicKey: string;
  /** The exact message bytes that were signed. */
  message: string;
  /** Signature encoded as hex or base64. */
  signature: string;
}

function decodeSignature(signature: string): Buffer | null {
  const hex = signature.replace(/\s+/g, '');
  if (/^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0 && hex.length >= 128) {
    try {
      return Buffer.from(hex, 'hex');
    } catch {
      /* fall through */
    }
  }
  try {
    return Buffer.from(signature, 'base64');
  } catch {
    return null;
  }
}

/**
 * Verify an Ed25519 signature produced by a Stellar wallet over the given
 * message. Accepts hex or base64 signature encodings.
 */
export function verifyMessageSignature({ publicKey, message, signature }: SignatureInput): boolean {
  try {
    const keypair = Keypair.fromPublicKey(publicKey);
    const sig = decodeSignature(signature);
    if (!sig) {
      return false;
    }
    return keypair.verify(Buffer.from(message, 'utf8'), sig);
  } catch {
    return false;
  }
}

/**
 * Freighter's `signMessage` signs the hex-decoded bytes when the message is
 * valid hex, otherwise the raw UTF-8 bytes. Verify both interpretations.
 */
export function verifyFreighterMessageSignature(input: SignatureInput): boolean {
  if (verifyMessageSignature(input)) {
    return true;
  }
  if (/^[0-9a-fA-F]+$/.test(input.message) && input.message.length % 2 === 0) {
    return verifyMessageSignature({
      ...input,
      message: Buffer.from(input.message, 'hex').toString('utf8'),
    });
  }
  return false;
}

type DecoratedSignatureLike = {
  hint(): { toString(encoding?: string): string };
};

/**
 * xdr envelope shape varies across @stellar/stellar-base versions (flat
 * `signatures()` on old versions, `v0()/v1()/feeBump()` variants on newer
 * ones). Duck-type through the union so this keeps compiling and working.
 */
type EnvelopeLike = {
  signatures?: () => DecoratedSignatureLike[];
  v0?: () => { signatures(): DecoratedSignatureLike[] };
  v1?: () => { signatures(): DecoratedSignatureLike[] };
  feeBump?: () => { signatures(): DecoratedSignatureLike[] };
};

function envelopeSignatures(env: EnvelopeLike): DecoratedSignatureLike[] {
  const flat = env.signatures?.();
  if (flat && flat.length > 0) {
    return flat;
  }
  for (const variant of ['v0', 'v1', 'feeBump'] as const) {
    const accessor = env[variant];
    if (accessor) {
      const inner = accessor();
      if (inner?.signatures) {
        return inner.signatures();
      }
    }
  }
  return [];
}

/** Verify that a signed XDR envelope was signed by the expected public key. */
export function verifySignedXdrOwner(signedXdr: string, expectedPublicKey: string): boolean {
  try {
    const envelope = xdr.TransactionEnvelope.fromXDR(
      signedXdr,
      'base64',
    ) as unknown as EnvelopeLike;
    const keyTail = expectedPublicKey.slice(-4);
    for (const signature of envelopeSignatures(envelope)) {
      const hint = signature.hint().toString('hex');
      // The signature hint is the last 4 bytes of the signer's ed25519 key.
      if (hint.toLowerCase() === keyTail.toLowerCase()) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
