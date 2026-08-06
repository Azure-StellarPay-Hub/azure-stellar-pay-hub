'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  useToast,
} from '@stellar-pay/ui';
import { adminApi } from '@/lib/api';
import type { Asset } from '@stellar-pay/types';

export default function AssetsPage() {
  const toast = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);

  const load = () => void adminApi.admin.assets().then(setAssets).catch(() => undefined);
  useEffect(load, []);

  const create = async () => {
    try {
      await adminApi.admin.createAsset({ code, name, decimals: 7 });
      setOpen(false);
      setCode('');
      setName('');
      toast.success('Asset created');
      load();
    } catch (err) {
      toast.error('Failed to create asset', (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="text-sm text-muted-foreground">Discovery metadata for the platform</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Code</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={12} placeholder="MYTOK" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Token" />
              </div>
              <Button onClick={() => void create()} className="w-full">
                Register
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <Card key={asset.id}>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="font-mono text-lg font-bold">{asset.code}</p>
                <p className="text-sm text-muted-foreground">{asset.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{asset.description ?? 'No description'}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={asset.isNative ? 'info' : asset.isCrossBorder ? 'success' : 'outline'}>
                  {asset.isNative ? 'native' : asset.isCrossBorder ? 'cross-border' : 'stellar'}
                </Badge>
                {asset.issuer && <span className="font-mono text-[10px] text-muted-foreground">{asset.issuer.slice(0, 8)}…</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
