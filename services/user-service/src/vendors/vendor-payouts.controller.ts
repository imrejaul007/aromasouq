import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { VendorPayoutsService } from './vendor-payouts.service';
import {
  RequestPayoutDto,
  PayoutQueryDto,
  CancelPayoutDto,
} from './dto';

// Note: Import these guards from your auth setup
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('vendor/payouts')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('VENDOR')
export class VendorPayoutsController {
  constructor(private readonly payoutsService: VendorPayoutsService) {}

  // ==================== VENDOR PAYOUT MANAGEMENT ====================

  @Get()
  async getPayouts(@Request() req: any, @Query() query: PayoutQueryDto) {
    // Extract vendorId from JWT token: req.user.vendorId
    const vendorId = req.user?.vendorId || 'mock-vendor-id'; // TODO: Get actual vendorId from JWT

    return this.payoutsService.getVendorPayouts(vendorId, {
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('current-earnings')
  async getCurrentEarnings(@Request() req: any) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';
    return this.payoutsService.getCurrentPeriodEarnings(vendorId);
  }

  @Get(':id')
  async getPayoutDetails(@Request() req: any, @Param('id') payoutId: string) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';
    return this.payoutsService.getPayoutById(payoutId, vendorId);
  }

  @Post('request')
  async requestPayout(@Request() req: any, @Body() dto: RequestPayoutDto) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';

    return this.payoutsService.requestPayout(vendorId, {
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
      orderIds: dto.orderIds,
      totalSales: dto.totalSales,
      platformCommission: dto.platformCommission,
      adjustments: dto.adjustments,
    });
  }

  @Delete(':id')
  async cancelPayout(
    @Request() req: any,
    @Param('id') payoutId: string,
    @Body() dto: CancelPayoutDto,
  ) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';

    // Verify ownership
    await this.payoutsService.getPayoutById(payoutId, vendorId);

    return this.payoutsService.cancelPayout(
      payoutId,
      dto.reason,
      `vendor-${vendorId}`,
    );
  }
}
