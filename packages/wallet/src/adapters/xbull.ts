import type { NetworkId, WalletAdapter } from '../types';

// The xBull SDK keeps evolving its method surface; duck-typing keeps this
// adapter working across versions. See packages/wallet/README.md.
type XBullBridge = {
  connect: () => Promise<string>;
  getPublicKey?: () => Promise<string>;
  sign: (input: string | { xdr: string; networkPassphrase?: string; publicKey?: string }) => Promise<string>;
  signXdr?: (xdr: string) => Promise<string>;
  signMessage?: (message: string) => Promise<string>;
  close?: () => Promise<void>;
  closeConnections?: () => Promise<void>;
};

export class XBullAdapter implements WalletAdapter {
  readonly id = 'XBULL' as const;

  private bridge: XBullBridge | null = null;

  private getBridge(): XBullBridge {
    if (this.bridge) {
      return this.bridge;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@creit.tech/xbull-wallet-connect') as unknown as Record<string, unknown>;
    const Ctor =
      (mod.default as unknown) ??
      (mod.XBullWalletConnect as unknown) ??
      (mod as unknown);
    if (typeof Ctor !== 'function') {
      throw new Error('xBull wallet SDK could not be loaded');
    }
    this.bridge = new (Ctor as new () => XBullBridge)();
    return this.bridge;
  }

  async requestAccess(): Promise<string> {
    const bridge = this.getBridge();
    const publicKey = await bridge.connect();
    if (!publicKey) {
      throw new Error('xBull connection was rejected');
    }
    return publicKey;
  }

  async isConnected(): Promise<boolean> {
    try {
      const bridge = this.getBridge();
      if (bridge.getPublicKey) {
        return Boolean(await bridge.getPublicKey());
      }
      return true;
    } catch {
      return false;
    }
  }

  async getPublicKey(): Promise<string> {
    const bridge = this.getBridge();
    if (bridge.getPublicKey) {
      return bridge.getPublicKey();
    }
    return bridge.connect();
  }

  async signTx(xdr: string): Promise<string> {
    const bridge = this.getBridge();
    try {
      return await bridge.sign({ xdr });
    } catch {
      if (bridge.signXdr) {
        return bridge.signXdr(xdr);
      }
      throw new Error('xBull transaction signing failed');
    }
  }

  async signMessage(message: string): Promise<string> {
    const bridge = this.getBridge();
    if (!bridge.signMessage) {
      throw new Error(
        'xBull message signing is not supported by the installed SDK version; use Freighter or Albedo for wallet auth',
      );
    }
    const result = await bridge.signMessage(message);
    const signature =
      typeof result === 'string' ? result : (result as { signedMessage?: string }).signedMessage;
    if (!signature) {
      throw new Error('xBull message signing was rejected');
    }
    return signature;
  }

  async getNetworkId(): Promise<NetworkId> {
    // xBull does not expose network detection; the app declares the target network.
    return 'unknown';
  }

  async disconnect(): Promise<void> {
    const bridge = this.bridge;
    if (bridge?.close) {
      await bridge.close();
    } else if (bridge?.closeConnections) {
      await bridge.closeConnections();
    }
    this.bridge = null;
  }
}
