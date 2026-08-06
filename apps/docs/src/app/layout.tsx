import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import './globals.css';
import { listDocs } from '@/lib/docs';

export const metadata: Metadata = {
  title: 'StellarPay Hub — Documentation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const docs = listDocs();
  return (
    <html lang="en" className="dark">
      <body>
        <div className="flex min-h-screen">
          <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-card/60 backdrop-blur md:flex">
            <Link href="/" className="flex h-16 items-center gap-2 border-b border-border px-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500">
                <BookOpen className="h-4 w-4 text-white" />
              </span>
              <span className="font-semibold">
                StellarPay <span className="text-gradient">Docs</span>
              </span>
            </Link>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {docs.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/${doc.slug}`}
                  className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {doc.title}
                </Link>
              ))}
            </nav>
            <div className="border-t border-border p-4 text-xs text-muted-foreground">
              Docs render the markdown in <code className="rounded bg-accent px-1">/docs</code>
            </div>
          </aside>
          <div className="flex-1 md:pl-60">
            <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
