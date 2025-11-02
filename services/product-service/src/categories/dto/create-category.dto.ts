import { IsString, IsNotEmpty, IsOptional, IsUrl, IsNumber, Min } from 'class-validator';

export class CreateCategoryDto {
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
  icon?: string;

  @IsUrl()
  @IsOptional()
  image?: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  order?: number;

  @IsOptional()
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };
}
