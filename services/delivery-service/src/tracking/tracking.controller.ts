import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { ShipmentStatus } from '@prisma/client';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('events')
  addTrackingEvent(@Body() data: any) {
    return this.trackingService.addTrackingEvent(data.shipmentId, data);
  }

  @Get('shipment/:id')
  getTrackingHistory(@Param('id') shipmentId: string) {
    return this.trackingService.getTrackingHistory(shipmentId);
  }

  @Get('shipment/:id/latest')
  getLatestEvent(@Param('id') shipmentId: string) {
    return this.trackingService.getLatestEvent(shipmentId);
  }

  @Get('status/:status')
  getEventsByStatus(@Param('status') status: ShipmentStatus) {
    return this.trackingService.getEventsByStatus(status);
  }
}
