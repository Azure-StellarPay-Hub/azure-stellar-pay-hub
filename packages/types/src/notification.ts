import type { NotificationChannel, NotificationStatus, NotificationType } from './common';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string | null;
  payload: Record<string, unknown> | null;
  status: NotificationStatus;
  readAt: string | null;
  createdAt: string;
}
