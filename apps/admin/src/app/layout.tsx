import type { Metadata } from 'next';
import { ToastProvider } from '@stellar-pay/ui/dist/components/toast';
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
          <main className="mx-auto max-w-6xl p-6 md:p-8">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
