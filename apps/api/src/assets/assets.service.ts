import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@stellar-pay/database';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: { search?: string; type?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where: Record<string, unknown> = { isEnabled: true };
    if (query.type) {
      where.type = query.type;
    }
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.asset.findMany({ where: where as never, orderBy: { isNative: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.asset.count({ where: where as never }),
    ]);
    return { data: items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async getByCode(code: string) {
    const asset = await this.prisma.asset.findFirst({ where: { code } });
    if (!asset) {
      throw new NotFoundException(`Asset ${code} not found`);
    }
    return asset;
  }
}
