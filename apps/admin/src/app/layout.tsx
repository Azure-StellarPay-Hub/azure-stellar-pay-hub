import type { Metadata } from 'next';
import Link from 'next/link';
import { Activity, Bell, CreditCard, LayoutDashboard, Settings, Shield, Store, Users } from 'lucide-react';
import { ToastProvider } from '@stellar-pay/ui';
import './globals.css';

export const metadata: Metadata = {
  title: 'StellarPay Hub — Admin',
};

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/merchants', label: 'Merchants', icon: Store },
  { href: '/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/assets', label: 'Assets', icon: Shield },
  { href: '/audit', label: 'Audit logs', icon: Activity },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <ToastProvider>
          <div className="flex min-h-screen">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-card/60 backdrop-blur md:flex">
              <Link href="/" className="flex h-16 items-center gap-2 border-b border-border px-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500">
                  <Shield className="h-4 w-4 text-white" />
                </span>
                <span className="font-semibold">
                  StellarPay <span className="text-gradient">Admin</span>
                </span>
              </Link>
              <nav className="flex-1 space-y-1 p-3">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <item.icon className="h-4 w-4" /> {item.label}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-border p-4 text-xs text-muted-foreground">
                v0.1.0 · mainnet-ready scaffolding
              </div>
            </aside>
            <div className="flex-1 md:pl-60">
              <main className="mx-auto max-w-6xl p-6 md:p-8">{children}</main>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
