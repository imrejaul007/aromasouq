import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { ShipmentStatus } from '@prisma/client';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  create(@Body() createShipmentDto: any) {
    return this.shipmentsService.create(createShipmentDto);
  }

  @Get()
  findAll(
    @Query('status') status?: ShipmentStatus,
    @Query('customerId') customerId?: string,
    @Query('courierId') courierId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.shipmentsService.findAll({
      status,
      customerId,
      courierId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('stats')
  getStats(@Query('customerId') customerId?: string, @Query('courierId') courierId?: string) {
    return this.shipmentsService.getStats({ customerId, courierId });
  }

  @Get('track/:trackingNumber')
  track(@Param('trackingNumber') trackingNumber: string) {
    return this.shipmentsService.trackByTrackingNumber(trackingNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: { status: ShipmentStatus; message: string; data?: any },
  ) {
    return this.shipmentsService.updateStatus(
      id,
      updateStatusDto.status,
      updateStatusDto.message,
      updateStatusDto.data,
    );
  }

  @Patch(':id/tracking')
  assignTracking(
    @Param('id') id: string,
    @Body() trackingDto: { trackingNumber: string; trackingUrl?: string },
  ) {
    return this.shipmentsService.assignTracking(id, trackingDto.trackingNumber, trackingDto.trackingUrl);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @Body() cancelDto: { reason: string }) {
    return this.shipmentsService.cancel(id, cancelDto.reason);
  }
}
