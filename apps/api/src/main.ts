import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { createLogger } from '@stellar-pay/logger';
import { PrismaService } from '@stellar-pay/database';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = createLogger('api');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  app.setGlobalPrefix('api');
  app.use(helmet({ crossOriginResourcePolicy: false }));

  const config = app.get(ConfigService);
  const corsOrigins = config.get<string[]>('CORS_ORIGINS') ?? ['http://localhost:3000'];
  app.enableCors({ origin: corsOrigins, credentials: true });

  // Connect Prisma before serving traffic.
  const prisma = app.get(PrismaService);
  await prisma.connect();

  // Graceful shutdown: disconnect Prisma on SIGTERM/SIGINT.
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    try {
      await prisma.disconnect();
      await app.close();
    } catch (err) {
      logger.error('Error during shutdown', err);
    }
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  const port = config.get<number>('API_PORT') ?? 4000;
  await app.listen(port);
  logger.info(`API listening on :${port} (network=${config.get('STELLAR_NETWORK')})`);
}

void bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
