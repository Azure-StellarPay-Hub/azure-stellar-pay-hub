import type { AssetType, TrustlineStatus } from './common';
import type { AmountString } from './common';

export interface Asset {
  id: string;
  code: string;
  issuer: string | null;
  type: AssetType;
  name: string;
  description: string | null;
  iconUrl: string | null;
  decimals: number;
  isNative: boolean;
  isEnabled: boolean;
  isCrossBorder: boolean;
}

export interface AssetBalance {
  assetCode: string;
  assetIssuer: string | null;
  /** Human-readable balance (e.g. "12.3456789"). */
  balance: string;
  /** Balance in stroops (1 XLM = 10^7 stroops). */
  stroops: string;
  isNative: boolean;
}

export interface Trustline {
  id: string;
  assetCode: string;
  assetIssuer: string | null;
  balance: AmountString;
  status: TrustlineStatus;
  limit: string;
  createdAt: string;
}

export interface AssetWithBalance extends Asset {
  balance: string;
}
