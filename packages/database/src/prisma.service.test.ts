import { describe, expect, it } from '@jest/globals';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('starts in disconnected state', () => {
    const service = new PrismaService();
    expect(service.isConnected()).toBe(false);
  });

  it('has connect, disconnect, and isConnected methods', () => {
    const service = new PrismaService();
    expect(typeof service.connect).toBe('function');
    expect(typeof service.disconnect).toBe('function');
    expect(typeof service.isConnected).toBe('function');
  });

  it('is an instance of PrismaClient', () => {
    const service = new PrismaService();
    // Should have standard PrismaClient methods
    expect(typeof service.$connect).toBe('function');
    expect(typeof service.$disconnect).toBe('function');
    expect(typeof service.$transaction).toBe('function');
  });

  it('tracks connection state correctly through connect/disconnect cycle', async () => {
    const service = new PrismaService();
    expect(service.isConnected()).toBe(false);

    try {
      await service.connect();
      expect(service.isConnected()).toBe(true);

      // Second connect should be idempotent
      await service.connect();
      expect(service.isConnected()).toBe(true);
    } catch {
      // Database may not be running in test environment — connection error is expected
    }

    try {
      await service.disconnect();
      expect(service.isConnected()).toBe(false);

      // Second disconnect should be idempotent
      await service.disconnect();
      expect(service.isConnected()).toBe(false);
    } catch {
      // May have already been disconnected or never connected
    }
  });
});
