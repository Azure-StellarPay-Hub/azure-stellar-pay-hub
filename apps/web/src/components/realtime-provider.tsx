'use client';

import { useToast } from '@stellar-pay/ui';
import { useAuth } from '@/lib/auth';
import { useRealtime } from '@/lib/ws';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const { authenticated } = useAuth();

  useRealtime((event, payload) => {
    if (event === 'notification') {
      const notification = payload as { title?: string; body?: string | null };
      toast.info(notification.title ?? 'Notification', notification.body ?? undefined);
    }
    if (event === 'transaction.updated') {
      const tx = payload as { status?: string };
      if (tx.status === 'SUCCEEDED') {
        toast.success('Payment succeeded');
      } else if (tx.status === 'FAILED') {
        toast.error('Payment failed');
      }
    }
  });

  // Reconnect when authentication state changes (token now available).
  void authenticated;
  return <>{children}</>;
}
