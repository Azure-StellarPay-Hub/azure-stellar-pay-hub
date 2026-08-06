import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@stellar-pay/ui';
import { listDocs } from '@/lib/docs';

export default function DocsHome() {
  const docs = listDocs();
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
      <p className="mt-2 text-muted-foreground">
        Everything you need to run, extend and deploy Azure StellarPay Hub.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {docs.map((doc) => (
          <Link key={doc.slug} href={`/${doc.slug}`}>
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-indigo-500/40">
              <CardContent className="flex h-full flex-col justify-between p-5">
                <div>
                  <h2 className="font-semibold">{doc.title}</h2>
                  {doc.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{doc.description}</p>
                  )}
                </div>
                <span className="mt-3 flex items-center gap-1 text-sm text-indigo-400">
                  Read <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
