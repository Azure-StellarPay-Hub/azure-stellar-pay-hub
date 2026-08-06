'use client';

import { use, useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button, Card, CardContent } from '@stellar-pay/ui';
import { useWallet } from '@stellar-pay/wallet';
import { api } from '@/lib/api';

interface InvoiceCheckout {
  number: string;
  title: string;
  description: string | null;
  items: Array<{ name: string; quantity: number; unitPrice: string; currency: string }>;
  amount: string;
  assetCode: string;
  status: string;
  merchantName: string;
}

export default function InvoiceCheckoutPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = use(params);
  const { connect, publicKey, signTx, connected } = useWallet();
  const [invoice, setInvoice] = useState<InvoiceCheckout | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'paying' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    void api
      .checkout.invoice(number)
      .then((data) => {
        setInvoice(data as unknown as InvoiceCheckout);
        setStatus(data.status === 'PAID' ? 'success' : 'ready');
      })
      .catch((err) => {
        setError((err as Error).message);
        setStatus('error');
      });
  }, [number]);

  const pay = async () => {
    if (!publicKey) {
      return;
    }
    setStatus('paying');
    try {
      const intent = await api.checkout.payInvoice(number, publicKey);
      const signedXdr = await signTx(intent.unsignedXdr);
      const result = await api.request<{ status: string }>({
        method: 'POST',
        path: `/checkout/transactions/${intent.id}/submit`,
        body: { signedXdr },
      });
      setStatus(result.status === 'SUCCEEDED' ? 'success' : 'error');
      setError(result.status);
    } catch (err) {
      setStatus('error');
      setError((err as Error).message);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Unable to load invoice</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" />
        <h1 className="mt-4 text-2xl font-bold">Invoice {invoice?.number} paid</h1>
        <p className="mt-2 text-sm text-muted-foreground">Thank you for your payment.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{invoice?.merchantName}</p>
              <h1 className="text-xl font-bold">{invoice?.title}</h1>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{invoice?.number}</span>
          </div>

          <div className="divide-y divide-border/60 rounded-xl border border-border">
            {invoice?.items.map((item, index) => (
              <div key={index} className="flex justify-between px-4 py-3 text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span className="font-mono">
                  {Number(item.unitPrice) * item.quantity} {item.currency}
                </span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-3 font-semibold">
              <span>Total</span>
              <span className="font-mono">
                {invoice?.amount} {invoice?.assetCode}
              </span>
            </div>
          </div>

          {!connected ? (
            <Button variant="gradient" className="w-full" size="lg" onClick={() => void connect('FREIGHTER')}>
              Connect wallet to pay
            </Button>
          ) : (
            <Button variant="gradient" className="w-full" size="lg" onClick={() => void pay()} disabled={status === 'paying'}>
              {status === 'paying' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Pay {invoice?.amount} {invoice?.assetCode}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
