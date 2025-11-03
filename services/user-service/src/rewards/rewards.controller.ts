import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';
import {
  EarnCoinsDto,
  RedeemCoinsDto,
  CheckRedemptionDto,
  QueryCoinTransactionsDto,
} from './dto';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  // ==================== WALLET ====================

  @Get('wallet/:userId')
  async getWallet(@Param('userId') userId: string) {
    return this.rewardsService.getWallet(userId);
  }

  @Get('wallet/:userId/branded-coins')
  async getBrandedCoins(@Param('userId') userId: string) {
    return this.rewardsService.getBrandedCoins(userId);
  }

  // ==================== EARN COINS ====================

  @Post('coins/earn')
  @HttpCode(HttpStatus.CREATED)
  async earnCoins(@Body() earnCoinsDto: EarnCoinsDto) {
    return this.rewardsService.earnCoins(earnCoinsDto);
  }

  // ==================== REDEEM COINS ====================

  @Post('coins/redeem')
  @HttpCode(HttpStatus.OK)
  async redeemCoins(@Body() redeemCoinsDto: RedeemCoinsDto) {
    return this.rewardsService.redeemCoins(redeemCoinsDto);
  }

  @Post('coins/check-redemption')
  @HttpCode(HttpStatus.OK)
  async checkRedemption(@Body() checkRedemptionDto: CheckRedemptionDto) {
    return this.rewardsService.checkRedemption(checkRedemptionDto);
  }

  // ==================== TRANSACTIONS ====================

  @Get('transactions/:userId')
  async getCoinTransactions(
    @Param('userId') userId: string,
    @Query() query: QueryCoinTransactionsDto,
  ) {
    return this.rewardsService.getCoinTransactions(userId, query);
  }

  @Get('transactions/:userId/:transactionId')
  async getTransactionById(
    @Param('userId') userId: string,
    @Param('transactionId') transactionId: string,
  ) {
    return this.rewardsService.getTransactionById(userId, transactionId);
  }

  // ==================== ADMIN OPERATIONS ====================

  @Post('admin/expire-coins')
  @HttpCode(HttpStatus.OK)
  async expireCoins() {
    return this.rewardsService.expireCoins();
  }

  @Post('admin/bulk-earn')
  @HttpCode(HttpStatus.CREATED)
  async bulkEarnCoins(@Body() awards: any[]) {
    return this.rewardsService.bulkEarnCoins(awards);
  }
}
