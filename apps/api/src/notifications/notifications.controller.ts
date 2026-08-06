import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.notifications.list(user.userId, Number(page), Number(pageSize));
  }

  @Post(':id/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notifications.markRead(user.userId, id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markAllRead(user.userId);
  }
}
