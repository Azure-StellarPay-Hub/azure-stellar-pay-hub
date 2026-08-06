import pino, { type LoggerOptions } from 'pino';

/** Stable logger contract across pino versions. */
export interface Logger {
  fatal(...args: unknown[]): void;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  info(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  trace(...args: unknown[]): void;
  child(bindings: Record<string, unknown>): Logger;
}

const isDevelopment = (process.env.NODE_ENV ?? 'development') !== 'production';

function buildOptions(name: string): LoggerOptions {
  return {
    name,
    level: process.env.LOG_LEVEL ?? (isDevelopment ? 'debug' : 'info'),
    base: { service: name },
    ...(isDevelopment
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
          },
        }
      : {}),
  };
}

/**
 * Create a structured logger bound to a service/package name.
 * Human-readable output in development, JSON in production.
 */
export function createLogger(name: string): Logger {
  return pino(buildOptions(name)) as unknown as Logger;
}

/** Default root logger. */
export const logger: Logger = createLogger('stellar-pay');
