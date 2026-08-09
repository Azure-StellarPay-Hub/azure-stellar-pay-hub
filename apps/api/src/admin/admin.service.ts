import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@stellar-pay/database';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async users(query: { page?: number; pageSize?: number; search?: string }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where: Record<string, unknown> = {};
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { displayName: { contains: query.search, mode: 'insensitive' } },
        { wallets: { some: { publicKey: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where: where as never,
        include: {
          wallets: { select: { publicKey: true, provider: true } },
          merchant: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where: where as never }),
    ]);
    return {
      data: items,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async updateUserStatus(userId: string, status: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.update({ where: { id: userId }, data: { status: status as never } });
    return { ok: true, status, reason };
  }

  async assignRole(userId: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.update({ where: { id: userId }, data: { role: role as never } });
    return { ok: true, role };
  }

  async merchants(query: { page?: number; pageSize?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const [items, total] = await Promise.all([
      this.prisma.merchant.findMany({
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.merchant.count(),
    ]);
    return {
      data: items,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async updateMerchantStatus(merchantId: string, status: string, reason?: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }
    await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { status: status as never },
    });
    return { ok: true, status, reason };
  }

  async transactions(query: { page?: number; pageSize?: number; status?: string }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { status: query.status as never },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where: { status: query.status as never } }),
    ]);
    return {
      data: items,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async auditLogs(query: { page?: number; pageSize?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count(),
    ]);
    return {
      data: items,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async assets() {
    return this.prisma.asset.findMany({ orderBy: [{ isNative: 'desc' }, { code: 'asc' }] });
  }

  async notifications(query: { page?: number; pageSize?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count(),
    ]);
    return {
      data: items,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async createAsset(input: {
    code: string;
    issuer?: string;
    name: string;
    description?: string;
    decimals?: number;
    isNative?: boolean;
    isCrossBorder?: boolean;
  }) {
    return this.prisma.asset.create({
      data: {
        code: input.code,
        issuer: input.issuer,
        name: input.name,
        description: input.description,
        decimals: input.decimals ?? 7,
        isNative: input.isNative ?? false,
        isCrossBorder: input.isCrossBorder ?? false,
      },
    });
  }

  async settings() {
    return this.prisma.setting.findMany({ orderBy: { key: 'asc' } });
  }

  async upsertSetting(key: string, value: unknown) {
    await this.prisma.setting.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never },
    });
    return { ok: true };
  }
}
