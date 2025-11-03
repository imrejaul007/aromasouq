import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

    return shipment;
  }

  private async generateShipmentNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const count = await this.prisma.shipment.count();
    const sequence = String(count + 1).padStart(4, '0');

    return `SHP-${year}${month}-${sequence}`;
  }

  async findOne(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
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
}
