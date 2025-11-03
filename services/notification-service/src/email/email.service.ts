import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { EmailProvider, EmailStatus } from '@prisma/client';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const provider = this.config.get('EMAIL_PROVIDER');

    if (provider === 'NODEMAILER') {
      this.transporter = nodemailer.createTransport({
        host: this.config.get('SMTP_HOST'),
        port: parseInt(this.config.get('SMTP_PORT') || '587'),
        secure: false,
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        },
      });
    }
    // Add SendGrid, AWS SES implementations here
  }

  async send(params: {
    notificationId: string;
    to: string;
    subject: string;
    body: string;
    html?: string;
    cc?: string;
    bcc?: string;
  }): Promise<string> {
    const { notificationId, to, subject, body, html, cc, bcc } = params;

    // Create email log
    const emailLog = await this.prisma.emailLog.create({
      data: {
        notificationId,
        to,
        cc,
        bcc,
        subject,
        body,
        html,
        provider: EmailProvider.NODEMAILER,
        status: EmailStatus.PENDING,
      },
    });

    try {
      const info = await this.transporter.sendMail({
        from: this.config.get('EMAIL_FROM'),
        to,
        cc,
        bcc,
        subject,
        text: body,
        html,
      });

      // Update log
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.SENT,
          messageId: info.messageId,
          sentAt: new Date(),
        },
      });

      this.logger.log(`Email sent successfully to ${to}`);
      return emailLog.id;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error.message);

      // Update log with error
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.FAILED,
          errorMessage: error.message,
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  }

  async processWebhook(event: any): Promise<void> {
    // Handle SendGrid webhook events
    const { email, event: eventType, sg_message_id, timestamp } = event;

    const emailLog = await this.prisma.emailLog.findUnique({
      where: { messageId: sg_message_id },
    });

    if (!emailLog) {
      this.logger.warn(`Email log not found for message ID: ${sg_message_id}`);
      return;
    }

    const updates: any = {};

    switch (eventType) {
      case 'delivered':
        updates.status = EmailStatus.DELIVERED;
        updates.deliveredAt = new Date(timestamp * 1000);
        break;
      case 'open':
        updates.status = EmailStatus.OPENED;
        updates.openedAt = new Date(timestamp * 1000);
        break;
      case 'click':
        updates.status = EmailStatus.CLICKED;
        updates.clickedAt = new Date(timestamp * 1000);
        break;
      case 'bounce':
        updates.status = EmailStatus.BOUNCED;
        updates.bouncedAt = new Date(timestamp * 1000);
        break;
      case 'spamreport':
        updates.status = EmailStatus.COMPLAINED;
        updates.complainedAt = new Date(timestamp * 1000);
        break;
    }

    await this.prisma.emailLog.update({
      where: { id: emailLog.id },
      data: updates,
    });

    this.logger.log(`Email status updated: ${eventType} for ${email}`);
  }

  async getEmailLog(id: string) {
    return this.prisma.emailLog.findUnique({
      where: { id },
      include: { notification: true },
    });
  }

  async getEmailLogs(filters?: {
    notificationId?: string;
    status?: EmailStatus;
    to?: string;
  }) {
    return this.prisma.emailLog.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
