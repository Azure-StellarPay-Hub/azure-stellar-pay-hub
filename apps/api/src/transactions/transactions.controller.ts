import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../common/decorators';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Public()
  @Get()
  list(
    @Query()
    query: {
      page?: string;
      pageSize?: string;
      status?: string;
      assetCode?: string;
      search?: string;
    },
  ) {
    return this.transactions.list({
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 20,
      status: query.status,
      assetCode: query.assetCode,
      search: query.search,
    });
  }

  @Public()
  @Get('stats')
  stats() {
    return this.transactions.stats();
  }

  @Public()
  @Get('hash/:hash')
  byHash(@Param('hash') hash: string) {
    return this.transactions.getByHash(hash);
  }

  @Public()
  @Get(':id')
  byId(@Param('id') id: string) {
    return this.transactions.getById(id);
  }
}
