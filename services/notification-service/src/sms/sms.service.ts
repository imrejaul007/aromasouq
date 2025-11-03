import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { PrismaService } from '../prisma/prisma.service';
import { SMSProvider, SMSStatus } from '@prisma/client';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: Twilio;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const accountSid = this.config.get('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken) {
      this.twilioClient = new Twilio(accountSid, authToken);
    }
  }

  async send(params: {
    notificationId: string;
    to: string;
    body: string;
  }): Promise<string> {
    const { notificationId, to, body } = params;

    // Calculate segments (160 chars per segment)
    const segments = Math.ceil(body.length / 160);

    // Create SMS log
    const smsLog = await this.prisma.sMSLog.create({
      data: {
        notificationId,
        to,
        body,
        provider: SMSProvider.TWILIO,
        status: SMSStatus.PENDING,
        segments,
      },
    });

    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized');
      }

      const message = await this.twilioClient.messages.create({
        body,
        to,
        from: this.config.get('TWILIO_PHONE_NUMBER'),
      });

      // Update log
      await this.prisma.sMSLog.update({
        where: { id: smsLog.id },
        data: {
          status: SMSStatus.SENT,
          messageId: message.sid,
          sentAt: new Date(),
        },
      });

      this.logger.log(`SMS sent successfully to ${to}`);
      return smsLog.id;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}:`, error.message);

      // Update log with error
      await this.prisma.sMSLog.update({
        where: { id: smsLog.id },
        data: {
          status: SMSStatus.FAILED,
          errorMessage: error.message,
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  }

  async processWebhook(data: any): Promise<void> {
    const { MessageSid, MessageStatus } = data;

    const smsLog = await this.prisma.sMSLog.findUnique({
      where: { messageId: MessageSid },
    });

    if (!smsLog) {
      this.logger.warn(`SMS log not found for message ID: ${MessageSid}`);
      return;
    }

    const updates: any = {};

    switch (MessageStatus) {
      case 'delivered':
        updates.status = SMSStatus.DELIVERED;
        updates.deliveredAt = new Date();
        break;
      case 'undelivered':
      case 'failed':
        updates.status = SMSStatus.FAILED;
        updates.failedAt = new Date();
        break;
    }

    await this.prisma.sMSLog.update({
      where: { id: smsLog.id },
      data: updates,
    });

    this.logger.log(`SMS status updated: ${MessageStatus} for ${smsLog.to}`);
  }

  async getSmsLog(id: string) {
    return this.prisma.sMSLog.findUnique({
      where: { id },
      include: { notification: true },
    });
  }

  async getSmsLogs(filters?: {
    notificationId?: string;
    status?: SMSStatus;
    to?: string;
  }) {
    return this.prisma.sMSLog.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
