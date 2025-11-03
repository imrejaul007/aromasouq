import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VendorVerificationStatus, VendorBusinessType } from '@prisma/client';

export class VendorQueryDto {
  @IsOptional()
  @IsEnum(VendorVerificationStatus)
  verificationStatus?: VendorVerificationStatus;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsEnum(VendorBusinessType)
  businessType?: VendorBusinessType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class UpdateCommissionDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate: number;
}

export class RejectVendorDto {
  @IsNotEmpty()
  @IsString()
  adminId: string;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class RequestResubmissionDto {
  @IsNotEmpty()
  @IsString()
  adminId: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}

export class SuspendVendorDto {
  @IsNotEmpty()
  @IsString()
  adminId: string;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class UnsuspendVendorDto {
  @IsNotEmpty()
  @IsString()
  adminId: string;
}

export class VerifyVendorDto {
  @IsNotEmpty()
  @IsString()
  adminId: string;
}

function IsNotEmpty(): (target: Object, propertyKey: string | symbol) => void {
  return IsString();
}
