import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { CoinType, CoinRedemptionType } from '@prisma/client';

export class RedeemCoinsDto {
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
  @IsEnum(CoinRedemptionType)
  redemptionType: CoinRedemptionType;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  metadata?: any;
}
