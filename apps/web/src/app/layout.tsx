import type { Metadata, Viewport } from 'next';
import { WalletProvider } from '@stellar-pay/wallet';
import { ToastProvider } from '@stellar-pay/ui';
import { AuthProvider } from '@/lib/auth';
import { Header } from '@/components/header';
import { RealtimeProvider } from '@/components/realtime-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'StellarPay Hub — Payments on Stellar',
  description:
    'Send and receive XLM & Stellar assets, create payment links and invoices, and power cross-border payments — powered by Soroban.',
  keywords: ['stellar', 'soroban', 'payments', 'xlm', 'usdc', 'wallet'],
};

export const viewport: Viewport = {
  themeColor: '#0a0a12',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <WalletProvider defaultNetwork="testnet">
          <AuthProvider>
            <RealtimeProvider>
              <ToastProvider>
                <div className="relative flex min-h-screen flex-col overflow-x-clip">
                  <Header />
                  <main className="flex-1">{children}</main>
                </div>
              </ToastProvider>
            </RealtimeProvider>
          </AuthProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
