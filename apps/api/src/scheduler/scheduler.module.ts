import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [WebhooksModule, NotificationsModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
