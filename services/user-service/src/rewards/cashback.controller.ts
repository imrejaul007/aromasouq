import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CashbackService } from './cashback.service';
import { EarnCashbackDto, RedeemCashbackDto, QueryCashbackTransactionsDto } from './dto';

@Controller('cashback')
export class CashbackController {
  constructor(private readonly cashbackService: CashbackService) {}

  // ==================== EARN CASHBACK ====================

  @Post('earn')
  @HttpCode(HttpStatus.CREATED)
  async earnCashback(@Body() earnCashbackDto: EarnCashbackDto) {
    return this.cashbackService.earnCashback(earnCashbackDto);
  }

  // ==================== CREDIT CASHBACK ====================

  @Post('credit/:transactionId')
  @HttpCode(HttpStatus.OK)
  async creditCashback(@Param('transactionId') transactionId: string) {
    return this.cashbackService.creditCashback(transactionId);
  }

  @Post('credit/order/:orderId')
  @HttpCode(HttpStatus.OK)
  async creditCashbackByOrderId(@Param('orderId') orderId: string) {
    return this.cashbackService.creditCashbackByOrderId(orderId);
  }

  // ==================== REDEEM CASHBACK ====================

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  async redeemCashback(@Body() redeemCashbackDto: RedeemCashbackDto) {
    const { userId, amount } = redeemCashbackDto;
    return this.cashbackService.redeemCashback(userId, amount);
  }

  // ==================== CANCEL CASHBACK ====================

  @Post('cancel/:transactionId')
  @HttpCode(HttpStatus.OK)
  async cancelCashback(@Param('transactionId') transactionId: string) {
    return this.cashbackService.cancelCashback(transactionId);
  }

  @Post('cancel/order/:orderId')
  @HttpCode(HttpStatus.OK)
  async cancelCashbackByOrderId(@Param('orderId') orderId: string) {
    return this.cashbackService.cancelCashbackByOrderId(orderId);
  }

  // ==================== GET CASHBACK ====================

  @Get('transactions/:userId')
  async getCashbackTransactions(
    @Param('userId') userId: string,
    @Query() query: QueryCashbackTransactionsDto,
  ) {
    return this.cashbackService.getCashbackTransactions(userId, query);
  }

  @Get('pending/:userId')
  async getPendingCashback(@Param('userId') userId: string) {
    return this.cashbackService.getPendingCashback(userId);
  }

  // ==================== ADMIN OPERATIONS ====================

  @Post('admin/expire')
  @HttpCode(HttpStatus.OK)
  async expireCashback() {
    return this.cashbackService.expireCashback();
  }
}
