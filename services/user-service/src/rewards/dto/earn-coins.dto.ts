import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { CoinType, CoinEarnReason } from '@prisma/client';
import { Type } from 'class-transformer';

export class EarnCoinsDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsEnum(CoinType)
  coinType: CoinType;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @IsNotEmpty()
  @IsEnum(CoinEarnReason)
  reason: CoinEarnReason;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  brandSlug?: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  reviewId?: string;

  @IsOptional()
  @IsString()
  referralId?: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  expiresInDays?: number;

  @IsOptional()
  metadata?: any;
}
