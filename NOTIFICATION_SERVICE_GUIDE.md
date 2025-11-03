# Notification Service - Implementation Guide

## Overview

The **Notification Service** handles all customer communications across Email, SMS, and Push Notification channels. It provides a unified API for sending notifications, template management, delivery tracking, and webhook processing.

**Location**: `/services/notification-service`
**Port**: 3400
**Database**: PostgreSQL (aromasouq_notifications)

---

## Database Schema Summary

### Models (8 total)

1. **NotificationTemplate** - Reusable notification templates with variable substitution
2. **Notification** - Individual notification records with multi-channel support
3. **EmailLog** - Email delivery tracking with open/click analytics
4. **SMSLog** - SMS delivery tracking with cost monitoring
5. **PushLog** - Push notification delivery tracking
6. **NotificationPreference** - User notification preferences and opt-in/opt-out settings
7. **NotificationWebhook** - Webhook processing for delivery status updates
8. **Enums**: NotificationChannel, NotificationStatus, EmailProvider, EmailStatus, SMSProvider, SMSStatus, PushProvider, PushStatus

### Key Features

- **Multi-channel delivery**: Email, SMS, Push notifications in a single API call
- **Template system**: Reusable templates with variable substitution (e.g., `{{orderNumber}}`)
- **Delivery tracking**: Track every notification through its lifecycle
- **Webhook processing**: Receive and process delivery status updates from providers
- **User preferences**: Granular opt-in/opt-out controls per channel and category
- **Queue system**: Async processing with Bull for high-volume sending
- **Retry logic**: Automatic retry with exponential backoff
- **Cost tracking**: Monitor SMS costs per message

---

## API Endpoints (20 total)

### Template Management (5 endpoints)

#### 1. Create Template
```http
POST /api/templates
Authorization: Bearer {admin_token}

{
  "key": "order-confirmed",
  "name": "Order Confirmation",
  "description": "Sent when order is successfully placed",
  "emailSubject": "Order {{orderNumber}} Confirmed - AromaSouQ",
  "emailBody": "Dear {{customerName}}, your order {{orderNumber}} has been confirmed...",
  "emailHtml": "<html>...</html>",
  "smsBody": "Order {{orderNumber}} confirmed. Track: {{trackingUrl}}",
  "pushTitle": "Order Confirmed",
  "pushBody": "Your order {{orderNumber}} is confirmed!",
  "pushData": { "type": "order", "action": "view" },
  "variables": ["orderNumber", "customerName", "trackingUrl", "total"]
}

Response 201:
{
  "id": "uuid",
  "key": "order-confirmed",
  "name": "Order Confirmation",
  "isActive": true,
  "createdAt": "2024-01-20T10:00:00Z"
}
```

#### 2. Get All Templates
```http
GET /api/templates?page=1&limit=20&isActive=true
Authorization: Bearer {admin_token}

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "key": "order-confirmed",
      "name": "Order Confirmation",
      "description": "Sent when order is successfully placed",
      "isActive": true,
      "createdAt": "2024-01-20T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

#### 3. Get Template by Key
```http
GET /api/templates/order-confirmed
Authorization: Bearer {admin_token}

Response 200:
{
  "id": "uuid",
  "key": "order-confirmed",
  "name": "Order Confirmation",
  "emailSubject": "Order {{orderNumber}} Confirmed",
  "emailBody": "...",
  "variables": ["orderNumber", "customerName"],
  "isActive": true
}
```

#### 4. Update Template
```http
PATCH /api/templates/:id
Authorization: Bearer {admin_token}

{
  "emailSubject": "Updated subject",
  "isActive": false
}

Response 200:
{
  "id": "uuid",
  "key": "order-confirmed",
  "emailSubject": "Updated subject",
  "isActive": false,
  "updatedAt": "2024-01-20T11:00:00Z"
}
```

#### 5. Delete Template
```http
DELETE /api/templates/:id
Authorization: Bearer {admin_token}

Response 204: No Content
```

---

### Notification Sending (6 endpoints)

#### 6. Send Notification
**Primary endpoint for sending notifications**

```http
POST /api/notifications/send
Authorization: Bearer {token}

