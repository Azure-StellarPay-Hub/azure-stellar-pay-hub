import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { verifyAccessToken } from '@stellar-pay/authentication';

/**
 * Socket.IO gateway. Clients authenticate via `auth.token` (JWT) in the
 * handshake; each user joins a private room named `user:<id>`.
 */
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger('RealtimeGateway');

  constructor(private readonly config: ConfigService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        throw new Error('missing token');
      }
      const payload = verifyAccessToken(token, this.config.get<string>('JWT_SECRET')!);
      await client.join(`user:${payload.sub}`);
      this.logger.log(`socket connected: user=${payload.sub} socket=${client.id}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`socket disconnected: ${client.id}`);
  }

  /** Emit a live event to a user's room. */
  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}
