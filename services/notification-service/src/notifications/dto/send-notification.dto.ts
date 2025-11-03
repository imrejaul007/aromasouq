import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
  IsDateString,
} from 'class-validator';
import { NotificationChannel } from '@prisma/client';

export class SendNotificationDto {
  @IsString()
  templateKey: string;

  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  deviceToken?: string;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @IsObject()
  variables: Record<string, any>;

  @IsObject()
  @IsOptional()
  metadata?: any;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}
