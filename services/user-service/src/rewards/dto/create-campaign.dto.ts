import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  IsDate,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { CampaignType, CoinType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateCampaignDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsEnum(CampaignType)
  type: CampaignType;

  @IsNotEmpty()
  @IsEnum(CoinType)
  coinType: CoinType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  coinAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  cashbackRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchaseAmount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  brandIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];

  @IsOptional()
  @IsString()
  userSegment?: string; // 'new', 'vip', 'inactive', etc.

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptions?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptionsPerUser?: number;
}
