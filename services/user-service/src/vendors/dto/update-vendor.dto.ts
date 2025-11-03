import {
  IsString,
  IsEmail,
  IsArray,
  IsOptional,
  IsObject,
  IsUrl,
  IsBoolean,
  IsNumber,
  MinLength,
  MaxLength,
  Matches,
  Min,
  Max,
} from 'class-validator';

export class UpdateVendorDto {
  // Business Information
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessNameArabic?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  brandName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Brand slug must contain only lowercase letters, numbers, and hyphens',
  })
  brandSlug?: string;

  @IsOptional()
  @IsString()
  @MinLength(50)
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descriptionArabic?: string;

  // Contact Information
  @IsOptional()
  @IsEmail()
  businessEmail?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format',
  })
  businessPhone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  whatsappNumber?: string;

  // Addresses
  @IsOptional()
  @IsObject()
  businessAddress?: {
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

  // Categories
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  // Shipping Settings
  @IsOptional()
  @IsBoolean()
  shippingEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freeShippingThreshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  averageProcessingDays?: number;

  // Policies
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  returnPolicy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  shippingPolicy?: string;

  // Metadata
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
