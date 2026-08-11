'use client';

import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from '@stellar-pay/ui';
import { adminApi } from '@/lib/api';
import { formatDate, shortKey } from '@/lib/format';

interface AdminUser {
  id: string;
  email: string | null;
  displayName: string | null;
  status: string;
  role: string;
  createdAt: string;
  wallets: Array<{ publicKey: string; provider: string }>;
}

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');

  const load = () =>
    void adminApi.admin
      .users({ search: search || undefined })
      .then((res) => setUsers(res.data as unknown as AdminUser[]));

  useEffect(load, []);

  const setStatus = async (id: string, status: string) => {
    await adminApi.admin.updateUserStatus(id, { status });
    toast.success(`User ${status.toLowerCase()}`);
    load();
  };

  const setRole = async (id: string, role: string) => {
    await adminApi.admin.assignRole({ userId: id, role });
    toast.success(`Role → ${role}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Manage accounts, roles and status</p>
        </div>
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          className="w-56"
        />
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Wallet</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <p className="font-medium">{user.displayName ?? user.email ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{user.email ?? 'no email'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {user.wallets.length ? (
                        <span className="font-mono text-xs">
                          {shortKey(user.wallets[0].publicKey)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        defaultValue={user.role}
                        onValueChange={(role) => void setRole(user.id, role)}
                      >
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">USER</SelectItem>
                          <SelectItem value="MERCHANT">MERCHANT</SelectItem>
                          <SelectItem value="SUPPORT">SUPPORT</SelectItem>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          user.status === 'ACTIVE'
                            ? 'success'
                            : user.status === 'SUSPENDED'
                              ? 'destructive'
                              : 'warning'
                        }
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void setStatus(user.id, 'SUSPENDED')}
                        >
                          Suspend
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void setStatus(user.id, 'ACTIVE')}
                        >
                          Activate
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">No users found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
