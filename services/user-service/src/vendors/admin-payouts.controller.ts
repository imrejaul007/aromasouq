import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { VendorPayoutsService } from './vendor-payouts.service';
import {
  PayoutQueryDto,
  ProcessPayoutDto,
  CompletePayoutDto,
  FailPayoutDto,
} from './dto';

// Note: Import these guards from your auth setup
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/payouts')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('ADMIN', 'SUPER_ADMIN')
export class AdminPayoutsController {
  constructor(private readonly payoutsService: VendorPayoutsService) {}

  // ==================== ADMIN PAYOUT MANAGEMENT ====================

  @Get()
  async getAllPayouts(@Query() query: PayoutQueryDto) {
    return this.payoutsService.getAllPayouts({
      status: query.status,
      vendorId: query.vendorId,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('summary')
  async getPayoutSummary() {
    return this.payoutsService.getPayoutSummary();
  }

  @Get(':id')
  async getPayoutDetails(@Param('id') payoutId: string) {
    return this.payoutsService.getPayoutById(payoutId);
  }

  @Patch(':id/process')
  async processPayout(@Param('id') payoutId: string, @Body() dto: ProcessPayoutDto) {
    return this.payoutsService.processPayout(payoutId, dto.adminId);
  }

  @Patch(':id/complete')
  async completePayout(@Param('id') payoutId: string, @Body() dto: CompletePayoutDto) {
    return this.payoutsService.completePayout(payoutId, dto.adminId, {
      transactionReference: dto.transactionReference,
      paymentMethod: dto.paymentMethod,
      notes: dto.notes,
    });
  }

  @Patch(':id/fail')
  async failPayout(@Param('id') payoutId: string, @Body() dto: FailPayoutDto) {
    return this.payoutsService.failPayout(payoutId, dto.adminId, dto.reason);
  }
}
