import { PrismaClient } from './generated/prisma';

/**
 * Prisma client wrapper with explicit connection lifecycle.
 * The NestJS API exposes this as a provider via `DatabaseModule`.
 */
export class PrismaService extends PrismaClient {
  private connected = false;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  /** Establish the connection pool (idempotent). */
  async connect(): Promise<void> {
    if (!this.connected) {
      await this.$connect();
      this.connected = true;
    }
  }

  /** Gracefully close the connection pool. */
  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.$disconnect();
      this.connected = false;
    }
  }

  /** True once connect() succeeded. */
  isConnected(): boolean {
    return this.connected;
  }
}
