import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShipmentStatus } from '@prisma/client';

@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}

  async addTrackingEvent(shipmentId: string, data: {
    status: ShipmentStatus;
    message: string;
    description?: string;
    location?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    facilityCode?: string;
    facilityName?: string;
    courierEventId?: string;
    eventTimestamp?: Date;
  }) {
    const event = await this.prisma.trackingEvent.create({
      data: {
        shipmentId,
        status: data.status,
        message: data.message,
        description: data.description,
        location: data.location,
        city: data.city,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        facilityCode: data.facilityCode,
        facilityName: data.facilityName,
        courierEventId: data.courierEventId,
        eventTimestamp: data.eventTimestamp || new Date(),
      },
    });

    // Also update shipment status
    await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { status: data.status },
    });

    return event;
  }

  async getTrackingHistory(shipmentId: string) {
    return this.prisma.trackingEvent.findMany({
      where: { shipmentId },
      orderBy: { eventTimestamp: 'desc' },
    });
  }

  async getLatestEvent(shipmentId: string) {
    return this.prisma.trackingEvent.findFirst({
      where: { shipmentId },
      orderBy: { eventTimestamp: 'desc' },
    });
  }

  async getEventsByStatus(status: ShipmentStatus) {
    return this.prisma.trackingEvent.findMany({
      where: { status },
      orderBy: { eventTimestamp: 'desc' },
      take: 100,
    });
  }
}
