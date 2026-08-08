import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '@stellar-pay/database';

/**
 * Writes an AuditLog row for every mutating request (POST/PUT/PATCH/DELETE).
 * Failures are logged but do not block the response.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditInterceptor');

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      route?: { path?: string };
      path?: string;
      user?: { userId?: string; publicKey?: string };
      ip?: string;
      headers?: Record<string, string | undefined>;
      body?: Record<string, unknown>;
    }>();
    const method = request.method ?? 'GET';
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (!isMutation) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const path = request.route?.path ?? request.path ?? 'unknown';
          this.prisma.auditLog
            .create({
              data: {
                userId: request.user?.userId,
                actorPublicKey: request.user?.publicKey,
                action: `${method} ${path}`,
                resource: path.split('/')[1] ?? 'api',
                resourceId: undefined,
                ipAddress: request.ip,
                userAgent: request.headers?.['user-agent'],
                metadata: { body: request.body } as never,
              },
            })
            .catch((err: Error) => {
              this.logger.error(`Failed to write audit log: ${err.message}`, err.stack);
            });
        },
      }),
    );
  }
}
