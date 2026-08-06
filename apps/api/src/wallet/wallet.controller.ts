import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { Public, CurrentUser, type AuthenticatedUser } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { trustlineSchema, type TrustlineInput } from '@stellar-pay/validation';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Public()
  @Get(':publicKey/balances')
  balances(@Param('publicKey') publicKey: string) {
    return this.wallet.getBalances(publicKey);
  }

  @Public()
  @Get(':publicKey/trustlines')
  trustlines(@Param('publicKey') publicKey: string) {
    return this.wallet.listTrustlines(publicKey);
  }

  @Post('trustlines')
  addTrustline(
    @CurrentUser() user: AuthenticatedUser,
    @Query('publicKey') publicKey: string,
    @Body(new ZodValidationPipe({ body: trustlineSchema })) body: TrustlineInput,
  ) {
    void user;
    return this.wallet.buildTrustlineXdr({
      from: publicKey,
      assetCode: body.assetCode,
      assetIssuer: body.assetIssuer,
      limit: body.limit,
    });
  }

  @Delete('trustlines')
  removeTrustline(
    @CurrentUser() user: AuthenticatedUser,
    @Query('publicKey') publicKey: string,
    @Body(new ZodValidationPipe({ body: trustlineSchema })) body: TrustlineInput,
  ) {
    void user;
    return this.wallet.buildTrustlineXdr({
      from: publicKey,
      assetCode: body.assetCode,
      assetIssuer: body.assetIssuer,
      remove: true,
    });
  }

  @Post('trustlines/record')
  recordTrustline(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe({ body: trustlineSchema })) body: TrustlineInput,
  ) {
    return this.wallet.recordTrustline(user.userId, body);
  }
}
