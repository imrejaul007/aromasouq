import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { AdminOrdersService } from './admin-orders.service';
import { OrderStatus } from '@prisma/client';

@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  // ==================== ORDER MANAGEMENT ====================

  @Get()
  async getAllOrders(
    @Query('status') status?: OrderStatus,
    @Query('userId') userId?: string,
    @Query('orderNumber') orderNumber?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminOrdersService.getAllOrders({
      status,
      userId,
      orderNumber,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('stats')
  async getOrderStats(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.adminOrdersService.getOrderStats({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('revenue')
  async getRevenueStats(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.adminOrdersService.getRevenueStats({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('growth')
  async getOrderGrowth(
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
    @Query('days') days?: string,
  ) {
    return this.adminOrdersService.getOrderGrowth(
      period || 'daily',
      days ? parseInt(days) : 30,
    );
  }

  @Get('top-customers')
  async getTopCustomers(@Query('limit') limit?: string) {
    return this.adminOrdersService.getTopCustomers(limit ? parseInt(limit) : 10);
  }

  @Get('recent')
  async getRecentOrders(@Query('limit') limit?: string) {
    return this.adminOrdersService.getRecentOrders(limit ? parseInt(limit) : 20);
  }

  @Get(':id')
  async getOrderDetails(@Param('id') orderId: string) {
    return this.adminOrdersService.getOrderDetails(orderId);
  }

  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() dto: { status: OrderStatus; notes?: string },
  ) {
    return this.adminOrdersService.updateOrderStatus(orderId, dto.status, dto.notes);
  }

  @Delete(':id')
  async cancelOrder(
    @Param('id') orderId: string,
    @Body() dto: { reason: string; adminId: string },
  ) {
    return this.adminOrdersService.cancelOrder(orderId, dto.reason, dto.adminId);
  }
}