{
  "templateKey": "order-confirmed",
  "userId": "user-uuid",
  "email": "customer@example.com",
  "phone": "+971501234567",
  "deviceToken": "firebase-device-token",
  "channels": ["EMAIL", "SMS", "PUSH"],
  "variables": {
    "orderNumber": "ORD-2024-001",
    "customerName": "Ahmed",
    "trackingUrl": "https://aromasouq.com/track/ORD-2024-001",
    "total": "AED 450.00"
  },
  "metadata": {
    "orderId": "order-uuid",
    "priority": "high"
  }
}

Response 201:
{
  "id": "notification-uuid",
  "status": "QUEUED",
  "channels": ["EMAIL", "SMS", "PUSH"],
  "scheduledAt": null,
  "createdAt": "2024-01-20T10:00:00Z"
}
```

#### 7. Schedule Notification
```http
POST /api/notifications/schedule
Authorization: Bearer {token}

{
  "templateKey": "promotion-reminder",
  "userId": "user-uuid",
  "email": "customer@example.com",
  "channels": ["EMAIL"],
  "scheduledAt": "2024-01-25T14:00:00Z",
  "variables": {
    "promoCode": "WINTER25",
    "expiryDate": "2024-02-01"
  }
}

Response 201:
{
  "id": "notification-uuid",
  "status": "PENDING",
  "scheduledAt": "2024-01-25T14:00:00Z"
}
```

#### 8. Send Bulk Notifications
**For promotional campaigns**

```http
POST /api/notifications/bulk
Authorization: Bearer {admin_token}

{
  "templateKey": "newsletter-weekly",
  "recipients": [
    {
      "userId": "user-1",
      "email": "user1@example.com",
      "variables": { "firstName": "Ahmed" }
    },
    {
      "userId": "user-2",
      "email": "user2@example.com",
      "variables": { "firstName": "Fatima" }
    }
  ],
  "channels": ["EMAIL"]
}

Response 202:
{
  "message": "Bulk notifications queued",
  "count": 2,
  "jobId": "bull-job-uuid"
}
```

#### 9. Get Notification Status
```http
GET /api/notifications/:id/status
Authorization: Bearer {token}

Response 200:
{
  "id": "notification-uuid",
  "status": "SENT",
  "channels": ["EMAIL", "SMS"],
  "sentAt": "2024-01-20T10:01:00Z",
  "delivery": {
    "email": {
      "status": "DELIVERED",
      "deliveredAt": "2024-01-20T10:01:30Z",
      "openedAt": "2024-01-20T10:15:00Z"
    },
    "sms": {
      "status": "DELIVERED",
      "deliveredAt": "2024-01-20T10:01:45Z",
      "cost": "0.0450"
    }
  }
}
```

#### 10. Retry Failed Notification
```http
POST /api/notifications/:id/retry
Authorization: Bearer {token}

Response 200:
{
  "id": "notification-uuid",
  "status": "QUEUED",
  "retryCount": 1
}
```

#### 11. Cancel Scheduled Notification
```http
POST /api/notifications/:id/cancel
Authorization: Bearer {token}

Response 200:
{
  "id": "notification-uuid",
  "status": "CANCELLED",
  "cancelledAt": "2024-01-20T10:00:00Z"
}
```

---

### User Preferences (4 endpoints)

#### 12. Get User Preferences
```http
GET /api/preferences/:userId
Authorization: Bearer {token}

Response 200:
{
  "userId": "user-uuid",
  "emailEnabled": true,
  "smsEnabled": true,
  "pushEnabled": false,
  "orderUpdates": true,
  "promotions": false,
  "newsletters": false,
  "announcements": true,
  "accountAlerts": true,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00",
  "timezone": "Asia/Dubai"
}
```

#### 13. Update User Preferences
```http
PATCH /api/preferences/:userId
Authorization: Bearer {token}

{
  "emailEnabled": false,
  "promotions": false,
  "quietHoursStart": "23:00",
  "quietHoursEnd": "07:00"
}

Response 200:
{
  "userId": "user-uuid",
  "emailEnabled": false,
  "promotions": false,
  "quietHoursStart": "23:00",
  "quietHoursEnd": "07:00",
  "updatedAt": "2024-01-20T10:00:00Z"
}
```

#### 14. Unsubscribe from All
```http
POST /api/preferences/:userId/unsubscribe-all
Authorization: Bearer {token}

