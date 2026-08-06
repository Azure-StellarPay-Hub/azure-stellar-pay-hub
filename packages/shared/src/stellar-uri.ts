import { isValidMemo, isValidPublicKey } from './stellar';

export interface PaymentUriParams {
  destination: string;
  amount?: string;
  assetCode?: string;
  assetIssuer?: string;
  memo?: string;
  memoType?: 'text' | 'hash' | 'id';
  message?: string;
}

/** Build a SEP-0007 style `web+stellar:pay` URI for QR codes and links. */
export function buildPaymentUri(params: PaymentUriParams): string {
  const query = new URLSearchParams();
  query.set('destination', params.destination);
  if (params.amount) {
    query.set('amount', params.amount);
  }
  if (params.assetCode) {
    query.set('asset_code', params.assetCode);
  }
  if (params.assetIssuer) {
    query.set('asset_issuer', params.assetIssuer);
  }
  if (params.memo) {
    query.set('memo', params.memo);
  }
  if (params.memoType) {
    query.set('memo_type', params.memoType);
  }
  if (params.message) {
    query.set('msg', params.message);
  }
  return `web+stellar:pay?${query.toString()}`;
}

/** Parse a `web+stellar:pay` URI into structured params. */
export function parsePaymentUri(uri: string): PaymentUriParams | null {
  if (!uri.startsWith('web+stellar:pay')) {
    return null;
  }
  try {
    const queryPart = uri.includes('?') ? uri.split('?')[1] : '';
    const query = new URLSearchParams(queryPart);
    const destination = query.get('destination');
    if (!destination || !isValidPublicKey(destination)) {
      return null;
    }
    const memoType = query.get('memo_type');
    const result: PaymentUriParams = {
      destination,
      amount: query.get('amount') ?? undefined,
      assetCode: query.get('asset_code') ?? undefined,
      assetIssuer: query.get('asset_issuer') ?? undefined,
      memo: query.get('memo') ?? undefined,
      memoType: memoType === 'hash' || memoType === 'id' || memoType === 'text' ? memoType : undefined,
      message: query.get('msg') ?? undefined,
    };
    if (result.memo && !isValidMemo(result.memo)) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
}
