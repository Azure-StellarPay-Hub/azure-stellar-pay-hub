'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
          <Image
            src="/logo.svg"
            alt="StellarPay Hub logo"
            className="h-9 w-auto"
            width={220}
            height={48}
            priority
          />
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
