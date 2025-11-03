import { Controller, Get, Query } from '@nestjs/common';
import { AdminAnalyticsService } from './admin-analytics.service';

@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  // ==================== PLATFORM ANALYTICS ====================

  @Get('overview')
  async getPlatformOverview() {
    return this.adminAnalyticsService.getPlatformOverview();
  }

  @Get('users')
  async getUserAnalytics(@Query('days') days?: string) {
    return this.adminAnalyticsService.getUserAnalytics(days ? parseInt(days) : 30);
  }

  @Get('vendors')
  async getVendorAnalytics() {
    return this.adminAnalyticsService.getVendorAnalytics();
  }

  @Get('vendors/performance')
  async getVendorPerformance(@Query('limit') limit?: string) {
    return this.adminAnalyticsService.getVendorPerformance(limit ? parseInt(limit) : 10);
  }

  @Get('commission')
  async getCommissionAnalytics(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminAnalyticsService.getCommissionAnalytics({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('payouts')
  async getPayoutAnalytics() {
    return this.adminAnalyticsService.getPayoutAnalytics();
  }

  @Get('rewards')
  async getRewardsAnalytics() {
    return this.adminAnalyticsService.getRewardsAnalytics();
  }

  @Get('hourly')
  async getHourlyActivity(@Query('date') date?: string) {
    return this.adminAnalyticsService.getHourlyActivity(date ? new Date(date) : undefined);
  }
}
