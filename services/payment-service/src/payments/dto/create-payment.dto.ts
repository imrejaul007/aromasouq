import { IsString, IsNumber, IsEnum, IsOptional, IsObject } from 'class-validator';
import { PaymentProvider } from '@prisma/client';

export class CreatePaymentIntentDto {
  @IsString()
  orderId: string;

  @IsString()
  userId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsObject()
  @IsOptional()
  metadata?: any;
}

export class ConfirmPaymentDto {
  @IsString()
  intentId: string;

  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}

export class CreateRefundDto {
  @IsString()
  transactionId: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
