import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@stellar-pay/database';
import { Public } from './common/decorators';

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get('health')
  async health() {
    let database = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      /* db not reachable */
    }
    return {
      status: 'ok',
      service: 'stellar-pay-api',
      version: '0.1.0',
      network: this.config.get<string>('STELLAR_NETWORK'),
      database,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
