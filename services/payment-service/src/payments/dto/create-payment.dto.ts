import { IsString, IsNumber, IsEnum, IsOptional, IsObject, IsEmail } from 'class-validator';
import { PaymentProvider, PaymentMethod, RefundReason } from '@prisma/client';

export class CreatePaymentIntentDto {
  @IsString()
  orderId: string;

  @IsString()
  orderNumber: string;

  @IsString()
  userId: string;

  @IsEmail()
  userEmail: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  tax: number;

  @IsNumber()
  shippingFee: number;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsNumber()
  @IsOptional()
  walletUsed?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

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

  @IsEnum(RefundReason)
  @IsOptional()
  reason?: RefundReason;

  @IsString()
  @IsOptional()
  reasonDescription?: string;
}
