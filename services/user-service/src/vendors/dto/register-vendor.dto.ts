import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsEnum,
  IsArray,
  IsOptional,
  IsDateString,
  IsObject,
  IsUrl,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { VendorBusinessType } from '@prisma/client';

export class RegisterVendorDto {
  // Business Information
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  businessName: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessNameArabic?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  brandName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Brand slug must contain only lowercase letters, numbers, and hyphens',
  })
  brandSlug: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(50)
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descriptionArabic?: string;

  // Legal Information
  @IsNotEmpty()
  @IsString()
  tradeLicenseNumber: string;

  @IsNotEmpty()
  @IsDateString()
  tradeLicenseExpiry: string;

  @IsOptional()
  @IsString()
  taxRegistrationNumber?: string;

  // Business Details
  @IsNotEmpty()
  @IsEnum(VendorBusinessType)
  businessType: VendorBusinessType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  // Contact Information
  @IsNotEmpty()
  @IsEmail()
  businessEmail: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format',
  })
  businessPhone: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  whatsappNumber?: string;

  // Addresses
  @IsNotEmpty()
  @IsObject()
  businessAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
  };

  @IsOptional()
  @IsObject()
  warehouseAddress?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  };

  // Bank Details
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  bankAccountName?: string;

  @IsOptional()
  @IsString()
  iban?: string;

  @IsOptional()
  @IsString()
  swiftCode?: string;

  // Media
  @IsOptional()
  @IsUrl()
  logo?: string;

  @IsOptional()
  @IsUrl()
  banner?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  galleries?: string[];
}
