'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@stellar-pay/ui';
import { adminApi } from '@/lib/api';
import { formatDateTime } from '@/lib/format';

interface AuditRow {
  id: string;
  action: string;
  resource: string;
  userId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);

  useEffect(() => {
    void adminApi.admin.auditLogs().then((res) => setLogs(res.data as AuditRow[]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ShieldCheck className="h-5 w-5 text-indigo-400" /> Audit logs
        </h1>
        <p className="text-sm text-muted-foreground">Immutable record of admin and user mutations</p>
      </div>
      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No audit entries yet — mutations are recorded automatically.
            </p>
          ) : (
            <div className="divide-y divide-border/60">
              {logs.map((log) => (
                <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
                  <div>
                    <p className="font-mono text-sm">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      resource: {log.resource} · user: {log.userId ?? 'anonymous'}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(log.createdAt)} {log.ipAddress ? `· ${log.ipAddress}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
