'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { LogOut, Wallet, ChevronDown, Check, Loader2 } from 'lucide-react';
import { Button } from '@stellar-pay/ui';
import { SUPPORTED_WALLETS, useWallet } from '@stellar-pay/wallet';
import { useAuth } from '@/lib/auth';
import { shortKey } from '@/lib/format';

export function WalletButton() {
  const { connected, publicKey, provider, disconnect, switchWallet, connecting } = useWallet();
  const { authenticated, loginWithWallet, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleConnect = async (id: (typeof SUPPORTED_WALLETS)[number]['id']) => {
    setBusy(true);
    try {
      await loginWithWallet(id);
      setOpen(false);
    } catch {
      /* error surfaced by context */
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    await logout();
    await disconnect();
    setOpen(false);
  };

  const activeLabel = useMemo(
    () => SUPPORTED_WALLETS.find((w) => w.id === provider)?.name ?? '',
    [provider],
  );

  if (connected && publicKey) {
    return (
      <div ref={containerRef} className="relative">
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          <Wallet className="h-4 w-4 text-indigo-400" />
          <span className="font-mono">{shortKey(publicKey)}</span>
          <span className="text-[10px] uppercase text-muted-foreground">{activeLabel}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
        {open && (
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-popover p-2 shadow-2xl animate-in fade-in-0 zoom-in-95">
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              {authenticated ? 'Signed in' : 'Wallet connected'}
            </div>
            <div className="px-2 pb-2 font-mono text-xs text-foreground">{publicKey}</div>
            <div className="mb-1 px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              Switch wallet
            </div>
            {SUPPORTED_WALLETS.map((w) => (
              <button
                key={w.id}
                onClick={() => void switchWallet(w.id)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-accent"
              >
                <span>{w.name}</span>
                {provider === w.id && <Check className="h-4 w-4 text-indigo-400" />}
              </button>
            ))}
            <button
              onClick={() => void handleDisconnect()}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="gradient"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        disabled={connecting || busy}
      >
        {connecting || busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        Connect wallet
      </Button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border bg-popover p-2 shadow-2xl animate-in fade-in-0 zoom-in-95">
          {SUPPORTED_WALLETS.map((w) => (
            <button
              key={w.id}
              onClick={() => void handleConnect(w.id)}
              className="flex w-full flex-col rounded-lg px-3 py-2.5 text-left hover:bg-accent"
            >
              <span className="text-sm font-medium text-foreground">{w.name}</span>
              <span className="text-xs text-muted-foreground">{w.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
