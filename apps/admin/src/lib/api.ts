'use client';

import { ApiClient } from '@stellar-pay/sdk';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'stellar-pay:admin-token';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export const adminApi = new ApiClient({
  baseUrl: API_URL,
  getToken: getAdminToken,
  onUnauthorized: () => {
    clearAdminToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
});