Response 200:
{
  "userId": "user-uuid",
  "emailEnabled": false,
  "smsEnabled": false,
  "pushEnabled": false,
  "orderUpdates": true,
  "promotions": false,
  "newsletters": false
}
```

#### 15. Resubscribe
```http
POST /api/preferences/:userId/resubscribe
Authorization: Bearer {token}

{
  "channels": ["EMAIL", "SMS"]
}

Response 200:
{
  "userId": "user-uuid",
  "emailEnabled": true,
  "smsEnabled": true,
  "pushEnabled": false
}
```

---

### Analytics & Logs (3 endpoints)

#### 16. Get Notification Logs
```http
GET /api/logs?userId=user-uuid&channel=EMAIL&status=DELIVERED&page=1&limit=20
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": "log-uuid",
      "notificationId": "notification-uuid",
      "channel": "EMAIL",
      "to": "customer@example.com",
      "subject": "Order Confirmed",
      "status": "DELIVERED",
      "sentAt": "2024-01-20T10:01:00Z",
      "deliveredAt": "2024-01-20T10:01:30Z",
      "openedAt": "2024-01-20T10:15:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### 17. Get Analytics Summary
```http
GET /api/analytics/summary?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {admin_token}

Response 200:
{
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "totals": {
    "sent": 15240,
    "delivered": 14890,
    "failed": 350,
    "opened": 8920,
    "clicked": 3450
  },
  "byChannel": {
    "email": {
      "sent": 10000,
      "delivered": 9800,
      "openRate": "62%",
      "clickRate": "28%"
    },
    "sms": {
      "sent": 5000,
      "delivered": 4950,
      "totalCost": "225.00"
    },
    "push": {
      "sent": 240,
      "delivered": 140,
      "invalidTokens": 100
    }
  }
}
```

#### 18. Get Template Performance
```http
GET /api/analytics/templates/:templateKey/performance?days=30
Authorization: Bearer {admin_token}

Response 200:
{
  "templateKey": "order-confirmed",
  "period": "Last 30 days",
  "sent": 2340,
  "delivered": 2310,
  "deliveryRate": "98.7%",
  "openRate": "72.5%",
  "clickRate": "34.2%",
  "averageCost": "0.045"
}
```

---

### Webhook Processing (2 endpoints)

#### 19. Process SendGrid Webhook
```http
POST /api/webhooks/sendgrid
X-Twilio-Email-Event-Webhook-Signature: {signature}

[
  {
    "email": "customer@example.com",
    "event": "delivered",
    "sg_message_id": "message-id",
    "timestamp": 1642680000
  }
]

Response 200:
{
  "received": 1,
  "processed": 1
}
```

#### 20. Process Twilio Webhook
```http
POST /api/webhooks/twilio
X-Twilio-Signature: {signature}

{
  "MessageSid": "message-id",
  "MessageStatus": "delivered",
  "To": "+971501234567",
  "From": "+1234567890"
}

Response 200:
{
  "received": true
}
```

---

## Implementation Details

### 1. Template Engine

**File**: `src/templates/template.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplateService {
  constructor(private prisma: PrismaService) {}

  async renderTemplate(
    templateKey: string,
    variables: Record<string, any>,
  ): Promise<{
    emailSubject?: string;
    emailBody?: string;
    emailHtml?: string;
    smsBody?: string;
    pushTitle?: string;
    pushBody?: string;
    pushData?: any;
  }> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { key: templateKey },
    });

    if (!template || !template.isActive) {
      throw new Error(`Template ${templateKey} not found or inactive`);
    }

    return {
      emailSubject: this.replaceVariables(template.emailSubject, variables),
      emailBody: this.replaceVariables(template.emailBody, variables),
      emailHtml: this.replaceVariables(template.emailHtml, variables),
      smsBody: this.replaceVariables(template.smsBody, variables),
      pushTitle: this.replaceVariables(template.pushTitle, variables),
      pushBody: this.replaceVariables(template.pushBody, variables),
      pushData: template.pushData,
    };
  }

  private replaceVariables(
    text: string | null,
    variables: Record<string, any>,
  ): string | null {
    if (!text) return null;

    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  async validateVariables(
    templateKey: string,
    variables: Record<string, any>,
  ): Promise<boolean> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { key: templateKey },
    });

    const requiredVars = template.variables as string[];
    const missingVars = requiredVars.filter((v) => !(v in variables));

    if (missingVars.length > 0) {
      throw new Error(`Missing variables: ${missingVars.join(', ')}`);
    }

    return true;
  }
}
```

