import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RewardsService } from '../rewards/rewards.service';
import { CashbackService } from '../rewards/cashback.service';

@Injectable()
export class RewardsSchedulerService {
  private readonly logger = new Logger(RewardsSchedulerService.name);

  constructor(
    private rewardsService: RewardsService,
    private cashbackService: CashbackService,
  ) {}

  // ==================== EXPIRE COINS ====================
  // Runs daily at 00:00 UTC
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCoinsExpiry() {
    this.logger.log('Starting daily coins expiry job...');

    try {
      const result = await this.rewardsService.expireCoins();
      this.logger.log(
        `Coins expiry job completed: ${result.expired} transactions processed`,
      );
    } catch (error) {
      this.logger.error('Coins expiry job failed:', error.message);
    }
  }

  // ==================== EXPIRE CASHBACK ====================
  // Runs daily at 00:30 UTC (30 minutes after coins expiry)
  @Cron('30 0 * * *')
  async handleCashbackExpiry() {
    this.logger.log('Starting daily cashback expiry job...');

    try {
      const result = await this.cashbackService.expireCashback();
      this.logger.log(
        `Cashback expiry job completed: ${result.expired} transactions expired`,
      );
    } catch (error) {
      this.logger.error('Cashback expiry job failed:', error.message);
    }
  }

  // ==================== REMINDER JOBS ====================

  // Send reminders for expiring coins (runs every Monday at 9 AM UTC)
  @Cron('0 9 * * 1')
  async sendExpiringCoinsReminder() {
    this.logger.log('Starting expiring coins reminder job...');

    try {
      // TODO: Implement logic to find users with coins expiring in next 7 days
      // and send them notification/email reminders
      this.logger.log('Expiring coins reminder job completed');
    } catch (error) {
      this.logger.error('Expiring coins reminder job failed:', error.message);
    }
  }

  // Send reminders for pending cashback (runs every day at 10 AM UTC)
  @Cron('0 10 * * *')
  async sendPendingCashbackReminder() {
    this.logger.log('Starting pending cashback reminder job...');

    try {
      // TODO: Implement logic to find users with pending cashback
      // and send them notification about expected credit date
      this.logger.log('Pending cashback reminder job completed');
    } catch (error) {
      this.logger.error('Pending cashback reminder job failed:', error.message);
    }
  }

  // ==================== CAMPAIGN MANAGEMENT ====================

  // Deactivate expired campaigns (runs every hour)
  @Cron(CronExpression.EVERY_HOUR)
  async deactivateExpiredCampaigns() {
    this.logger.log('Starting expired campaigns deactivation job...');

    try {
      // TODO: Implement logic to find and deactivate campaigns
      // where endDate has passed
      this.logger.log('Expired campaigns deactivation job completed');
    } catch (error) {
      this.logger.error('Expired campaigns deactivation job failed:', error.message);
    }
  }

  // ==================== MANUAL TRIGGER METHODS ====================
  // These can be called manually via API for testing or immediate execution

  async triggerCoinsExpiry() {
    this.logger.log('Manual trigger: Coins expiry');
    return this.handleCoinsExpiry();
  }

  async triggerCashbackExpiry() {
    this.logger.log('Manual trigger: Cashback expiry');
    return this.handleCashbackExpiry();
  }
}
