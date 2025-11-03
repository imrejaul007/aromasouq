import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class EarnCashbackDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number; // In Fils

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  orderNumber?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  cashbackRate?: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  pendingDays?: number;
}
