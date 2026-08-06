'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap } from 'lucide-react';
import { WalletButton } from './wallet-button';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/send', label: 'Send' },
  { href: '/receive', label: 'Receive' },
  { href: '/history', label: 'History' },
  { href: '/merchant', label: 'Merchant' },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 shadow-lg shadow-purple-500/30">
            <Zap className="h-4 w-4 text-white" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            StellarPay <span className="text-gradient">Hub</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname?.startsWith(item.href)
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
