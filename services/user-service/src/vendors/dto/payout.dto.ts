import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PayoutStatus } from '@prisma/client';

export class RequestPayoutDto {
  @IsNotEmpty()
  @IsDateString()
  periodStart: string;

  @IsNotEmpty()
  @IsDateString()
  periodEnd: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  orderIds: string[];

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalSales: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  platformCommission: number;

  @IsOptional()
  @IsNumber()
  adjustments?: number;
}

export class PayoutQueryDto {
  @IsOptional()
  @IsString()
  status?: PayoutStatus;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

export class ProcessPayoutDto {
  @IsNotEmpty()
  @IsString()
  adminId: string;
}

export class CompletePayoutDto {
  @IsNotEmpty()
  @IsString()
  adminId: string;

  @IsNotEmpty()
  @IsString()
  transactionReference: string;

  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FailPayoutDto {
  @IsNotEmpty()
  @IsString()
  adminId: string;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class CancelPayoutDto {
  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsNotEmpty()
  @IsString()
  cancelledBy: string;
}
