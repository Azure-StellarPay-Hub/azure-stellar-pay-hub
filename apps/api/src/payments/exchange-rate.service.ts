import { Injectable } from '@nestjs/common';
import { RedisService } from '../infra/redis.service';

/**
 * Exchange-rate provider for cross-border payments.
 *
 * The demo implementation serves cached demo rates. Swap `getRate` with a real
 * provider (e.g. Stellar pathfinding, CoinGecko, or an FX partner API) without
 * touching the rest of the payment flow.
 */
@Injectable()
export class ExchangeRateService {
  // Demo rates per XLM-unit. Replace with a live provider in production.
  private readonly DEMO_RATES: Record<string, number> = {
    XLM: 0.12,
    USDC: 1.0,
    EURT: 1.08,
    BRL: 0.2,
  };

  constructor(private readonly redis: RedisService) {}

  async getRate(fromAsset: string, toAsset: string): Promise<number> {
    const cacheKey = `fx:${fromAsset}:${toAsset}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return Number(cached);
    }
    const from = this.DEMO_RATES[fromAsset] ?? 1;
    const to = this.DEMO_RATES[toAsset] ?? 1;
    const rate = from / to;
    await this.redis.set(cacheKey, String(rate), 300);
    return rate;
  }
}
