import { Injectable, OnApplicationShutdown, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createLogger } from '@stellar-pay/logger';

/**
 * Thin wrapper around ioredis: typed get/set helpers with JSON + TTL.
 * Used for auth challenges, rate-limit state, session cache and job locks.
 */
@Injectable()
export class RedisService implements OnModuleDestroy, OnApplicationShutdown {
  private readonly logger = createLogger('redis');
  private readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 2,
      lazyConnect: false,
    });
    this.client.on('error', (err) => this.logger.warn({ err: err.message }, 'redis error'));
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  /** Scoped lock for scheduler jobs (returns false when already locked). */
  async acquireLock(key: string, ttlSeconds = 30): Promise<boolean> {
    const result = await this.client.set(`lock:${key}`, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  get raw(): Redis {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit().catch(() => undefined);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.quit().catch(() => undefined);
  }
}
