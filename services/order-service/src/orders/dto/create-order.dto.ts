import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsNumber,
  ValidateNested,
  IsEmail,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class CreateOrderDto {
  @IsString()
  userId: string;

  @IsEmail()
  userEmail: string;

  @IsString()
  @IsOptional()
  userPhone?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsObject()
  shippingAddress: any; // Json field - address object

  @IsObject()
  @IsOptional()
  billingAddress?: any; // Json field - address object

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  couponCode?: string;

  @IsNumber()
  @IsOptional()
  walletAmount?: number;

  @IsString()
  @IsOptional()
  customerNotes?: string;
}

export class OrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  productSku: string;

  @IsString()
  vendorId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;

  @IsString()
  @IsOptional()
  variantId?: string;
}