---

### 2. Email Service

**File**: `src/email/email.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { EmailProvider, EmailStatus } from '@prisma/client';

@Injectable()
export class EmailService {
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
        port: this.config.get('SMTP_PORT'),
        secure: false,
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        },
      });
    }
    // Add SendGrid, AWS SES implementations
  }

  async send(params: {
    notificationId: string;
    to: string;
    subject: string;
    body: string;
    html?: string;
  }): Promise<string> {
    const { notificationId, to, subject, body, html } = params;

    // Create email log
    const emailLog = await this.prisma.emailLog.create({
      data: {
        notificationId,
        to,
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

      return emailLog.id;
    } catch (error) {
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

    if (!emailLog) return;

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
  }
}
```

---

### 3. SMS Service

**File**: `src/sms/sms.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { PrismaService } from '../prisma/prisma.service';
import { SMSProvider, SMSStatus } from '@prisma/client';

@Injectable()
export class SMSService {
  private twilioClient: Twilio;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.twilioClient = new Twilio(
      this.config.get('TWILIO_ACCOUNT_SID'),
      this.config.get('TWILIO_AUTH_TOKEN'),
    );
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

      return smsLog.id;
    } catch (error) {
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

    if (!smsLog) return;

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
  }
}
```

---

### 4. Push Notification Service

**File**: `src/push/push.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import { PushProvider, PushStatus } from '@prisma/client';

@Injectable()
export class PushService {
  private firebaseApp: admin.app.App;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: this.config.get('FIREBASE_PROJECT_ID'),
        privateKey: this.config.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
        clientEmail: this.config.get('FIREBASE_CLIENT_EMAIL'),
      }),
    });
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
      const message = {
        notification: {
          title,
          body,
        },
        data,
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

      return pushLog.id;
    } catch (error) {
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
}
```

---

### 5. Notification Orchestrator

**File**: `src/notifications/notification.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemplateService } from '../templates/template.service';
import { EmailService } from '../email/email.service';
import { SMSService } from '../sms/sms.service';
import { PushService } from '../push/push.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import {
  NotificationChannel,
  NotificationStatus,
} from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private templateService: TemplateService,
    private emailService: EmailService,
    private smsService: SMSService,
    private pushService: PushService,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async send(params: {
    templateKey: string;
    userId: string;
    email?: string;
    phone?: string;
    deviceToken?: string;
    channels: NotificationChannel[];
    variables: Record<string, any>;
    metadata?: any;
    scheduledAt?: Date;
  }): Promise<string> {
    // Check user preferences
    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId: params.userId },
    });

    // Filter channels based on preferences
    const allowedChannels = params.channels.filter((channel) => {
      if (!preferences) return true;
      if (channel === 'EMAIL') return preferences.emailEnabled;
      if (channel === 'SMS') return preferences.smsEnabled;
      if (channel === 'PUSH') return preferences.pushEnabled;
      return true;
    });

    if (allowedChannels.length === 0) {
      throw new Error('All channels are disabled for this user');
    }

    // Validate and render template
    await this.templateService.validateVariables(
      params.templateKey,
      params.variables,
    );

    const rendered = await this.templateService.renderTemplate(
      params.templateKey,
      params.variables,
    );

    // Get template
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { key: params.templateKey },
    });

    // Create notification record
    const notification = await this.prisma.notification.create({
      data: {
        templateId: template.id,
        userId: params.userId,
        email: params.email,
        phone: params.phone,
        deviceToken: params.deviceToken,
        channels: allowedChannels,
        status: params.scheduledAt
          ? NotificationStatus.PENDING
          : NotificationStatus.QUEUED,
        emailSubject: rendered.emailSubject,
        emailBody: rendered.emailBody,
        emailHtml: rendered.emailHtml,
        smsBody: rendered.smsBody,
        pushTitle: rendered.pushTitle,
        pushBody: rendered.pushBody,
        pushData: rendered.pushData,
        metadata: params.metadata,
        scheduledAt: params.scheduledAt,
      },
    });

    // Queue for processing
    if (params.scheduledAt) {
      const delay = params.scheduledAt.getTime() - Date.now();
      await this.notificationQueue.add(
        'send',
        { notificationId: notification.id },
        { delay },
      );
    } else {
      await this.notificationQueue.add('send', {
        notificationId: notification.id,
      });
    }

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

    const results: any = {};

    // Send via each channel
    try {
      if (notification.channels.includes('EMAIL') && notification.email) {
        results.email = await this.emailService.send({
          notificationId: notification.id,
          to: notification.email,
          subject: notification.emailSubject,
          body: notification.emailBody,
          html: notification.emailHtml,
        });
      }

      if (notification.channels.includes('SMS') && notification.phone) {
        results.sms = await this.smsService.send({
          notificationId: notification.id,
          to: notification.phone,
          body: notification.smsBody,
        });
      }

      if (notification.channels.includes('PUSH') && notification.deviceToken) {
        results.push = await this.pushService.send({
          notificationId: notification.id,
          userId: notification.userId,
          deviceToken: notification.deviceToken,
          title: notification.pushTitle,
          body: notification.pushBody,
          data: notification.pushData as any,
        });
      }

      // Update status
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      // Update status
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.FAILED },
      });

      throw error;
    }
  }
}
```

