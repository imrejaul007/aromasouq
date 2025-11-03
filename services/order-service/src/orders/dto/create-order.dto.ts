import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsNumber,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class CreateOrderDto {
  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  cartId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  shippingAddressId: string;

  @IsString()
  @IsOptional()
  billingAddressId?: string;

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
  notes?: string;

  @IsBoolean()
  @IsOptional()
  saveAddress?: boolean;
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
