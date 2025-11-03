import { IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { CoinType, CoinTransactionType, CashbackType, CashbackStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryCoinTransactionsDto {
  @IsOptional()
  @IsEnum(CoinType)
  coinType?: CoinType;

  @IsOptional()
  @IsEnum(CoinTransactionType)
  type?: CoinTransactionType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class QueryCashbackTransactionsDto {
  @IsOptional()
  @IsEnum(CashbackType)
  type?: CashbackType;

  @IsOptional()
  @IsEnum(CashbackStatus)
  status?: CashbackStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
