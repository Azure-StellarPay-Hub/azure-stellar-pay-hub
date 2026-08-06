import { ConfigService } from '@nestjs/config';
import { networkPassphrase } from '@stellar-pay/config';
import { StellarNetwork } from '@stellar-pay/sdk';
import type { EnvConfig } from '@stellar-pay/config';

/** Build the shared StellarNetwork helper from validated environment. */
export function createStellarNetwork(config: ConfigService): StellarNetwork {
  return new StellarNetwork({
    horizonUrl: config.get<string>('HORIZON_URL') ?? 'https://horizon-testnet.stellar.org',
    networkPassphrase:
      config.get<string>('NETWORK_PASSPHRASE') ??
      networkPassphrase({
        STELLAR_NETWORK: (config.get<string>('STELLAR_NETWORK') ?? 'testnet') as 'testnet',
        NETWORK_PASSPHRASE: undefined,
      } as EnvConfig),
  });
}
