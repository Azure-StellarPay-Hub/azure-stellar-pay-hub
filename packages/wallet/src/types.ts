import { WalletProvider } from '@stellar-pay/types';

export type WalletProviderId = `${WalletProvider}`;

export type NetworkId = 'public' | 'testnet' | 'standalone' | 'unknown';

/** Unified contract implemented by each wallet adapter. */
export interface WalletAdapter {
  readonly id: WalletProviderId;
  /** Prompt the user to approve the connection; resolves to the public key. */
  requestAccess(): Promise<string>;
  isConnected(): Promise<boolean>;
  getPublicKey(): Promise<string>;
  /** Sign a transaction envelope (base64 XDR), returning signed base64 XDR. */
  signTx(xdr: string): Promise<string>;
  /** Sign an arbitrary UTF-8 message; resolves to a base64 signature. */
  signMessage(message: string): Promise<string>;
  /** Best-effort network detection (Freighter reports it; others default). */
  getNetworkId(): Promise<NetworkId>;
  disconnect?(): Promise<void>;
}

export interface PersistedWallet {
  provider: WalletProviderId;
  publicKey: string;
}

export const STORAGE_KEY = 'stellar-pay:wallet';
