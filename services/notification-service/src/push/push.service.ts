import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import { PushProvider, PushStatus } from '@prisma/client';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private firebaseApp: admin.app.App;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    const projectId = this.config.get('FIREBASE_PROJECT_ID');
    const privateKey = this.config.get('FIREBASE_PRIVATE_KEY');
    const clientEmail = this.config.get('FIREBASE_CLIENT_EMAIL');

    if (projectId && privateKey && clientEmail) {
      try {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey: privateKey.replace(/\\n/g, '\n'),
            clientEmail,
          }),
        });
        this.logger.log('Firebase initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Firebase:', error.message);
      }
    }
  }

  async send(params: {
    notificationId: string;
    userId: string;
    deviceToken: string;
    title: string;
    body: string;
    data?: any;
  }): Promise<string> {
    const { notificationId, userId, deviceToken, title, body, data } = params;

    // Create push log
    const pushLog = await this.prisma.pushLog.create({
      data: {
        notificationId,
        userId,
        deviceToken,
        title,
        body,
        data,
        provider: PushProvider.FIREBASE,
        status: PushStatus.PENDING,
      },
    });

    try {
      if (!this.firebaseApp) {
        throw new Error('Firebase not initialized');
      }

      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        token: deviceToken,
      };

      const messageId = await admin.messaging().send(message);

      // Update log
      await this.prisma.pushLog.update({
        where: { id: pushLog.id },
        data: {
          status: PushStatus.SENT,
          messageId,
          sentAt: new Date(),
        },
      });

      this.logger.log(`Push notification sent successfully to user ${userId}`);
      return pushLog.id;
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to user ${userId}:`,
        error.message,
      );

      // Check if token is invalid
      const status =
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
          ? PushStatus.INVALID_TOKEN
          : PushStatus.FAILED;

      // Update log with error
      await this.prisma.pushLog.update({
        where: { id: pushLog.id },
        data: {
          status,
          errorMessage: error.message,
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  }

  async getPushLog(id: string) {
    return this.prisma.pushLog.findUnique({
      where: { id },
      include: { notification: true },
    });
  }

  async getPushLogs(filters?: {
    notificationId?: string;
    userId?: string;
    status?: PushStatus;
  }) {
    return this.prisma.pushLog.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
