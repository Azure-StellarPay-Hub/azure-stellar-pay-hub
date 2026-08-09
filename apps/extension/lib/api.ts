/**
 * Lightweight API client for the Chrome extension.
 * Uses chrome.storage for the API base URL and auth token.
 */

const STORAGE_KEY = 'stellarpay';

interface StorageData {
  apiUrl: string;
  token: string | null;
  publicKey: string | null;
}

async function getStorage(): Promise<StorageData> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (
    (result[STORAGE_KEY] as StorageData) ?? {
      apiUrl: 'http://localhost:4000',
      token: null,
      publicKey: null,
    }
  );
}

async function setStorage(data: Partial<StorageData>): Promise<void> {
  const current = await getStorage();
  await chrome.storage.local.set({
    [STORAGE_KEY]: { ...current, ...data },
  });
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { apiUrl, token } = await getStorage();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${apiUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    if ((err as Error).name === 'TimeoutError') {
      throw new Error('Request timed out — API is not responding');
    }
    if ((err as TypeError).message?.includes('fetch')) {
      throw new Error('Cannot reach API — is the server running? Check your API URL in Settings.');
    }
    throw err;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Public API ────────────────────────────────────────────────

export async function getChallenge(publicKey: string) {
  return request<{ nonce: string; message: string; expiresAt: string }>('/auth/challenge', {
    method: 'POST',
    body: { publicKey },
  });
}

export async function verifySignature(body: {
  publicKey: string;
  signature: string;
  message: string;
  nonce: string;
  provider: string;
}) {
  return request<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; publicKey: string };
  }>('/auth/verify', { method: 'POST', body });
}

export async function getBalances(publicKey: string) {
  return request<Array<{ assetCode: string; balance: string; isNative: boolean }>>(
    `/wallet/${publicKey}/balances`,
  );
}

export async function getRecentTransactions(query?: { page?: number; pageSize?: number }) {
  return request<{
    data: Array<{
      id: string;
      amount: string;
      assetCode: string;
      direction: string;
      status: string;
      createdAt: string;
    }>;
  }>(`/payments/history?${new URLSearchParams(query as Record<string, string>).toString()}`);
}

export async function createPayment(body: { to: string; amount: string; assetCode: string }) {
  return request<{ id: string; unsignedXdr: string }>('/payments', {
    method: 'POST',
    body,
  });
}

export async function submitPayment(body: { signedXdr: string; paymentId: string }) {
  return request<{ id: string; status: string; hash: string }>('/payments/submit', {
    method: 'POST',
    body,
  });
}

// ── Storage helpers ────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  const { token } = await getStorage();
  return token;
}

export async function setToken(token: string | null): Promise<void> {
  await setStorage({ token });
}

export async function getPublicKey(): Promise<string | null> {
  const { publicKey } = await getStorage();
  return publicKey;
}

export async function setPublicKey(publicKey: string | null): Promise<void> {
  await setStorage({ publicKey });
}

export async function getApiUrl(): Promise<string> {
  const { apiUrl } = await getStorage();
  return apiUrl;
}

export async function setApiUrl(url: string): Promise<void> {
  await setStorage({ apiUrl: url });
}
