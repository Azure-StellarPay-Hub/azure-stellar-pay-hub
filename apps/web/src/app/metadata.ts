import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'StellarPay Hub — Payments on Stellar',
  description:
    'Send and receive XLM & Stellar assets, create payment links and invoices, and power cross-border payments — powered by Soroban.',
  keywords: ['stellar', 'soroban', 'payments', 'xlm', 'usdc', 'wallet'],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'StellarPay Hub — Payments on Stellar',
    description:
      'Send XLM and Stellar assets, collect with payment links and invoices, and move money across borders.',
    type: 'website',
    images: [{ url: '/logo.svg', width: 220, height: 48, alt: 'StellarPay Hub' }],
  },
  twitter: {
    card: 'summary',
    title: 'StellarPay Hub — Payments on Stellar',
    description:
      'Send XLM and Stellar assets, collect with payment links and invoices, and move money across borders.',
    images: ['/logo.svg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a12',
};
