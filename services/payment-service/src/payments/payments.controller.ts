import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentIntentDto,
  ConfirmPaymentDto,
  CreateRefundDto,
} from './dto/create-payment.dto';
import { PaymentProvider } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  async createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(dto);
  }

  @Post('confirm')
  async confirmPayment(@Body() dto: ConfirmPaymentDto) {
    return this.paymentsService.confirmPayment(dto);
  }

  @Post('refund')
  async createRefund(@Body() dto: CreateRefundDto) {
    return this.paymentsService.createRefund(dto);
  }

  @Get('intent/:id')
  async getPaymentIntent(@Param('id') id: string) {
    return this.paymentsService.getPaymentIntent(id);
  }

  @Get('order/:orderId')
  async getTransactionsByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.getTransactionsByOrder(orderId);
  }

  @Get('user/:userId')
  async getTransactionsByUser(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.getTransactionsByUser(userId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post('webhooks/stripe')
  async handleStripeWebhook(
    @Body() payload: any,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.processWebhook(
      PaymentProvider.STRIPE,
      payload,
      signature,
    );
  }
}
