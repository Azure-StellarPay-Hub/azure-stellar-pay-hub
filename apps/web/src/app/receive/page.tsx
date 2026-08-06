'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, QrCode, Loader2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@stellar-pay/ui';
import { useWallet } from '@stellar-pay/wallet';
import { api } from '@/lib/api';
import { shortKey } from '@/lib/format';

export default function ReceivePage() {
  const { publicKey, connected } = useWallet();
  const [amount, setAmount] = useState('');
  const [assetCode, setAssetCode] = useState('XLM');
  const [memo, setMemo] = useState('');
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!publicKey) {
      return;
    }
    setLoading(true);
    try {
      const result = await api.payments.request({
        publicKey,
        assetCode,
        amount: amount || undefined,
        memo: memo || undefined,
      });
      setUri(result.uri);
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!uri) {
      return;
    }
    await navigator.clipboard.writeText(uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Receive payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate a QR code and payment URI for anyone with a Stellar wallet.
        </p>
      </div>

      {!connected || !publicKey ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Connect a wallet to receive payments.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Your address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-3 font-mono text-sm">
                <span className="truncate">{publicKey}</span>
                <Button variant="ghost" size="sm" onClick={copy}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create a payment request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <Input placeholder="Optional" value={amount} onChange={(e) => setAmount(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label>Asset</Label>
                  <Select value={assetCode} onValueChange={setAssetCode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XLM">XLM</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="EURT">EURT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Memo (optional)</Label>
                <Input placeholder="invoice-123" value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={28} />
              </div>
              <Button variant="gradient" className="w-full" size="lg" onClick={() => void generate()} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                Generate QR code
              </Button>
            </CardContent>
          </Card>

          {uri && (
            <Card className="text-center">
              <CardContent className="flex flex-col items-center gap-5 py-8">
                <div className="rounded-2xl bg-white p-5 shadow-2xl">
                  <QRCodeSVG value={uri} size={200} level="M" />
                </div>
                <p className="max-w-md break-all font-mono text-xs text-muted-foreground">{uri}</p>
                <Button onClick={copy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy payment link'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Scan with a wallet app or send the link to {shortKey(publicKey, 4, 4)}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
