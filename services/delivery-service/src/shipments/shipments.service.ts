import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShipmentStatus } from '@prisma/client';

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const shipmentNumber = await this.generateShipmentNumber();

    const shipment = await this.prisma.shipment.create({
      data: {
        shipmentNumber,
        orderId: data.orderId,
        subOrderId: data.subOrderId,
        orderNumber: data.orderNumber || shipmentNumber,
        courier: {
          connect: { id: data.courierId },
        },
        courierProvider: data.courierProvider || 'FETCHR',
        customerId: data.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        shippingAddress: data.shippingAddress || {},
        pickupAddress: data.pickupAddress || {},
        deliveryType: data.deliveryType || 'STANDARD',
        packageCount: data.packageCount || 1,
        totalWeight: data.totalWeight || 1.0,
        items: data.items || [],
        declaredValue: data.declaredValue || 0,
        shippingFee: data.shippingFee || 25.0,
        totalFee: data.totalFee || 25.0,
        status: 'PENDING',
      },
    });

    // Create initial tracking event
    await this.prisma.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status: ShipmentStatus.PENDING,
        message: 'Shipment created',
        description: 'Your shipment has been created and is awaiting pickup',
        eventTimestamp: new Date(),
      },
    });

    return shipment;
  }

  async findAll(options: {
    status?: ShipmentStatus;
    customerId?: string;
    courierId?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { status, customerId, courierId, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (courierId) where.courierId = courierId;

    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        include: {
          courier: true,
          trackingEvents: {
            orderBy: { eventTimestamp: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        courier: true,
        trackingEvents: {
          orderBy: { eventTimestamp: 'desc' },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return shipment;
  }

  async trackByTrackingNumber(trackingNumber: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { trackingNumber },
      include: {
        courier: true,
        trackingEvents: {
          orderBy: { eventTimestamp: 'desc' },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return shipment;
  }

  async updateStatus(id: string, status: ShipmentStatus, message: string, data?: any) {
    const shipment = await this.findOne(id);

    const updateData: any = { status };

    // Update timestamps based on status
    if (status === ShipmentStatus.PICKED_UP) {
      updateData.pickedUpAt = new Date();
    } else if (status === ShipmentStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
      if (data?.deliveredTo) updateData.deliveredTo = data.deliveredTo;
      if (data?.signature) updateData.signature = data.signature;
      if (data?.deliveryPhoto) updateData.deliveryPhoto = data.deliveryPhoto;
    } else if (status === ShipmentStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
    }

    // Update shipment
    const updated = await this.prisma.shipment.update({
      where: { id },
      data: updateData,
    });

    // Create tracking event
    await this.prisma.trackingEvent.create({
      data: {
        shipmentId: id,
        status,
        message,
        description: data?.description,
        location: data?.location,
        city: data?.city,
        country: data?.country,
        latitude: data?.latitude,
        longitude: data?.longitude,
        eventTimestamp: new Date(),
      },
    });

    return updated;
  }

  async assignTracking(id: string, trackingNumber: string, trackingUrl?: string) {
    const shipment = await this.findOne(id);

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        trackingNumber,
        trackingUrl,
        status: ShipmentStatus.CONFIRMED,
      },
    });

    // Create tracking event
    await this.prisma.trackingEvent.create({
      data: {
        shipmentId: id,
        status: ShipmentStatus.CONFIRMED,
        message: 'Tracking number assigned',
        description: `Tracking number: ${trackingNumber}`,
        eventTimestamp: new Date(),
      },
    });

    return updated;
  }

  async cancel(id: string, reason: string) {
    const shipment = await this.findOne(id);

    const allowedStatuses = [ShipmentStatus.PENDING, ShipmentStatus.CONFIRMED];
    if (!allowedStatuses.some(status => status === shipment.status)) {
      throw new BadRequestException('Cannot cancel shipment in current status');
    }

    return this.updateStatus(id, ShipmentStatus.CANCELLED, 'Shipment cancelled', {
      description: reason,
    });
  }

  async getStats(options: { customerId?: string; courierId?: string } = {}) {
    const where: any = {};
    if (options.customerId) where.customerId = options.customerId;
    if (options.courierId) where.courierId = options.courierId;

    const [total, pending, inTransit, delivered, cancelled] = await Promise.all([
      this.prisma.shipment.count({ where }),
      this.prisma.shipment.count({ where: { ...where, status: ShipmentStatus.PENDING } }),
      this.prisma.shipment.count({ where: { ...where, status: ShipmentStatus.IN_TRANSIT } }),
      this.prisma.shipment.count({ where: { ...where, status: ShipmentStatus.DELIVERED } }),
      this.prisma.shipment.count({ where: { ...where, status: ShipmentStatus.CANCELLED } }),
    ]);

    return {
      total,
      pending,
      inTransit,
      delivered,
      cancelled,
      deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(2) : 0,
    };
  }

  private async generateShipmentNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const count = await this.prisma.shipment.count();
    const sequence = String(count + 1).padStart(4, '0');

    return `SHP-${year}${month}-${sequence}`;
  }
}