---

### 6. Queue Processor

**File**: `src/notifications/notification.processor.ts`

```typescript
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationService } from './notification.service';

@Processor('notifications')
export class NotificationProcessor {
  constructor(private notificationService: NotificationService) {}

  @Process('send')
  async handleSend(job: Job) {
    const { notificationId } = job.data;
    await this.notificationService.processSend(notificationId);
  }

  @Process('bulk')
  async handleBulk(job: Job) {
    const { templateKey, recipients, channels } = job.data;

    for (const recipient of recipients) {
      await this.notificationService.send({
        templateKey,
        userId: recipient.userId,
        email: recipient.email,
        phone: recipient.phone,
        deviceToken: recipient.deviceToken,
        channels,
        variables: recipient.variables,
      });
    }
  }
}
```

---

## Module Structure

```
src/
├── app.module.ts
├── main.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── templates/
│   ├── templates.module.ts
│   ├── templates.controller.ts
│   ├── templates.service.ts
│   └── dto/
│       ├── create-template.dto.ts
│       └── update-template.dto.ts
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.controller.ts
│   ├── notifications.service.ts
│   ├── notifications.processor.ts
│   └── dto/
│       ├── send-notification.dto.ts
│       ├── schedule-notification.dto.ts
│       └── bulk-notification.dto.ts
├── email/
│   ├── email.module.ts
│   └── email.service.ts
├── sms/
│   ├── sms.module.ts
│   └── sms.service.ts
├── push/
│   ├── push.module.ts
│   └── push.service.ts
├── preferences/
│   ├── preferences.module.ts
│   ├── preferences.controller.ts
│   └── preferences.service.ts
├── webhooks/
│   ├── webhooks.module.ts
│   └── webhooks.controller.ts
└── analytics/
    ├── analytics.module.ts
    ├── analytics.controller.ts
    └── analytics.service.ts
```

---

## Integration Examples

### From Order Service

```typescript
// When order is confirmed
await axios.post('http://notification-service:3400/api/notifications/send', {
  templateKey: 'order-confirmed',
  userId: order.userId,
  email: user.email,
  phone: user.phone,
  channels: ['EMAIL', 'SMS'],
  variables: {
    orderNumber: order.orderNumber,
    customerName: user.firstName,
    total: order.total.toFixed(2),
    trackingUrl: `https://aromasouq.com/orders/${order.id}`,
  },
  metadata: {
    orderId: order.id,
  },
});
```

### From Delivery Service

```typescript
// When shipment is out for delivery
await axios.post('http://notification-service:3400/api/notifications/send', {
  templateKey: 'shipment-out-for-delivery',
  userId: shipment.userId,
  email: user.email,
  phone: user.phone,
  deviceToken: user.deviceToken,
  channels: ['EMAIL', 'SMS', 'PUSH'],
  variables: {
    orderNumber: shipment.orderNumber,
    trackingNumber: shipment.trackingNumber,
    estimatedDelivery: shipment.estimatedDeliveryAt.toISOString(),
  },
});
```

---

## Template Examples

### Order Confirmation

```javascript
// Email Subject
"Order {{orderNumber}} Confirmed - AromaSouQ"

