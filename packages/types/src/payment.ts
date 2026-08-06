import type { AmountString } from './common';

export enum PaymentType {
  SEND = 'SEND',
  RECEIVE = 'RECEIVE',
  QR = 'QR',
  PAYMENT_LINK = 'PAYMENT_LINK',
  SCHEDULED = 'SCHEDULED',
  RECURRING = 'RECURRING',
  BATCH = 'BATCH',
  SPLIT = 'SPLIT',
  INVOICE = 'INVOICE',
  ESCROW = 'ESCROW',
  SUBSCRIPTION = 'SUBSCRIPTION',
  CROSS_BORDER = 'CROSS_BORDER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export interface PaymentDestination {
  publicKey: string;
  amount: AmountString;
  memo?: string;
}

export interface PaymentIntent {
  id: string;
  type: PaymentType;
  status: PaymentStatus;
  fromPublicKey: string;
  destinations: PaymentDestination[];
  assetCode: string;
  assetIssuer: string | null;
  totalAmount: AmountString;
  memo?: string;
  memoType?: 'text' | 'hash' | 'id';
  scheduledFor?: string;
  recurring?: {
    interval: 'daily' | 'weekly' | 'monthly';
    count?: number;
  };
  sourceNetwork: string;
  createdAt: string;
}

/** Response from creating a payment — either pending wallet signing or scheduled. */
export type PaymentCreateResponse =
  | { kind: 'scheduled'; id: string; message: string }
  | { kind: 'pending'; id: string; unsignedXdr: string; message: string };

export interface PaymentRequest {
  /** Stellar URI scheme (web+stellar:pay) for QR / links. */
  uri: string;
  publicKey: string;
  assetCode: string;
  amount?: string;
  memo?: string;
  message?: string;
}

export interface PaymentReceipt {
  id: string;
  transactionHash: string;
  ipfsCid: string | null;
  createdAt: string;
}
