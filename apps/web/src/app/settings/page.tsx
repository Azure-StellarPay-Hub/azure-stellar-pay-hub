'use client';

import { useEffect, useState } from 'react';
import { Monitor, ShieldCheck, Trash2, User as UserIcon } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, useToast } from '@stellar-pay/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import type { User } from '@stellar-pay/types';

interface SessionRow {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: string;
  status: string;
  createdAt: string;
}

export default function SettingsPage() {
  const toast = useToast();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<User | null>(user);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [currency, setCurrency] = useState('USD');
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [devices, setDevices] = useState<Array<{ id: string; name: string; lastActiveAt: string }>>([]);

  useEffect(() => {
    void api.users.me().then(setProfile).catch(() => undefined);
    void api.users.preferences().then((p) => setCurrency(p.currency)).catch(() => undefined);
    void api.auth.sessions().then((res) => setSessions(res.data)).catch(() => undefined);
    void api.users.devices().then((res) => setDevices(res.data)).catch(() => undefined);
  }, []);

  const saveProfile = async () => {
    try {
      const updated = await api.users.updateProfile({ displayName });
      setProfile(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Update failed', (err as Error).message);
    }
  };

  const savePrefs = async () => {
    await api.users.updatePreferences({ currency });
    toast.success('Preferences saved');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Profile, preferences and security.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-indigo-400" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Display name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={profile?.email ?? ''} disabled placeholder="Not set" />
          </div>
          <Button onClick={() => void saveProfile()}>Save profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Display currency</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} className="w-24 font-mono" />
          </div>
          <Button onClick={() => void savePrefs()}>Save preferences</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400" /> Sessions & devices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{session.status}</p>
                <p className="text-xs text-muted-foreground">
                  Expires {formatDate(session.expiresAt)} · {session.ipAddress ?? 'unknown ip'}
                </p>
              </div>
              {session.status === 'ACTIVE' && (
                <Button variant="outline" size="sm" onClick={() => void api.auth.revokeSession(session.id).then(() => window.location.reload())}>
                  Revoke
                </Button>
              )}
            </div>
          ))}
          {devices.length > 0 && (
            <>
              <p className="flex items-center gap-2 pt-2 text-sm font-medium">
                <Monitor className="h-4 w-4 text-muted-foreground" /> Devices
              </p>
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{device.name}</p>
                    <p className="text-xs text-muted-foreground">Last active {formatDate(device.lastActiveAt)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => void api.users.revokeDevice(device.id).then(() => window.location.reload())}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </>
          )}
          <div className="pt-2">
            <Button variant="destructive" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
