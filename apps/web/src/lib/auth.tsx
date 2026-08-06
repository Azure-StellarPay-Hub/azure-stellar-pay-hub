'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useWallet, type WalletProviderId } from '@stellar-pay/wallet';
import { api, clearTokens, setTokens, getToken } from './api';
import type { User } from '@stellar-pay/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  loginWithWallet: (providerId?: WalletProviderId) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { connect, signMessage, disconnect, provider } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loginWithWallet = useCallback(async (providerId?: WalletProviderId) => {
    const activeProvider = providerId ?? provider ?? 'FREIGHTER';
    const key = await connect(activeProvider);
    const challenge = await api.auth.challenge(key);
    const signature = await signMessage(challenge.message);
    const result = await api.auth.verify({
      publicKey: key,
      signature,
      message: challenge.message,
      nonce: challenge.nonce,
      provider: activeProvider,
      deviceName: navigator.userAgent.slice(0, 120),
    });
    setTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
  }, [connect, signMessage, provider]);

  void loading;

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      /* token may already be invalid */
    }
    await disconnect();
    clearTokens();
    setUser(null);
  }, [disconnect]);

  // Restore session on mount.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .users.me()
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  // Listen for global token-invalid events.
  useEffect(() => {
    const handler = () => {
      setUser(null);
      void disconnect();
    };
    window.addEventListener('stellar-pay:unauthorized', handler);
    return () => window.removeEventListener('stellar-pay:unauthorized', handler);
  }, [disconnect]);

  return (
    <AuthContext.Provider
      value={{ user, loading, authenticated: Boolean(user), loginWithWallet, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}

export type { WalletProviderId };
