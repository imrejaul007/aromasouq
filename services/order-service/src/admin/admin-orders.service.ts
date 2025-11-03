import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class AdminOrdersService {
  constructor(private prisma: PrismaService) {}

  // ==================== ORDER MANAGEMENT ====================

  async getAllOrders(options: {
    status?: OrderStatus;
    userId?: string;
    orderNumber?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  } = {}) {
    const { status, userId, orderNumber, dateFrom, dateTo, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (orderNumber) where.orderNumber = { contains: orderNumber };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          subOrders: {
            select: {
              id: true,
              subOrderNumber: true,
              vendorId: true,
              vendorName: true,
              status: true,
              total: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
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

  async getOrderDetails(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        subOrders: {
          include: {
            items: true,
            timeline: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        timeline: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string) {
    const order = await this.getOrderDetails(orderId);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === OrderStatus.CONFIRMED && { confirmedAt: new Date() }),
        ...(status === OrderStatus.CANCELLED && { cancelledAt: new Date() }),
        ...(status === OrderStatus.COMPLETED && { completedAt: new Date() }),
      },
    });

    // Create timeline entry
    await this.prisma.orderTimeline.create({
      data: {
        orderId,
        status,
        message: `Order status updated to ${status}`,
        notes,
        updatedBy: 'admin',
        updatedByRole: 'admin',
      },
    });

    return updated;
  }

  async cancelOrder(orderId: string, reason: string, cancelledBy: string) {
    const order = await this.getOrderDetails(orderId);

    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED) {
      throw new Error('Cannot cancel completed or delivered orders');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    // Create timeline entry
    await this.prisma.orderTimeline.create({
      data: {
        orderId,
        status: OrderStatus.CANCELLED,
        message: 'Order cancelled by admin',
        notes: reason,
        updatedBy: cancelledBy,
        updatedByRole: 'admin',
      },
    });

    // TODO: Trigger refund process if payment was made
    // TODO: Notify customer and vendor

    return {
      ...updated,
      message: 'Order cancelled successfully',
    };
  }

  // ==================== ORDER STATISTICS ====================

  async getOrderStats(options: { dateFrom?: Date; dateTo?: Date } = {}) {
    const { dateFrom, dateTo } = options;

    const where: any = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [
      total,
      pending,
      confirmed,
      processing,
      shipped,
      delivered,
      completed,
      cancelled,
      refunded,
    ] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.CONFIRMED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.PROCESSING } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.SHIPPED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.COMPLETED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.CANCELLED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.REFUNDED } }),
    ]);

    return {
      overview: {
        total,
        pending,
        confirmed,
        processing,
        shipped,
        delivered,
        completed,
        cancelled,
        refunded,
      },
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
      cancellationRate: total > 0 ? ((cancelled / total) * 100).toFixed(2) : 0,
    };
  }

  async getRevenueStats(options: { dateFrom?: Date; dateTo?: Date } = {}) {
    const { dateFrom, dateTo } = options;

    const where: any = { status: { in: [OrderStatus.COMPLETED, OrderStatus.DELIVERED] } };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        total: true,
        subtotal: true,
        tax: true,
        shippingFee: true,
        discount: true,
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total.toNumber(), 0);
    const totalSubtotal = orders.reduce((sum, order) => sum + order.subtotal.toNumber(), 0);
    const totalTax = orders.reduce((sum, order) => sum + order.tax.toNumber(), 0);
    const totalShipping = orders.reduce((sum, order) => sum + order.shippingFee.toNumber(), 0);
    const totalDiscount = orders.reduce((sum, order) => sum + order.discount.toNumber(), 0);

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalSubtotal: totalSubtotal.toFixed(2),
      totalTax: totalTax.toFixed(2),
      totalShipping: totalShipping.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      orderCount: orders.length,
      averageOrderValue: orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : 0,
    };
  }

  async getOrderGrowth(period: 'daily' | 'weekly' | 'monthly' = 'daily', days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
        total: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const growth: Record<string, { orders: number; revenue: number; completed: number }> = {};

    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];

      if (!growth[dateKey]) {
        growth[dateKey] = { orders: 0, revenue: 0, completed: 0 };
      }

      growth[dateKey].orders++;
      growth[dateKey].revenue += order.total.toNumber();
      if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED) {
        growth[dateKey].completed++;
      }
    });

    return {
      period,
      days,
      data: Object.entries(growth).map(([date, counts]) => ({
        date,
        orders: counts.orders,
        revenue: counts.revenue.toFixed(2),
        completed: counts.completed,
      })),
    };
  }

  async getTopCustomers(limit = 10) {
    const orders = await this.prisma.order.groupBy({
      by: ['userId', 'userEmail'],
      where: {
        status: { in: [OrderStatus.COMPLETED, OrderStatus.DELIVERED] },
      },
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: limit,
    });

    return orders.map((order) => ({
      userId: order.userId,
      userEmail: order.userEmail,
      totalOrders: order._count.id,
      totalSpent: order._sum.total?.toFixed(2) || '0.00',
    }));
  }

  async getRecentOrders(limit = 20) {
    return this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        userEmail: true,
        status: true,
        total: true,
        createdAt: true,
      },
    });
  }
}