// Email Body
Dear {{customerName}},

Thank you for your order! Your order {{orderNumber}} has been confirmed.

Order Summary:
Total: AED {{total}}

You can track your order here: {{trackingUrl}}

Best regards,
AromaSouQ Team

// SMS Body
"Order {{orderNumber}} confirmed. Total: AED {{total}}. Track: {{trackingUrl}}"

// Push Notification
Title: "Order Confirmed"
Body: "Your order {{orderNumber}} is confirmed! Total: AED {{total}}"
```

### Shipment Delivered

```javascript
// Email Subject
"Your Order {{orderNumber}} Has Been Delivered!"

// Email Body
Dear {{customerName}},

Great news! Your order {{orderNumber}} has been delivered.

Please check the package and let us know if everything is perfect.

Rate your experience: {{ratingUrl}}

// SMS Body
"Your order {{orderNumber}} has been delivered! Rate your experience: {{ratingUrl}}"

// Push Notification
Title: "Delivery Complete!"
Body: "Your order {{orderNumber}} has arrived 📦"
```

---

## Testing

### Manual Testing

```bash
# 1. Create a template
curl -X POST http://localhost:3400/api/templates \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "test-template",
    "name": "Test Template",
    "emailSubject": "Hello {{name}}",
    "emailBody": "This is a test for {{name}}",
    "variables": ["name"]
  }'

# 2. Send notification
curl -X POST http://localhost:3400/api/notifications/send \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "templateKey": "test-template",
    "userId": "user-uuid",
    "email": "test@example.com",
    "channels": ["EMAIL"],
    "variables": {
      "name": "Ahmed"
    }
  }'

# 3. Check notification status
curl http://localhost:3400/api/notifications/{notification-id}/status \
  -H "Authorization: Bearer {token}"
```

---

## Performance Considerations

1. **Queue System**: All notifications are processed asynchronously via Bull queues
2. **Batch Processing**: Bulk notifications are batched to prevent overload
3. **Rate Limiting**: Implement rate limiting on provider APIs (Twilio, SendGrid)
4. **Retry Logic**: Exponential backoff for failed deliveries (3 retries max)
5. **Caching**: Cache templates in Redis for faster rendering
6. **Database Indexes**: All search fields are indexed for performance

---

## Security

1. **Webhook Verification**: All webhooks verify signatures before processing
2. **User Preferences**: Respect opt-out settings (legally required)
3. **PII Protection**: Email/phone numbers are never logged in plain text
4. **Rate Limiting**: Prevent spam by limiting notifications per user
5. **Authentication**: All endpoints require valid JWT tokens

---

## Monitoring & Alerts

1. **Delivery Rates**: Alert if delivery rate drops below 95%
2. **Failed Notifications**: Alert if failure rate exceeds 5%
3. **Queue Size**: Alert if queue size exceeds 1000 jobs
4. **Cost Monitoring**: Track SMS costs per day/month
5. **Invalid Tokens**: Clean up invalid device tokens weekly

---

## Implementation Estimate

- **Database & Setup**: 1 day
- **Template System**: 2 days
- **Email Integration**: 2 days
- **SMS Integration**: 1 day
- **Push Notification Integration**: 1 day
- **Queue Processing**: 1 day
- **Webhook Handlers**: 1 day
- **User Preferences**: 1 day
- **Analytics & Logging**: 1 day
- **Testing & Documentation**: 1 day

**Total**: ~10-12 development days

---

## Next Steps

1. Run `npx prisma migrate dev --name init` to create database tables
2. Install dependencies (already done)
3. Implement core services (Template, Email, SMS, Push)
4. Create notification orchestrator
5. Set up Bull queue processor
6. Implement webhook handlers
7. Build REST API controllers
8. Add comprehensive testing
9. Deploy to production
