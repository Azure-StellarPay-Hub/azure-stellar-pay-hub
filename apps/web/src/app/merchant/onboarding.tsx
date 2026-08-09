'use client';

import { useState } from 'react';
import { Store } from 'lucide-react';
import { Button, Card, CardContent, Input, Label, useToast } from '@stellar-pay/ui';
import { api } from '@/lib/api';
import { isValidPublicKey } from '@stellar-pay/shared';

export function OnboardingForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [settlement, setSettlement] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!isValidPublicKey(settlement)) {
      toast.error('Settlement address must be a valid Stellar public key');
      return;
    }
    setBusy(true);
    try {
      await api.merchants.register({
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        settlementPublicKey: settlement,
        settlementAssetCode: 'USDC',
        websiteUrl: website || undefined,
      });
      toast.success('Merchant registered', 'Pending review');
      onDone();
    } catch (err) {
      toast.error('Registration failed', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Card>
        <CardContent className="flex flex-col items-center gap-6 p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500">
            <Store className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Become a merchant</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a merchant profile to sell with payment links, invoices and POS.
            </p>
          </div>
          <div className="w-full space-y-4">
            <div className="space-y-1.5">
              <Label>Business name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Demo Coffee Co."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="demo-coffee-co"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Settlement public key</Label>
              <Input
                value={settlement}
                onChange={(e) => setSettlement(e.target.value)}
                placeholder="G..."
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Website (optional)</Label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              onClick={() => void submit()}
              disabled={busy}
            >
              Register merchant
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
