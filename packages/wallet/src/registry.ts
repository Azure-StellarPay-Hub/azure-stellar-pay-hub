import { AlbedoAdapter } from './adapters/albedo';
import { FreighterAdapter } from './adapters/freighter';
import { XBullAdapter } from './adapters/xbull';
import type { WalletAdapter, WalletProviderId } from './types';

const REGISTRY: Record<WalletProviderId, () => WalletAdapter> = {
  FREIGHTER: () => new FreighterAdapter(),
  XBULL: () => new XBullAdapter(),
  ALBEDO: () => new AlbedoAdapter(),
};

export function createAdapter(provider: WalletProviderId): WalletAdapter {
  const factory = REGISTRY[provider];
  if (!factory) {
    throw new Error(`Unsupported wallet provider: ${provider}`);
  }
  return factory();
}

export const SUPPORTED_WALLETS: Array<{ id: WalletProviderId; name: string; description: string }> = [
  { id: 'FREIGHTER', name: 'Freighter', description: 'The Stellar browser extension wallet' },
  { id: 'XBULL', name: 'xBull', description: 'Lightweight Stellar wallet for web & mobile' },
  { id: 'ALBEDO', name: 'Albedo', description: 'Web wallet with a clean signing flow' },
];
