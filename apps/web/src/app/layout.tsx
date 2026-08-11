'use client';

import { WalletProvider } from '@stellar-pay/wallet';
import { ToastProvider } from '@stellar-pay/ui';
import { AuthProvider } from '@/lib/auth';
import { Header } from '@/components/header';
import { RealtimeProvider } from '@/components/realtime-provider';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <WalletProvider defaultNetwork="testnet">
          <AuthProvider>
            <ToastProvider>
              <RealtimeProvider>
                <div className="relative flex min-h-screen flex-col overflow-x-clip">
                  <Header />
                  <main className="flex-1">{children}</main>
                </div>
              </RealtimeProvider>
            </ToastProvider>
          </AuthProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
