import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class SubOrdersService {
  private readonly logger = new Logger(SubOrdersService.name);

  constructor(private prisma: PrismaService) {}

  async findAllByVendor(vendorId: string, params?: {
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { vendorId };
    if (params?.status) where.status = params.status;

    const [data, total] = await Promise.all([
      this.prisma.subOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderNumber: true,
              userId: true,
              status: true,
              createdAt: true,
            },
          },
          items: true,
          timeline: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      }),
      this.prisma.subOrder.count({ where }),
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
    const subOrder = await this.prisma.subOrder.findUnique({
      where: { id },
      include: {
        order: true,
        items: true,
        timeline: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subOrder) {
      throw new NotFoundException('Sub-order not found');
    }

    return subOrder;
  }

  async updateStatus(id: string, status: OrderStatus, notes?: string) {
    const subOrder = await this.findOne(id);

    // Update sub-order status
    const updated = await this.prisma.subOrder.update({
      where: { id },
      data: {
        status,
        timeline: {
          create: {
            status,
            message: notes || `Sub-order status updated to ${status}`,
          },
        },
      },
    });

    // Check if all sub-orders have the same status, then update main order
    await this.updateMainOrderStatus(subOrder.orderId);

    return updated;
  }

  private async updateMainOrderStatus(orderId: string) {
    const subOrders = await this.prisma.subOrder.findMany({
      where: { orderId },
    });

    // If all sub-orders have the same status, update main order
    const statuses = subOrders.map((so) => so.status);
    const uniqueStatuses = [...new Set(statuses)];

    if (uniqueStatuses.length === 1) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: uniqueStatuses[0],
          timeline: {
            create: {
              status: uniqueStatuses[0],
              message: `All sub-orders are ${uniqueStatuses[0]}`,
            },
          },
        },
      });
    }
  }

  async markAsReadyToShip(id: string) {
    return this.updateStatus(
      id,
      OrderStatus.READY_TO_SHIP,
      'Vendor marked order as ready to ship',
    );
  }

  async markAsShipped(id: string, trackingNumber?: string) {
    const subOrder = await this.findOne(id);

    return this.prisma.subOrder.update({
      where: { id },
      data: {
        status: OrderStatus.SHIPPED,
        timeline: {
          create: {
            status: OrderStatus.SHIPPED,
            message: trackingNumber
              ? `Shipped with tracking: ${trackingNumber}`
              : 'Order shipped',
          },
        },
      },
    });
  }

  async getVendorStats(vendorId: string) {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      completedOrders,
      cancelledOrders,
    ] = await Promise.all([
      this.prisma.subOrder.count({ where: { vendorId } }),
      this.prisma.subOrder.count({
        where: { vendorId, status: OrderStatus.PENDING },
      }),
      this.prisma.subOrder.count({
        where: { vendorId, status: OrderStatus.PROCESSING },
      }),
      this.prisma.subOrder.count({
        where: { vendorId, status: OrderStatus.SHIPPED },
      }),
      this.prisma.subOrder.count({
        where: { vendorId, status: OrderStatus.COMPLETED },
      }),
      this.prisma.subOrder.count({
        where: { vendorId, status: OrderStatus.CANCELLED },
      }),
    ]);

    // Calculate total revenue
    const completedSubOrders = await this.prisma.subOrder.findMany({
      where: {
        vendorId,
        status: OrderStatus.COMPLETED,
      },
      select: {
        vendorPayout: true,
      },
    });

    const totalRevenue = completedSubOrders.reduce(
      (sum, so) => sum + so.vendorPayout.toNumber(),
      0,
    );

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
    };
  }
}
