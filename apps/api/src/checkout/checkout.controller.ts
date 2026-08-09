import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../common/decorators';
import { CheckoutService } from './checkout.service';

@Public()
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Get('payment-link/:code')
  paymentLink(@Param('code') code: string) {
    return this.checkout.getPaymentLink(code);
  }

  @Get('invoice/:number')
  invoice(@Param('number') number: string) {
    return this.checkout.getInvoice(number);
  }

  @Post('payment-link/:code/pay')
  payLink(@Param('code') code: string, @Body() body: { publicKey: string; amount?: string }) {
    return this.checkout.payPaymentLink(code, body.publicKey, body.amount);
  }

  @Post('invoice/:number/pay')
  payInvoice(@Param('number') number: string, @Body() body: { publicKey: string }) {
    return this.checkout.payInvoice(number, body.publicKey);
  }

  @Post('transactions/:id/submit')
  submit(@Param('id') id: string, @Body() body: { signedXdr: string }) {
    return this.checkout.submitSigned(id, body.signedXdr);
  }
}
