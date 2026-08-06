'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Badge, Card, CardContent } from '@stellar-pay/ui';
import { adminApi } from '@/lib/api';
import { formatDateTime } from '@/lib/format';

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  status: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  useEffect(() => {
    void adminApi.admin.notifications().then((res) => setNotifications(res.data as AdminNotification[]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Bell className="h-5 w-5 text-indigo-400" /> Notifications
        </h1>
        <p className="text-sm text-muted-foreground">Every notification sent across channels</p>
      </div>
      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No notifications yet</p>
          ) : (
            <div className="divide-y divide-border/60">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div>
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {notification.type} · {notification.body ?? 'no body'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={notification.status === 'SENT' ? 'success' : 'outline'}>
                      {notification.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDateTime(notification.createdAt)}</span>
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
