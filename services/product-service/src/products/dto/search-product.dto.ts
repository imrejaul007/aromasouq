import { IsOptional, IsString, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchProductDto {
  @IsOptional()
  @IsString()
  q?: string; // Search query

  @IsOptional()
  @IsArray()
  type?: string[]; // Filter by product type

  @IsOptional()
  @IsArray()
  scentFamily?: string[]; // Filter by scent family

  @IsOptional()
  @IsArray()
  gender?: string[]; // Filter by gender

  @IsOptional()
  @IsString()
  brand?: string; // Filter by brand slug

  @IsOptional()
  @IsString()
  priceSegment?: string; // Filter by price segment

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsArray()
  occasion?: string[];

  @IsOptional()
  @IsArray()
  mood?: string[];

  @IsOptional()
  @IsString()
  oudType?: string;

  @IsOptional()
  @IsString()
  concentration?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  fulfillmentType?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(10)
  minProjectionRating?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(10)
  maxProjectionRating?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  minCashbackRate?: number;

  @IsOptional()
  @IsString()
  sortBy?: string; // price_asc, price_desc, rating, sales, newest, cashback, relevance

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}
