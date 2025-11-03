import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';
import { TemplatesModule } from '../templates/templates.module';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
    TemplatesModule,
    EmailModule,
    SmsModule,
    PushModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
