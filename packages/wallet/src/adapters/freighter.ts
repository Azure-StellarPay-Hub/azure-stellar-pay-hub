import type { WalletAdapter, NetworkId } from '../types';

type FreighterApi = typeof import('@stellar/freighter-api');

const NETWORK_NAMES: Record<string, NetworkId> = {
  'Public Global Stellar Network ; September 2015': 'public',
  'Test SDF Network ; September 2015': 'testnet',
  'Standalone Network ; February 2017': 'standalone',
};

/**
 * Freighter adapter (browser extension).
 * API v2: requestAccess, getPublicKey, signTransaction, signBlob, isConnected, getNetwork.
 */
export class FreighterAdapter implements WalletAdapter {
  readonly id = 'FREIGHTER' as const;

  private api(): FreighterApi {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@stellar/freighter-api') as FreighterApi;
  }

  async requestAccess(): Promise<string> {
    const { requestAccess, getPublicKey } = this.api();
    await requestAccess();
    return getPublicKey();
  }

  async isConnected(): Promise<boolean> {
    try {
      return await this.api().isConnected();
    } catch {
      return false;
    }
  }

  async getPublicKey(): Promise<string> {
    return this.api().getPublicKey();
  }

  async signTx(xdr: string): Promise<string> {
    const signed = await this.api().signTransaction(xdr);
    if (!signed) {
      throw new Error('Transaction signing was rejected');
    }
    return signed;
  }

  async signMessage(message: string): Promise<string> {
    // Freighter v2: signBlob replaces signMessage. Sign the message as a blob (UTF-8 bytes).
    const result = await this.api().signBlob(message);
    const signature =
      typeof result === 'string' ? result : (result as { signature: string }).signature;
    if (!signature) {
      throw new Error(
        result && typeof result === 'object' && 'error' in result
          ? (result as unknown as { error: string }).error
          : 'Message signing was rejected',
      );
    }
    return signature;
  }

  async getNetworkId(): Promise<NetworkId> {
    try {
      const network = await this.api().getNetwork();
      // v2: getNetwork returns { network: string; networkPassphrase: string }
      const passphrase =
        typeof network === 'string'
          ? network
          : (network as { networkPassphrase: string }).networkPassphrase;
      return NETWORK_NAMES[passphrase] ?? 'unknown';
    } catch {
      return 'unknown';
    }
  }
}
