import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { VendorDocumentType } from '@prisma/client';

export class UploadDocumentDto {
  @IsNotEmpty()
  @IsEnum(VendorDocumentType)
  type: VendorDocumentType;

  @IsNotEmpty()
  @IsUrl()
  documentUrl: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class ApproveDocumentDto {
  @IsNotEmpty()
  @IsString()
  adminId: string;
}

export class RejectDocumentDto {
  @IsNotEmpty()
  @IsString()
  adminId: string;

  @IsNotEmpty()
  @IsString()
  reason: string;
}
