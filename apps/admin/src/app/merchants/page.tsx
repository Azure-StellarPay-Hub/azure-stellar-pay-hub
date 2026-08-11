'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, useToast } from '@stellar-pay/ui';
import { adminApi } from '@/lib/api';
import { formatDate } from '@/lib/format';

interface AdminMerchant {
  id: string;
  name: string;
  slug: string;
  status: string;
  kycStatus: string;
  settlementAssetCode: string;
  createdAt: string;
  user: { email: string | null };
}

export default function MerchantsPage() {
  const toast = useToast();
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);

  const load = () =>
    void adminApi.admin
      .merchants()
      .then((res) => setMerchants(res.data as unknown as AdminMerchant[]));

  useEffect(load, []);

  const setStatus = async (id: string, status: string) => {
    await adminApi.admin.updateMerchantStatus(id, { status });
    toast.success(`Merchant ${status.toLowerCase()}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Merchants</h1>
        <p className="text-sm text-muted-foreground">Onboarding reviews and merchant lifecycle</p>
      </div>
      <Card>
        <CardContent className="p-0">
          {merchants.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No merchants yet</p>
          ) : (
            <div className="divide-y divide-border/60">
              {merchants.map((merchant) => (
                <div
                  key={merchant.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
                >
                  <div>
                    <p className="font-medium">{merchant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      /{merchant.slug} · {merchant.user.email ?? 'no email'} · KYC{' '}
                      {merchant.kycStatus}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Settles in {merchant.settlementAssetCode} · joined{' '}
                      {formatDate(merchant.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        merchant.status === 'ACTIVE'
                          ? 'success'
                          : merchant.status === 'SUSPENDED'
                            ? 'destructive'
                            : 'warning'
                      }
                    >
                      {merchant.status}
                    </Badge>
                    <div className="flex gap-2">
                      {merchant.status === 'PENDING' && (
                        <Button size="sm" onClick={() => void setStatus(merchant.id, 'ACTIVE')}>
                          Approve
                        </Button>
                      )}
                      {merchant.status !== 'SUSPENDED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void setStatus(merchant.id, 'SUSPENDED')}
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void setStatus(merchant.id, 'ACTIVE')}
                        >
                          Reinstate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void setStatus(merchant.id, 'REJECTED')}
                      >
                        Reject
                      </Button>
                    </div>
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
