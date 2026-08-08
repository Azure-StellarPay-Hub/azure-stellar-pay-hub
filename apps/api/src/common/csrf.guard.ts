import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import { IS_CSRF_BYPASS_KEY } from './decorators';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Lightweight cookie parser — avoids adding cookie-parser as a dependency. */
function parseCookies(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  const map: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      map[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return map;
}

/**
 * Double-submit cookie CSRF guard.
 *
 * - On safe requests (GET/HEAD/OPTIONS): sets a random CSRF token cookie
 *   so the client can read it and include it in the X-CSRF-Token header on
 *   subsequent mutating requests.
 * - On mutating requests (POST/PUT/PATCH/DELETE): validates that the
 *   X-CSRF-Token header matches the csrf-token cookie value.
 * - If a valid Bearer Authorization header is present, CSRF checks are
 *   skipped (JWT bearer tokens are inherently CSRF-safe).
 * - Routes decorated with @CsrfBypass() skip CSRF checks (webhooks, etc.).
 *
 * Frontend note: the SPA must prime the CSRF cookie by making any GET
 * request to the API before the first mutating request (e.g., calling
 * GET /api/health on app mount is sufficient).
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const bypass = this.reflector.getAllAndOverride<boolean>(IS_CSRF_BYPASS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (bypass) {
      return true;
    }

    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request & { csrfToken?: string }>();
    const response = httpCtx.getResponse<Response>();
    const method = (request.method ?? 'GET').toUpperCase();

    // Safe methods: generate and set a CSRF cookie if one doesn't exist.
    if (SAFE_METHODS.has(method)) {
      const cookies = parseCookies(request.headers['cookie']);
      const existing = cookies[CSRF_COOKIE];
      if (!existing) {
        const token = this.generateToken();
        response.cookie(CSRF_COOKIE, token, {
          httpOnly: false, // readable by client JS so it can be sent as a header
          secure: this.config.get('NODE_ENV') === 'production',
          sameSite: 'lax', // allows top-level navigations from payment links/emails
          path: '/',
          maxAge: CSRF_MAX_AGE_MS,
        });
        // Also expose via response header so SPAs can read it without parsing cookies.
        response.setHeader(CSRF_HEADER, token);
        // Stash it on the request for any downstream middleware that cares.
        request.csrfToken = token;
      }
      return true;
    }

    // Mutating requests: if a Bearer token is present, skip CSRF (JWT is CSRF-safe).
    const auth = request.headers['authorization'] ?? '';
    if (auth.startsWith('Bearer ')) {
      return true;
    }

    // Validate double-submit: cookie value must match header value.
    const cookies = parseCookies(request.headers['cookie']);
    const cookieToken = cookies[CSRF_COOKIE];
    const headerToken = request.headers[CSRF_HEADER] as string | undefined;

    if (!cookieToken || !headerToken) {
      throw new ForbiddenException('CSRF validation failed');
    }

    if (!this.timingSafeEqual(cookieToken, headerToken)) {
      throw new ForbiddenException('CSRF validation failed');
    }

    return true;
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}
