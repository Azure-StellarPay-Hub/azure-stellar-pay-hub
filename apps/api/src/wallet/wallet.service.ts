import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@stellar-pay/database';
import { createStellarNetwork } from '../infra/stellar';
import type { AssetBalance } from '@stellar-pay/types';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private network() {
    return createStellarNetwork(this.config);
  }

  /** Balance for a public key. Falls back to DB trustlines when Horizon is unreachable. */
  async getBalances(publicKey: string): Promise<AssetBalance[]> {
    try {
      return await this.network().getBalances(publicKey);
    } catch {
      // Offline/development fallback: XLM zero + seeded trustlines.
      const trustlines = await this.prisma.trustline.findMany({
        where: { user: { wallets: { some: { publicKey } } } },
        include: { asset: true },
      });
      return [
        { assetCode: 'XLM', assetIssuer: null, balance: '0', stroops: '0', isNative: true },
        ...trustlines.map((t) => ({
          assetCode: t.asset.code,
          assetIssuer: t.asset.issuer,
          balance: t.balance,
          stroops: '0',
          isNative: false,
        })),
      ];
    }
  }

  /** Trustlines stored for the user's wallets. */
  async listTrustlines(publicKey: string) {
    return this.prisma.trustline.findMany({
      where: { user: { wallets: { some: { publicKey } } } },
      include: { asset: { select: { code: true, issuer: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Ensure the user owns the wallet before sensitive operations. */
  async assertWalletOwnership(userId: string, publicKey: string): Promise<void> {
    const wallet = await this.prisma.wallet.findFirst({ where: { userId, publicKey } });
    if (!wallet) {
      throw new NotFoundException('Wallet not linked to this account');
    }
  }

  /** Build a changeTrust XDR (user signs client-side, submits via /wallet/trustlines/submit). */
  async buildTrustlineXdr(input: {
    from: string;
    assetCode: string;
    assetIssuer: string;
    limit?: string;
    remove?: boolean;
  }) {
    const xdr = await this.network().buildTrustlineTransaction(input);
    return { transactionXdr: xdr, message: 'Sign this transaction with your wallet and submit it' };
  }

  /** Record a completed trustline locally (called after successful submission). */
  async recordTrustline(
    userId: string,
    input: { assetCode: string; assetIssuer: string; remove?: boolean },
  ) {
    const asset = await this.prisma.asset.findUnique({
      where: { code_issuer: { code: input.assetCode, issuer: input.assetIssuer } },
    });
    if (!asset) {
      throw new NotFoundException(`Unknown asset ${input.assetCode}`);
    }
    if (input.remove) {
      await this.prisma.trustline.deleteMany({ where: { userId, assetId: asset.id } });
      return { ok: true, removed: true };
    }
    await this.prisma.trustline.upsert({
      where: { userId_assetId: { userId, assetId: asset.id } },
      update: { status: 'ACTIVE' },
      create: { userId, assetId: asset.id, status: 'ACTIVE' },
    });
    return { ok: true, removed: false };
  }
}
