import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import {
  UpdateVendorProductDto,
  UpdateStockDto,
  VendorProductQueryDto,
} from './dto/vendor-product.dto';

// Note: Import these guards from your auth setup
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('vendor/products')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('VENDOR')
export class VendorProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ==================== VENDOR PRODUCT MANAGEMENT ====================

  @Get()
  async getVendorProducts(@Request() req: any, @Query() query: VendorProductQueryDto) {
    // Extract vendorId from JWT token: req.user.vendorId
    const vendorId = req.user?.vendorId || 'mock-vendor-id'; // TODO: Get actual vendorId from JWT

    return this.productsService.getVendorProducts(vendorId, {
      search: query.search,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('stats')
  async getVendorStats(@Request() req: any) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';
    return this.productsService.getVendorProductStats(vendorId);
  }

  @Get(':id')
  async getVendorProduct(@Request() req: any, @Param('id') productId: string) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';
    return this.productsService.getVendorProduct(vendorId, productId);
  }

  @Post()
  async createProduct(@Request() req: any, @Body() createProductDto: CreateProductDto) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';
    return this.productsService.createAsVendor(vendorId, createProductDto);
  }

  @Patch(':id')
  async updateProduct(
    @Request() req: any,
    @Param('id') productId: string,
    @Body() updateDto: UpdateVendorProductDto,
  ) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';
    return this.productsService.updateAsVendor(vendorId, productId, updateDto);
  }

  @Patch(':id/stock')
  async updateStock(
    @Request() req: any,
    @Param('id') productId: string,
    @Body() stockDto: UpdateStockDto,
  ) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';
    return this.productsService.updateVendorStock(vendorId, productId, stockDto.stock);
  }

  @Delete(':id')
  async deleteProduct(@Request() req: any, @Param('id') productId: string) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';
    return this.productsService.deleteAsVendor(vendorId, productId);
  }
}
