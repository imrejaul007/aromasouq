import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { CoinType } from '@prisma/client';

export class CheckRedemptionDto {
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

  @IsOptional()
  @IsString()
  brandId?: string;
}
