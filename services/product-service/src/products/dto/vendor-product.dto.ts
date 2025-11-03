import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

// Simplified DTO for vendors to update their product stock and pricing
export class UpdateVendorProductDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;
}

// DTO for vendor to set stock levels
export class UpdateStockDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  stock: number;
}

// Query DTO for vendor to list their products
export class VendorProductQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive' | 'outOfStock';

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
