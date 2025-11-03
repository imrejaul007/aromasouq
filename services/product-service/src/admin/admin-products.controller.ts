import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { AdminProductsService } from './admin-products.service';

@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  // ==================== PRODUCT MODERATION ====================

  @Get('pending')
  async getPendingProducts(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminProductsService.getPendingProducts({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('stats')
  async getProductStats() {
    return this.adminProductsService.getProductStats();
  }

  @Get('top')
  async getTopProducts(
    @Query('sortBy') sortBy: 'views' | 'sales' | 'rating',
    @Query('limit') limit?: string,
  ) {
    return this.adminProductsService.getTopProducts({
      sortBy,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get('vendor/:vendorId')
  async getProductsByVendor(
    @Param('vendorId') vendorId: string,
    @Query('status') status?: 'active' | 'inactive' | 'pending',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminProductsService.getProductsByVendor(vendorId, {
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Patch(':id/approve')
  async approveProduct(@Param('id') productId: string, @Body() dto: { adminId: string }) {
    return this.adminProductsService.approveProduct(productId, dto.adminId);
  }

  @Patch(':id/reject')
  async rejectProduct(
    @Param('id') productId: string,
    @Body() dto: { reason: string; adminId: string },
  ) {
    return this.adminProductsService.rejectProduct(productId, dto.reason, dto.adminId);
  }

  @Patch(':id/deactivate')
  async deactivateProduct(
    @Param('id') productId: string,
    @Body() dto: { reason: string; adminId: string },
  ) {
    return this.adminProductsService.deactivateProduct(productId, dto.reason, dto.adminId);
  }

  @Patch(':id/reactivate')
  async reactivateProduct(@Param('id') productId: string, @Body() dto: { adminId: string }) {
    return this.adminProductsService.reactivateProduct(productId, dto.adminId);
  }

  @Patch(':id/flags')
  async updateProductFlags(
    @Param('id') productId: string,
    @Body() dto: { flags: any; adminId: string },
  ) {
    return this.adminProductsService.updateProductFlags(productId, dto.flags, dto.adminId);
  }

  @Post('bulk/approve')
  async bulkApprove(@Body() dto: { productIds: string[]; adminId: string }) {
    return this.adminProductsService.bulkApprove(dto.productIds, dto.adminId);
  }

  @Post('bulk/deactivate')
  async bulkDeactivate(@Body() dto: { productIds: string[]; reason: string; adminId: string }) {
    return this.adminProductsService.bulkDeactivate(dto.productIds, dto.reason, dto.adminId);
  }
}
