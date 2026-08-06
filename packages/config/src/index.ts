import type { EnvConfig } from './schema';
import { envSchema } from './schema';

export type { EnvConfig } from './schema';
export { envSchema } from './schema';

let cached: EnvConfig | null = null;

/**
 * Validate and load the environment. Results are cached for the process
 * lifetime. Throws with a detailed error when required variables are invalid.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): EnvConfig {
  if (cached) {
    return cached;
  }
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Network passphrase helper derived from the active network. */
export function networkPassphrase(config: EnvConfig): string {
  if (config.NETWORK_PASSPHRASE) {
    return config.NETWORK_PASSPHRASE;
  }
  switch (config.STELLAR_NETWORK) {
    case 'public':
      return 'Public Global Stellar Network ; September 2015';
    case 'testnet':
      return 'Test SDF Network ; September 2015';
    default:
      return 'Standalone Network ; February 2017';
  }
}
