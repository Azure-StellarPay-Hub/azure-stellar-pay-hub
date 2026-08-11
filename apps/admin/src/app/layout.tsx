import type { Metadata } from 'next';
import { ToastProvider } from '@stellar-pay/ui';
import NavSidebar from './_nav-sidebar';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'StellarPay Hub \u2014 Admin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <ToastProvider>
          <div className="flex min-h-screen">
            <NavSidebar />
            <div className="flex-1 md:pl-60">
              <main className="mx-auto max-w-6xl p-6 md:p-8">{children}</main>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
