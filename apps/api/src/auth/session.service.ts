import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@stellar-pay/database';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async listSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        deviceId: true,
        ipAddress: true,
        userAgent: true,
        expiresAt: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const result = await this.prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException('Session not found');
    }
  }

  async listDevices(userId: string) {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
      select: { id: true, name: true, ipAddress: true, userAgent: true, lastActiveAt: true },
    });
  }

  async revokeDevice(userId: string, deviceId: string): Promise<void> {
    const result = await this.prisma.device.deleteMany({ where: { id: deviceId, userId } });
    if (result.count === 0) {
      throw new NotFoundException('Device not found');
    }
    // Revoke sessions tied to the device.
    await this.prisma.session.updateMany({
      where: { userId, deviceId },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });
  }
}
