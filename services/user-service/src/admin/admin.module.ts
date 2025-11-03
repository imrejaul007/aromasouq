import { Module } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminUsersController, AdminAnalyticsController],
  providers: [AdminUsersService, AdminAnalyticsService],
  exports: [AdminUsersService, AdminAnalyticsService],
})
export class AdminModule {}
