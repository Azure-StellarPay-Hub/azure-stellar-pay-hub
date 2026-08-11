'use client';

import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Badge, Card, CardContent, Skeleton } from '@stellar-pay/ui';
import { useWallet } from '@stellar-pay/wallet';
import { api } from '@/lib/api';
import { formatDateTime, shortKey, STATUS_STYLES } from '@/lib/format';
import type { TransactionRecord } from '@stellar-pay/types';

export default function HistoryPage() {
  const { connected } = useWallet();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connected) {
      setLoading(false);
      return;
    }
    void api.payments
      .list({ page: 1, pageSize: 50 })
      .then((res) => setTransactions(res.data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [connected]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transaction history</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All payments sent and received from your linked wallets.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !connected ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              Connect a wallet to view your history.
            </p>
          ) : transactions.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      tx.direction === 'OUTGOING'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {tx.direction === 'OUTGOING' ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : (
                      <ArrowDownLeft className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {tx.direction === 'OUTGOING' ? 'To' : 'From'}{' '}
                      <span className="font-mono">
                        {shortKey(tx.toPublicKey ?? tx.fromPublicKey ?? '')}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(tx.createdAt)} · {tx.kind}
                      {tx.memo ? ` · memo: ${tx.memo}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">
                      {tx.direction === 'OUTGOING' ? '−' : '+'}
                      {tx.amount} {tx.assetCode}
                    </p>
                    <Badge variant="outline" className={STATUS_STYLES[tx.status] ?? ''}>
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
