import { describe, expect, it } from '@jest/globals';
import { createAdapter, SUPPORTED_WALLETS } from './registry';
import { STORAGE_KEY } from './types';

describe('createAdapter', () => {
  it('creates a Freighter adapter', () => {
    const adapter = createAdapter('FREIGHTER');
    expect(adapter.id).toBe('FREIGHTER');
    expect(typeof adapter.requestAccess).toBe('function');
    expect(typeof adapter.isConnected).toBe('function');
    expect(typeof adapter.getPublicKey).toBe('function');
    expect(typeof adapter.signTx).toBe('function');
    expect(typeof adapter.signMessage).toBe('function');
    expect(typeof adapter.getNetworkId).toBe('function');
  });

  it('creates an xBull adapter', () => {
    const adapter = createAdapter('XBULL');
    expect(adapter.id).toBe('XBULL');
    expect(typeof adapter.requestAccess).toBe('function');
    expect(typeof adapter.disconnect).toBe('function');
  });

  it('creates an Albedo adapter', () => {
    const adapter = createAdapter('ALBEDO');
    expect(adapter.id).toBe('ALBEDO');
    expect(typeof adapter.requestAccess).toBe('function');
    expect(typeof adapter.signTx).toBe('function');
    expect(typeof adapter.signMessage).toBe('function');
  });

  it('throws for an unknown provider', () => {
    expect(() => createAdapter('UNKNOWN' as unknown as Parameters<typeof createAdapter>[0])).toThrow('Unsupported wallet provider');
  });

  it('each call creates a new instance', () => {
    const a = createAdapter('FREIGHTER');
    const b = createAdapter('FREIGHTER');
    expect(a).not.toBe(b);
  });
});

describe('SUPPORTED_WALLETS', () => {
  it('has three wallet entries', () => {
    expect(SUPPORTED_WALLETS).toHaveLength(3);
  });

  it('includes Freighter', () => {
    const f = SUPPORTED_WALLETS.find((w) => w.id === 'FREIGHTER');
    expect(f).toBeDefined();
    expect(f!.name).toBe('Freighter');
    expect(typeof f!.description).toBe('string');
  });

  it('includes xBull', () => {
    const x = SUPPORTED_WALLETS.find((w) => w.id === 'XBULL');
    expect(x).toBeDefined();
    expect(x!.name).toBe('xBull');
  });

  it('includes Albedo', () => {
    const a = SUPPORTED_WALLETS.find((w) => w.id === 'ALBEDO');
    expect(a).toBeDefined();
    expect(a!.name).toBe('Albedo');
  });

  it('all wallet IDs match created adapters', () => {
    for (const wallet of SUPPORTED_WALLETS) {
      const adapter = createAdapter(wallet.id);
      expect(adapter.id).toBe(wallet.id);
    }
  });
});

describe('STORAGE_KEY', () => {
  it('is a non-empty string', () => {
    expect(typeof STORAGE_KEY).toBe('string');
    expect(STORAGE_KEY.length).toBeGreaterThan(0);
  });

  it('follows the stellar-pay namespace convention', () => {
    expect(STORAGE_KEY).toBe('stellar-pay:wallet');
  });
});
