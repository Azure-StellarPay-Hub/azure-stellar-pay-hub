import type {
  UserRole,
  UserStatus,
  WalletProvider,
  WalletStatus,
  SessionStatus,
  StellarNetwork,
} from './common';

export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  role: UserRole;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  publicKey: string;
  provider: WalletProvider;
  status: WalletStatus;
  network: StellarNetwork;
  isPrimary: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  deviceName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: string;
  status: SessionStatus;
  createdAt: string;
}

export interface Device {
  id: string;
  userId: string;
  name: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: string;
}

export interface Contact {
  id: string;
  name: string;
  publicKey: string;
  memo: string | null;
  memoType: string;
  isFavorite: boolean;
  network: StellarNetwork;
  createdAt: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  publicKey: string;
  currency: string;
  country: string | null;
  bankDetails: Record<string, unknown> | null;
  isVerified: boolean;
  createdAt: string;
}

export interface UserPreference {
  currency: string;
  notificationPreferences: Record<string, boolean>;
  theme: 'dark' | 'light';
  twoFactorEnabled: boolean;
}
