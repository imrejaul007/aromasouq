import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationStatus } from '@prisma/client';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  async send(@Body() sendNotificationDto: SendNotificationDto) {
    const notificationId =
      await this.notificationsService.send(sendNotificationDto);
    return {
      id: notificationId,
      message: 'Notification queued successfully',
    };
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    return this.notificationsService.getStatus(id);
  }

  @Post(':id/retry')
  async retry(@Param('id') id: string) {
    return this.notificationsService.retry(id);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.notificationsService.cancel(id);
  }

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('status') status?: NotificationStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findAll({
      userId,
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }
}
