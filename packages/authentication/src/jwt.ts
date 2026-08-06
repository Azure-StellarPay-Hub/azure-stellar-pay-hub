import jwt from 'jsonwebtoken';
import type { UserRole } from '@stellar-pay/types';

export interface AuthTokenPayload {
  /** User id. */
  sub: string;
  /** Primary wallet public key, when wallet-authenticated. */
  publicKey?: string;
  role: UserRole;
  /** Active session id (enables server-side revocation). */
  sessionId?: string;
  /** Issued at (seconds). */
  iat?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

const REFRESH_PREFIX = 'refresh';

/** Sign an access token. */
export function signAccessToken(
  payload: AuthTokenPayload,
  secret: string,
  expiresIn: string | number,
): string {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
}

/** Sign a refresh token bound to the session id. */
export function signRefreshToken(payload: AuthTokenPayload, secret: string): string {
  return jwt.sign({ ...payload, type: REFRESH_PREFIX }, secret, {
    expiresIn: '30d',
    algorithm: 'HS256',
  });
}

/** Verify and decode an access token. Throws on invalid/expired tokens. */
export function verifyAccessToken<T extends AuthTokenPayload = AuthTokenPayload>(
  token: string,
  secret: string,
): T {
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  return decoded as T;
}

/** Verify a refresh token; throws unless the token is a valid refresh token. */
export function verifyRefreshToken<T extends AuthTokenPayload = AuthTokenPayload>(
  token: string,
  secret: string,
): T {
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as T & {
    type?: string;
  };
  if (decoded.type !== REFRESH_PREFIX) {
    throw new Error('Not a refresh token');
  }
  return decoded;
}
