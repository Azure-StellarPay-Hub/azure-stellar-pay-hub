import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createAdapter } from './registry';
import { STORAGE_KEY, type NetworkId, type PersistedWallet, type WalletProviderId } from './types';

export interface WalletContextValue {
  provider: WalletProviderId | null;
  publicKey: string | null;
  network: NetworkId;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  /** Preferred network (defaults to the app's target network). */
  preferredNetwork: NetworkId;
  connect(provider: WalletProviderId, opts?: { preferredNetwork?: NetworkId }): Promise<string>;
  disconnect(): Promise<void>;
  signTx(xdr: string): Promise<string>;
  signMessage(message: string): Promise<string>;
  switchWallet(provider: WalletProviderId): Promise<string>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export interface WalletProviderProps {
  children: ReactNode;
  /** App-level default network, e.g. "testnet". */
  defaultNetwork?: NetworkId;
  /** Called whenever a wallet successfully connects (e.g. link to API). */
  onConnected?: (wallet: { provider: WalletProviderId; publicKey: string }) => void;
}

function readStored(): PersistedWallet | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedWallet) : null;
  } catch {
    return null;
  }
}

export function WalletProvider({ children, defaultNetwork = 'testnet', onConnected }: WalletProviderProps) {
  const [provider, setProvider] = useState<WalletProviderId | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<NetworkId>(defaultNetwork);
  const [preferredNetwork, setPreferredNetwork] = useState<NetworkId>(defaultNetwork);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onConnectedRef = useRef(onConnected);
  onConnectedRef.current = onConnected;

  const store = useCallback((wallet: PersistedWallet) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const clearStored = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }, []);

  const connect = useCallback(
    async (target: WalletProviderId, opts?: { preferredNetwork?: NetworkId }): Promise<string> => {
      setConnecting(true);
      setError(null);
      try {
        const adapter = createAdapter(target);
        const key = await adapter.requestAccess();
        const detected = await adapter.getNetworkId();
        const active = opts?.preferredNetwork ?? (detected !== 'unknown' ? detected : defaultNetwork);
        setProvider(target);
        setPublicKey(key);
        setNetwork(active);
        setPreferredNetwork(active);
        store({ provider: target, publicKey: key });
        onConnectedRef.current?.({ provider: target, publicKey: key });
        return key;
      } catch (err) {
        setError((err as Error).message ?? 'Failed to connect wallet');
        throw err;
      } finally {
        setConnecting(false);
      }
    },
    [defaultNetwork, store],
  );

  const disconnect = useCallback(async () => {
    try {
      if (provider) {
        await createAdapter(provider).disconnect?.();
      }
    } finally {
      setProvider(null);
      setPublicKey(null);
      setNetwork(preferredNetwork);
      clearStored();
    }
  }, [provider, preferredNetwork, clearStored]);

  const signTx = useCallback(async (xdr: string): Promise<string> => {
    if (!provider) {
      throw new Error('No wallet connected');
    }
    return createAdapter(provider).signTx(xdr);
  }, [provider]);

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!provider) {
        throw new Error('No wallet connected');
      }
      try {
        return await createAdapter(provider).signMessage(message);
      } catch (err) {
        setError((err as Error).message);
        throw err;
      }
    },
    [provider],
  );

  const switchWallet = useCallback(
    async (target: WalletProviderId): Promise<string> => {
      if (target === provider) {
        return publicKey ?? '';
      }
      await disconnect();
      return connect(target);
    },
    [provider, publicKey, disconnect, connect],
  );

  // Auto-reconnect on mount.
  useEffect(() => {
    const stored = readStored();
    if (!stored) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const adapter = createAdapter(stored.provider);
        const stillConnected = await adapter.isConnected();
        if (cancelled) {
          return;
        }
        if (stillConnected) {
          const key = await adapter.getPublicKey().catch(() => stored.publicKey);
          const detected = await adapter.getNetworkId().catch(() => 'unknown' as NetworkId);
          setProvider(stored.provider);
          setPublicKey(key);
          if (detected !== 'unknown') {
            setNetwork(detected);
          }
        } else {
          clearStored();
        }
      } catch {
        clearStored();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      provider,
      publicKey,
      network,
      preferredNetwork,
      connected: Boolean(provider && publicKey),
      connecting,
      error,
      connect,
      disconnect,
      signTx,
      signMessage,
      switchWallet,
    }),
    [provider, publicKey, network, preferredNetwork, connecting, error, connect, disconnect, signTx, signMessage, switchWallet],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a <WalletProvider>');
  }
  return ctx;
}
