import {
  Controller,
  Get,
  Param,
  Query,
  Patch,
  Body,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SubOrdersService } from './sub-orders.service';
import { OrderStatus } from '@prisma/client';

// Note: Import these guards from your auth setup
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('vendor/orders')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('VENDOR')
export class VendorOrdersController {
  constructor(private readonly subOrdersService: SubOrdersService) {}

  // ==================== VENDOR ORDER MANAGEMENT ====================

  @Get()
  async getVendorOrders(
    @Request() req: any,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Extract vendorId from JWT token: req.user.vendorId
    const vendorId = req.user?.vendorId || 'mock-vendor-id'; // TODO: Get actual vendorId from JWT

    return this.subOrdersService.findAllByVendor(vendorId, {
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('stats')
  async getOrderStats(@Request() req: any) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';
    return this.subOrdersService.getVendorStats(vendorId);
  }

  @Get(':id')
  async getOrderDetails(@Request() req: any, @Param('id') orderId: string) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';

    // Get order and verify ownership
    const order = await this.subOrdersService.findOne(orderId);

    if (order.vendorId !== vendorId) {
      throw new Error('You do not have access to this order');
    }

    return order;
  }

  @Patch(':id/status')
  async updateOrderStatus(
    @Request() req: any,
    @Param('id') orderId: string,
    @Body('status') status: OrderStatus,
    @Body('notes') notes?: string,
  ) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';

    // Verify ownership before updating
    const order = await this.subOrdersService.findOne(orderId);
    if (order.vendorId !== vendorId) {
      throw new Error('You do not have access to this order');
    }

    return this.subOrdersService.updateStatus(orderId, status, notes);
  }

  @Post(':id/ready-to-ship')
  async markReadyToShip(@Request() req: any, @Param('id') orderId: string) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';

    // Verify ownership
    const order = await this.subOrdersService.findOne(orderId);
    if (order.vendorId !== vendorId) {
      throw new Error('You do not have access to this order');
    }

    return this.subOrdersService.markAsReadyToShip(orderId);
  }

  @Post(':id/ship')
  async markAsShipped(
    @Request() req: any,
    @Param('id') orderId: string,
    @Body('trackingNumber') trackingNumber?: string,
    @Body('courierName') courierName?: string,
  ) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';

    // Verify ownership
    const order = await this.subOrdersService.findOne(orderId);
    if (order.vendorId !== vendorId) {
      throw new Error('You do not have access to this order');
    }

    return this.subOrdersService.markAsShipped(orderId, trackingNumber);
  }

  @Post(':id/processing')
  async markAsProcessing(@Request() req: any, @Param('id') orderId: string) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';

    // Verify ownership
    const order = await this.subOrdersService.findOne(orderId);
    if (order.vendorId !== vendorId) {
      throw new Error('You do not have access to this order');
    }

    return this.subOrdersService.updateStatus(
      orderId,
      OrderStatus.PROCESSING,
      'Vendor is processing the order',
    );
  }

  @Post(':id/cancel')
  async cancelOrder(
    @Request() req: any,
    @Param('id') orderId: string,
    @Body('reason') reason: string,
  ) {
    const vendorId = req.user?.vendorId || 'mock-vendor-id';

    // Verify ownership
    const order = await this.subOrdersService.findOne(orderId);
    if (order.vendorId !== vendorId) {
      throw new Error('You do not have access to this order');
    }

    return this.subOrdersService.updateStatus(
      orderId,
      OrderStatus.CANCELLED_BY_VENDOR,
      `Cancelled by vendor: ${reason}`,
    );
  }
}
