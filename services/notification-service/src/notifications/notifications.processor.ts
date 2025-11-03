import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private notificationsService: NotificationsService) {}

  @Process('send')
  async handleSend(job: Job) {
    this.logger.log(`Processing notification job ${job.id}`);
    const { notificationId } = job.data;

    try {
      await this.notificationsService.processSend(notificationId);
      this.logger.log(`Notification ${notificationId} processed successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to process notification ${notificationId}:`,
        error.message,
      );
      throw error;
    }
  }

  @Process('bulk')
  async handleBulk(job: Job) {
    this.logger.log(`Processing bulk notification job ${job.id}`);
    const { templateKey, recipients, channels } = job.data;

    for (const recipient of recipients) {
      try {
        await this.notificationsService.send({
          templateKey,
          userId: recipient.userId,
          email: recipient.email,
          phone: recipient.phone,
          deviceToken: recipient.deviceToken,
          channels,
          variables: recipient.variables,
        });
      } catch (error) {
        this.logger.error(
          `Failed to send notification to ${recipient.userId}:`,
          error.message,
        );
      }
    }

    this.logger.log(`Bulk job ${job.id} completed`);
  }
}
