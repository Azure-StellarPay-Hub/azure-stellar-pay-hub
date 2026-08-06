import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from '@stellar-pay/config';
import { PrismaService } from '@stellar-pay/database';
import { RedisService } from './redis.service';
import { IpfsService } from './ipfs.service';

/** Provide the validated environment + shared infra (Prisma, Redis, IPFS). */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => envSchema.parse(config),
    }),
  ],
  providers: [PrismaService, RedisService, IpfsService],
  exports: [PrismaService, RedisService, IpfsService],
})
export class InfraModule {}
