import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { assetQuerySchema, type AssetQuery } from '@stellar-pay/validation';
import { AssetsService } from './assets.service';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Public()
  @Get()
  list(@Query(new ZodValidationPipe({ query: assetQuerySchema })) query: AssetQuery) {
    return this.assets.list(query);
  }

  @Public()
  @Get(':code')
  get(@Param('code') code: string) {
    return this.assets.getByCode(code);
  }
}
