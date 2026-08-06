import {
  Account,
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
  type Asset as StellarAsset,
  type Transaction,
} from '@stellar/stellar-sdk';
import type { AssetBalance } from '@stellar-pay/types';
import { fromStroops, toStroops } from '@stellar-pay/shared';

export interface StellarNetworkConfig {
  horizonUrl: string;
  networkPassphrase: string;
}

export interface PaymentTxInput {
  from: string;
  to: string;
  amount: string;
  assetCode: string;
  assetIssuer?: string | null;
  memo?: string;
  memoType?: 'text' | 'hash' | 'id';
}

export interface SubmitResult {
  hash: string;
  sequence: string;
  fee: string;
  ledger: number | null;
  status: 'SUCCEEDED' | 'FAILED';
  errorMessage?: string;
}

/** Wraps Horizon for balances, tx building and submission. */
export class StellarNetwork {
  readonly server: Horizon.Server;
  readonly config: StellarNetworkConfig;

  constructor(config: StellarNetworkConfig) {
    this.config = config;
    this.server = new Horizon.Server(config.horizonUrl);
  }

  static forTestnet(): StellarNetwork {
    return new StellarNetwork({
      horizonUrl: 'https://horizon-testnet.stellar.org',
      networkPassphrase: Networks.TESTNET,
    });
  }

  /** List native + issued asset balances for an account. */
  async getBalances(publicKey: string): Promise<AssetBalance[]> {
    const account = await this.server.loadAccount(publicKey);
    return account.balances
      .filter((b) => b.asset_type === 'native' || b.asset_type === 'credit_alphanum4' || b.asset_type === 'credit_alphanum12')
      .map((b) => {
        if (b.asset_type === 'native') {
          return {
            assetCode: 'XLM',
            assetIssuer: null,
            balance: b.balance,
            stroops: toStroops(b.balance).toString(),
            isNative: true,
          } satisfies AssetBalance;
        }
        const credit = b as Horizon.HorizonApi.BalanceLineAsset;
        return {
          assetCode: credit.asset_code,
          assetIssuer: credit.asset_issuer,
          balance: credit.balance,
          stroops: toStroops(credit.balance).toString(),
          isNative: false,
        } satisfies AssetBalance;
      });
  }

  /** Load account details (or null when the account doesn't exist). */
  async getAccount(
    publicKey: string,
  ): Promise<Awaited<ReturnType<Horizon.Server['loadAccount']>> | null> {
    try {
      return await this.server.loadAccount(publicKey);
    } catch {
      return null;
    }
  }

  /** Build an unsigned payment transaction, returning the base64 XDR for wallet signing. */
  async buildPaymentTransaction(input: PaymentTxInput): Promise<string> {
    const source = await this.server.loadAccount(input.from);
    const asset: StellarAsset =
      input.assetCode === 'XLM' ? Asset.native() : new Asset(input.assetCode, input.assetIssuer!);

    const memo =
      input.memo && input.memoType
        ? input.memoType === 'hash'
          ? Memo.hash(input.memo)
          : input.memoType === 'id'
            ? Memo.id(input.memo)
            : Memo.text(input.memo)
        : Memo.none();

    const tx = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          destination: input.to,
          asset,
          amount: input.amount,
        }),
      )
      .addMemo(memo)
      .setTimeout(300)
      .build();

    return tx.toXDR();
  }

  /** Build a changeTrust transaction (unsigned XDR for wallet signing). */
  async buildTrustlineTransaction(input: {
    from: string;
    assetCode: string;
    assetIssuer: string;
    limit?: string;
    remove?: boolean;
  }): Promise<string> {
    const source = await this.server.loadAccount(input.from);
    const asset = new Asset(input.assetCode, input.assetIssuer);
    const tx = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase,
    })
      .addOperation(
        Operation.changeTrust({
          asset,
          limit: input.remove ? '0' : input.limit,
        }),
      )
      .setTimeout(300)
      .build();
    return tx.toXDR();
  }

  /** Submit a signed transaction envelope (base64 XDR string). */
  async submitSignedTransaction(signedXdr: string): Promise<SubmitResult> {
    try {
      // v13 submits a decoded Transaction object rather than a raw XDR string.
      const tx = TransactionBuilder.fromXDR(
        signedXdr,
        this.config.networkPassphrase,
      ) as Transaction;
      const response = await this.server.submitTransaction(tx);
      return {
        hash: response.hash,
        sequence: tx.sequence,
        fee: tx.fee,
        ledger: response.ledger,
        status: response.successful ? 'SUCCEEDED' : 'FAILED',
      };
    } catch (error) {
      const err = error as { response?: { data?: { extras?: { result_codes?: { transaction?: string } } } } };
      return {
        hash: '',
        sequence: '',
        fee: BASE_FEE,
        ledger: null,
        status: 'FAILED',
        errorMessage:
          err.response?.data?.extras?.result_codes?.transaction ?? (error as Error).message,
      };
    }
  }

  /** Build a simulated fee estimate without submitting. */
  async estimateFee(input: PaymentTxInput): Promise<{ fee: string; warnings: string[] }> {
    const warnings: string[] = [];
    const simulated = await this.server.feeStats().catch(() => null);
    return {
      fee: simulated?.fee_charged?.max ?? BASE_FEE,
      warnings,
    };
  }
}
