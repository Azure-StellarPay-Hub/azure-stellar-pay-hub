/** Wallet authentication challenge. */
export interface AuthChallenge {
  nonce: string;
  message: string;
  expiresAt: string;
}

/** Successful wallet-signature verification. */
export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: unknown;
  wallet: unknown;
}

/** Wallet signing capability flags (feature detection). */
export interface WalletCapabilities {
  signTransaction: boolean;
  signMessage: boolean;
  getPublicKey: boolean;
  networkDetection: boolean;
}
