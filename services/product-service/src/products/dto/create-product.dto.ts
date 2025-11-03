import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
  IsUrl,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BrandDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;
}

export class TaxonomyDto {
  @IsArray()
  @ArrayMinSize(1)
  type: string[];

  @IsArray()
  @ArrayMinSize(1)
  scentFamily: string[];

  @IsArray()
  @ArrayMinSize(1)
  gender: string[];

  @IsArray()
  @IsOptional()
  region?: string[];

  @IsString()
  @IsNotEmpty()
  priceSegment: string;

  @IsArray()
  @IsOptional()
  occasion?: string[];

  @IsArray()
  @IsOptional()
  mood?: string[];

  @IsString()
  @IsOptional()
  oudType?: string;

  @IsString()
  @IsNotEmpty()
  concentration: string;

  @IsString()
  @IsOptional()
  collection?: string;

  @IsString()
  @IsNotEmpty()
  fulfillmentType: string;
}

export class AttributesDto {
  @IsString()
  @IsNotEmpty()
  volume: string;

  @IsNumber()
  @Min(1)
  @Max(72)
  longevityHours: number;

  @IsString()
  @IsNotEmpty()
  projection: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  projectionRating: number;

  @IsArray()
  @IsOptional()
  seasons?: string[];

  @IsArray()
  @IsOptional()
  timesOfDay?: string[];
}

export class ScentDto {
  @IsArray()
  @ArrayMinSize(1)
  topNotes: string[];

  @IsArray()
  @ArrayMinSize(1)
  middleNotes: string[];

  @IsArray()
  @ArrayMinSize(1)
  baseNotes: string[];

  @IsArray()
  @IsOptional()
  dnaSimilarTo?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  similarityScore?: number;
}

export class OudDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  grade: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  purityPercentage: number;

  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  agingYears?: number;
}

export class PriceDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;
}

export class WholesalePriceDto extends PriceDto {
  @IsNumber()
  @Min(1)
  minQuantity: number;
}

export class PricingDto {
  @ValidateNested()
  @Type(() => PriceDto)
  retail: PriceDto;

  @ValidateNested()
  @Type(() => WholesalePriceDto)
  @IsOptional()
  wholesale?: WholesalePriceDto;

  @ValidateNested()
  @Type(() => WholesalePriceDto)
  @IsOptional()
  manufacture?: WholesalePriceDto;

  @IsOptional()
  salePrice?: {
    amount: number;
    currency: string;
    validUntil?: Date;
  };

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  cashbackRate?: number;
}

export class ProductVendorDto {
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @IsString()
  @IsNotEmpty()
  vendorName: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsString()
  @IsNotEmpty()
  fulfillmentType: string;

  @IsNumber()
  @Min(1)
  deliveryDays: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class MediaDto {
  @IsUrl()
  url: string;

  @IsString()
  @IsOptional()
  size?: string;

  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  height?: number;
}

export class VideoContentDto {
  @IsUrl()
  url: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  type?: string;
}

export class UGCVideoDto extends VideoContentDto {
  @IsString()
  @IsNotEmpty()
  creatorId: string;

  @IsString()
  @IsNotEmpty()
  creatorName: string;

  @IsString()
  @IsOptional()
  creatorHandle?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  views?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  likes?: number;

  @IsBoolean()
  @IsOptional()
  verified?: boolean;
}

export class ProductMediaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  @ArrayMinSize(1)
  images: MediaDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoContentDto)
  @IsOptional()
  videos?: VideoContentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UGCVideoDto)
  @IsOptional()
  ugcVideos?: UGCVideoDto[];

  @IsString()
  @IsOptional()
  arModel?: string;
}

export class SEODataDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsOptional()
  keywords?: string[];
}

export class SEODto {
  @ValidateNested()
  @Type(() => SEODataDto)
  en: SEODataDto;

  @ValidateNested()
  @Type(() => SEODataDto)
  ar: SEODataDto;
}

export class GeoDto {
  @IsArray()
  @ArrayMinSize(1)
  availableCountries: string[];

  @IsArray()
  @IsOptional()
  featuredCities?: string[];

  @IsArray()
  @IsOptional()
  sameDayDeliveryCities?: string[];
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ValidateNested()
  @Type(() => BrandDto)
  brand: BrandDto;

  @ValidateNested()
  @Type(() => TaxonomyDto)
  taxonomy: TaxonomyDto;

  @ValidateNested()
  @Type(() => AttributesDto)
  attributes: AttributesDto;

  @ValidateNested()
  @Type(() => ScentDto)
  scent: ScentDto;

  @ValidateNested()
  @Type(() => OudDto)
  @IsOptional()
  oud?: OudDto;

  @ValidateNested()
  @Type(() => PricingDto)
  pricing: PricingDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVendorDto)
  @IsOptional()
  vendors?: ProductVendorDto[];

  @ValidateNested()
  @Type(() => ProductMediaDto)
  media: ProductMediaDto;

  @ValidateNested()
  @Type(() => SEODto)
  seo: SEODto;

  @ValidateNested()
  @Type(() => GeoDto)
  geo: GeoDto;
}
