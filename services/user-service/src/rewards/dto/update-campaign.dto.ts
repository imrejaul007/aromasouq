import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  IsDate,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

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
  userSegment?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptions?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptionsPerUser?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
