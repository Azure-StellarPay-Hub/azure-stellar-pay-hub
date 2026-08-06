import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import './globals.css';
import { SearchForm } from './search-form';

export const metadata: Metadata = {
  title: 'StellarPay Explorer — Transaction explorer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500">
                <Compass className="h-4 w-4 text-white" />
              </span>
              <span className="font-semibold">
                StellarPay <span className="text-gradient">Explorer</span>
              </span>
            </Link>
            <SearchForm />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
