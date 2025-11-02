import { IsString, IsNotEmpty, IsOptional, IsUrl, IsBoolean } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  logo?: string;

  @IsUrl()
  @IsOptional()
  coverImage?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  origin?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsOptional()
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };
}
