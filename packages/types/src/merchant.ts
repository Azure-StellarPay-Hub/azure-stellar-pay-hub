import type {
  InvoiceStatus,
  MerchantStatus,
  PaymentLinkStatus,
  ProductStatus,
} from './common';
import type { AmountString } from './common';

export interface Merchant {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  currency: string;
  settlementAssetCode: string;
  settlementAssetIssuer: string | null;
  settlementPublicKey: string;
  status: MerchantStatus;
  kycStatus: string;
  webhookUrl: string | null;
  createdAt: string;
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description: string | null;
  priceAmount: AmountString;
  assetCode: string;
  assetIssuer: string | null;
  imageUrl: string | null;
  status: ProductStatus;
  createdAt: string;
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: AmountString;
  currency: string;
}

export interface Invoice {
  id: string;
  number: string;
  merchantId: string;
  customerPublicKey: string | null;
  title: string;
  description: string | null;
  items: InvoiceItem[];
  amount: AmountString;
  assetCode: string;
  assetIssuer: string | null;
  status: InvoiceStatus;
  dueDate: string | null;
  paidAt: string | null;
  memo: string | null;
  createdAt: string;
}

export interface PaymentLink {
  id: string;
  merchantId: string;
  code: string;
  title: string;
  description: string | null;
  amount: AmountString | null;
  assetCode: string;
  assetIssuer: string | null;
  fixedAmount: boolean;
  status: PaymentLinkStatus;
  expiresAt: string | null;
  redirectUrl: string | null;
  totalPayments: number;
  totalCollected: AmountString;
  createdAt: string;
}

export interface Settlement {
  id: string;
  merchantId: string;
  periodStart: string;
  periodEnd: string;
  amount: AmountString;
  assetCode: string;
  assetIssuer: string | null;
  status: string;
  payoutTransactionId: string | null;
  createdAt: string;
}
