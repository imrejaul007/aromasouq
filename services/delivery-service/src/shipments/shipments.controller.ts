import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  create(@Body() createShipmentDto: any) {
    return this.shipmentsService.create(createShipmentDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Get('track/:trackingNumber')
  track(@Param('trackingNumber') trackingNumber: string) {
    return this.shipmentsService.trackByTrackingNumber(trackingNumber);
  }
}
