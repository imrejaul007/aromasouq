import {
  Controller,
  Get,
  Param,
  Query,
  Patch,
  Body,
  Post,
} from '@nestjs/common';
import { SubOrdersService } from './sub-orders.service';
import { OrderStatus } from '@prisma/client';

@Controller('sub-orders')
export class SubOrdersController {
  constructor(private readonly subOrdersService: SubOrdersService) {}

  @Get('vendor/:vendorId')
  async findAllByVendor(
    @Param('vendorId') vendorId: string,
    @Query('status') status?: OrderStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.subOrdersService.findAllByVendor(vendorId, {
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('vendor/:vendorId/stats')
  async getVendorStats(@Param('vendorId') vendorId: string) {
    return this.subOrdersService.getVendorStats(vendorId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.subOrdersService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Body('notes') notes?: string,
  ) {
    return this.subOrdersService.updateStatus(id, status, notes);
  }

  @Post(':id/ready-to-ship')
  async markAsReadyToShip(@Param('id') id: string) {
    return this.subOrdersService.markAsReadyToShip(id);
  }

  @Post(':id/ship')
  async markAsShipped(
    @Param('id') id: string,
    @Body('trackingNumber') trackingNumber?: string,
  ) {
    return this.subOrdersService.markAsShipped(id, trackingNumber);
  }
}
