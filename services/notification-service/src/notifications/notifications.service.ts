import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemplatesService } from '../templates/templates.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { PushService } from '../push/push.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private templatesService: TemplatesService,
    private emailService: EmailService,
    private smsService: SmsService,
    private pushService: PushService,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async send(sendNotificationDto: SendNotificationDto): Promise<string> {
    const {
      templateKey,
      userId,
      email,
      phone,
      deviceToken,
      channels,
      variables,
      metadata,
      scheduledAt,
    } = sendNotificationDto;

    // Check user preferences
    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Filter channels based on preferences
    const allowedChannels = channels.filter((channel) => {
      if (!preferences) return true;
      if (channel === NotificationChannel.EMAIL) return preferences.emailEnabled;
      if (channel === NotificationChannel.SMS) return preferences.smsEnabled;
      if (channel === NotificationChannel.PUSH) return preferences.pushEnabled;
      return true;
    });

    if (allowedChannels.length === 0) {
      throw new BadRequestException('All channels are disabled for this user');
    }

    // Validate and render template
    await this.templatesService.validateVariables(templateKey, variables);
    const rendered = await this.templatesService.renderTemplate(
      templateKey,
      variables,
    );

    // Get template
    const template = await this.templatesService.findByKey(templateKey);

    // Create notification record
    const notification = await this.prisma.notification.create({
      data: {
        templateId: template.id,
        userId,
        email,
        phone,
        deviceToken,
        channels: allowedChannels,
        status: scheduledAt
          ? NotificationStatus.PENDING
          : NotificationStatus.QUEUED,
        emailSubject: rendered.emailSubject,
        emailBody: rendered.emailBody,
        emailHtml: rendered.emailHtml,
        smsBody: rendered.smsBody,
        pushTitle: rendered.pushTitle,
        pushBody: rendered.pushBody,
        pushData: rendered.pushData,
        metadata,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    // Queue for processing
    if (scheduledAt) {
      const delay = new Date(scheduledAt).getTime() - Date.now();
      await this.notificationQueue.add(
        'send',
        { notificationId: notification.id },
        { delay: Math.max(0, delay) },
      );
    } else {
      await this.notificationQueue.add('send', {
        notificationId: notification.id,
      });
    }

    this.logger.log(
      `Notification queued: ${notification.id} for user ${userId}`,
    );
    return notification.id;
  }

  async processSend(notificationId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    // Update status
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: NotificationStatus.PROCESSING },
    });

    const results: any = { success: [], failed: [] };

    // Send via each channel
    try {
      const promises = [];

      if (
        notification.channels.includes(NotificationChannel.EMAIL) &&
        notification.email
      ) {
        promises.push(
          this.emailService
            .send({
              notificationId: notification.id,
              to: notification.email,
              subject: notification.emailSubject,
              body: notification.emailBody,
              html: notification.emailHtml,
            })
            .then(() => results.success.push('EMAIL'))
            .catch(() => results.failed.push('EMAIL')),
        );
      }

      if (
        notification.channels.includes(NotificationChannel.SMS) &&
        notification.phone
      ) {
        promises.push(
          this.smsService
            .send({
              notificationId: notification.id,
              to: notification.phone,
              body: notification.smsBody,
            })
            .then(() => results.success.push('SMS'))
            .catch(() => results.failed.push('SMS')),
        );
      }

      if (
        notification.channels.includes(NotificationChannel.PUSH) &&
        notification.deviceToken
      ) {
        promises.push(
          this.pushService
            .send({
              notificationId: notification.id,
              userId: notification.userId,
              deviceToken: notification.deviceToken,
              title: notification.pushTitle,
              body: notification.pushBody,
              data: notification.pushData as any,
            })
            .then(() => results.success.push('PUSH'))
            .catch(() => results.failed.push('PUSH')),
        );
      }

      await Promise.allSettled(promises);

      // Determine final status
      const status =
        results.failed.length === 0
          ? NotificationStatus.SENT
          : results.success.length > 0
            ? NotificationStatus.PARTIALLY_SENT
            : NotificationStatus.FAILED;

      // Update status
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status,
          sentAt: new Date(),
        },
      });

      this.logger.log(
        `Notification processed: ${notificationId} - ${status}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process notification ${notificationId}:`,
        error.message,
      );

      // Update status
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.FAILED },
      });

      throw error;
    }
  }

  async getStatus(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        emailLogs: true,
        smsLogs: true,
        pushLogs: true,
      },
    });

    if (!notification) {
      throw new BadRequestException('Notification not found');
    }

    return {
      id: notification.id,
      status: notification.status,
      channels: notification.channels,
      sentAt: notification.sentAt,
      delivery: {
        email: notification.emailLogs[0] || null,
        sms: notification.smsLogs[0] || null,
        push: notification.pushLogs[0] || null,
      },
    };
  }

  async retry(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new BadRequestException('Notification not found');
    }

    if (notification.status === NotificationStatus.SENT) {
      throw new BadRequestException('Notification already sent successfully');
    }

    // Reset status and queue again
    await this.prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.QUEUED },
    });

    await this.notificationQueue.add('send', { notificationId: id });

    this.logger.log(`Notification retry queued: ${id}`);
    return { id, status: 'QUEUED' };
  }

  async cancel(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new BadRequestException('Notification not found');
    }

    if (notification.status !== NotificationStatus.PENDING) {
      throw new BadRequestException(
        'Only pending notifications can be cancelled',
      );
    }

    await this.prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.CANCELLED },
    });

    this.logger.log(`Notification cancelled: ${id}`);
    return { id, status: 'CANCELLED' };
  }

  async findAll(filters?: {
    userId?: string;
    status?: NotificationStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
