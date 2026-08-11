import { describe, expect, it } from '@jest/globals';
import { Enums, PrismaService } from './index';

describe('database package exports', () => {
  it('re-exports PrismaService', () => {
    expect(typeof PrismaService).toBe('function');
    const service = new PrismaService();
    expect(typeof service.$connect).toBe('function');
  });

  it('exports Enums with expected keys', () => {
    expect(Enums).toBeDefined();
    expect(Enums.UserRole).toBeDefined();
    expect(Enums.UserStatus).toBeDefined();
    expect(Enums.TransactionStatus).toBeDefined();
    expect(Enums.TransactionDirection).toBeDefined();
    expect(Enums.MerchantStatus).toBeDefined();
    expect(Enums.InvoiceStatus).toBeDefined();
    expect(Enums.PaymentLinkStatus).toBeDefined();
    expect(Enums.NotificationChannel).toBeDefined();
    expect(Enums.NotificationType).toBeDefined();
    expect(Enums.NotificationStatus).toBeDefined();
    expect(Enums.WalletProvider).toBeDefined();
    expect(Enums.WalletStatus).toBeDefined();
    expect(Enums.SessionStatus).toBeDefined();
    expect(Enums.AssetType).toBeDefined();
    expect(Enums.TrustlineStatus).toBeDefined();
    expect(Enums.ProductStatus).toBeDefined();
  });
});
