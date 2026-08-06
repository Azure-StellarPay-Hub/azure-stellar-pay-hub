import type { AmountString, TransactionDirection, TransactionStatus } from './common';

export interface TransactionRecord {
  id: string;
  hash: string | null;
  fromPublicKey: string | null;
  toPublicKey: string | null;
  amount: AmountString;
  assetCode: string;
  assetIssuer: string | null;
  memo: string | null;
  memoType: string;
  status: TransactionStatus;
  direction: TransactionDirection;
  kind: string;
  fee: string | null;
  sourceNetwork: string;
  meta: Record<string, unknown> | null;
  errorMessage: string | null;
  receiptIpfsCid: string | null;
  createdAt: string;
}
