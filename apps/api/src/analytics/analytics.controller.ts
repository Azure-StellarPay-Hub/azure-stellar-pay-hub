import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../common/decorators';
import { AnalyticsService } from './analytics.service';

@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Roles('ADMIN', 'SUPPORT')
  @Get('dashboard')
  dashboard() {
    return this.analytics.dashboard();
  }

  @Roles('ADMIN', 'SUPPORT')
  @Get('volume')
  volume(@Query('range') range: '7d' | '30d' | '90d' = '7d') {
    return this.analytics.volume(range);
  }
}
