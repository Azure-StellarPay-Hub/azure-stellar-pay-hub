import type { NetworkId, WalletAdapter } from '../types';

// @albedo-link/intent API (v0.13): retrievePublicKey(), signTransaction({xdr, network}),
// signBlob({blob, network}). Networks: 'test' | 'public'.
type AlbedoApi = {
  retrievePublicKey: (opts?: Record<string, unknown>) => Promise<string | { publicKey: string }>;
  signTransaction: (opts: { xdr: string; network?: 'test' | 'public' }) => Promise<string | { signedXdr: string }>;
  signBlob: (opts: { blob: string; network?: 'test' | 'public' }) => Promise<string | { signature: string }>;
};

export class AlbedoAdapter implements WalletAdapter {
  readonly id = 'ALBEDO' as const;

  private api(): AlbedoApi {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@albedo-link/intent') as AlbedoApi;
  }

  private albedoNetwork(network: NetworkId): 'test' | 'public' {
    return network === 'public' ? 'public' : 'test';
  }

  async requestAccess(): Promise<string> {
    const result = await this.api().retrievePublicKey();
    const publicKey = typeof result === 'string' ? result : result.publicKey;
    if (!publicKey) {
      throw new Error('Albedo connection was rejected');
    }
    return publicKey;
  }

  async isConnected(): Promise<boolean> {
    try {
      return Boolean(await this.requestAccess());
    } catch {
      return false;
    }
  }

  async getPublicKey(): Promise<string> {
    return this.requestAccess();
  }

  async signTx(xdr: string): Promise<string> {
    const result = await this.api().signTransaction({
      xdr,
      network: this.albedoNetwork(await this.getNetworkId()),
    });
    return typeof result === 'string' ? result : result.signedXdr;
  }

  async signMessage(message: string): Promise<string> {
    // Albedo's signBlob signs the base64-encoded payload; we pass the UTF-8
    // message base64-encoded so the resulting signature covers the message bytes.
    const blob = btoa(unescape(encodeURIComponent(message)));
    const result = await this.api().signBlob({
      blob,
      network: this.albedoNetwork(await this.getNetworkId()),
    });
    const signature = typeof result === 'string' ? result : result.signature;
    if (!signature) {
      throw new Error('Albedo message signing was rejected');
    }
    return signature;
  }

  async getNetworkId(): Promise<NetworkId> {
    return 'unknown';
  }
}
