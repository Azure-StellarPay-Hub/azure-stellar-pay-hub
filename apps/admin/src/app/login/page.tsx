'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Shield } from 'lucide-react';
import { Button, Card, CardContent, Input, Label, useToast } from '@stellar-pay/ui';
import { adminApi, setAdminToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const login = async () => {
    setBusy(true);
    try {
      const result = await adminApi.request<{ accessToken: string; user: { role: string } }>({
        method: 'POST',
        path: '/auth/admin/login',
        body: { email, password },
      });
      setAdminToken(result.accessToken);
      router.push('/');
    } catch (err) {
      toast.error('Login failed', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-6 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin console</h1>
              <p className="text-sm text-muted-foreground">Sign in with your admin credentials</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@stellar-pay.dev" />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void login()} placeholder="••••••••" />
            </div>
            <Button variant="gradient" className="w-full" size="lg" onClick={() => void login()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Sign in
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Default seed: admin@stellar-pay.dev / ChangeMe123!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
