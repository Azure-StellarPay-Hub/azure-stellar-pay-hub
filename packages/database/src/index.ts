import * as generated from './generated/prisma';

export { PrismaClient } from './generated/prisma';
export { Prisma } from './generated/prisma';
export { PrismaService } from './prisma.service';

/** Prefixed aliases so DB enums don't collide with @stellar-pay/types enums. */
export const Enums = {
  UserRole: generated.UserRole,
  UserStatus: generated.UserStatus,
  WalletProvider: generated.WalletProvider,
  WalletStatus: generated.WalletStatus,
  SessionStatus: generated.SessionStatus,
  TransactionStatus: generated.TransactionStatus,
  TransactionDirection: generated.TransactionDirection,
  AssetType: generated.AssetType,
  TrustlineStatus: generated.TrustlineStatus,
  MerchantStatus: generated.MerchantStatus,
  ProductStatus: generated.ProductStatus,
  InvoiceStatus: generated.InvoiceStatus,
  PaymentLinkStatus: generated.PaymentLinkStatus,
  NotificationChannel: generated.NotificationChannel,
  NotificationType: generated.NotificationType,
  NotificationStatus: generated.NotificationStatus,
} as const;

export type {
  User as UserRecord,
  UserPreference as UserPreferenceRecord,
  Wallet as WalletRecord,
  Session as SessionRecord,
  Device as DeviceRecord,
  Contact as ContactRecord,
  Beneficiary as BeneficiaryRecord,
  Asset as AssetRecord,
  Trustline as TrustlineRecord,
  Transaction as TransactionRecord,
  ScheduledPayment as ScheduledPaymentRecord,
  Merchant as MerchantRecord,
  Product as ProductRecord,
  Customer as CustomerRecord,
  Invoice as InvoiceRecord,
  PaymentLink as PaymentLinkRecord,
  Settlement as SettlementRecord,
  Notification as NotificationRecord,
  ApiKey as ApiKeyRecord,
  AuditLog as AuditLogRecord,
  Role as RoleRecord,
  Permission as PermissionRecord,
  RolePermission as RolePermissionRecord,
  Setting as SettingRecord,
  Webhook as WebhookRecord,
  WebhookDelivery as WebhookDeliveryRecord,
} from './generated/prisma';
