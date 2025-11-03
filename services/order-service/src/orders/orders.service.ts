import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, Prisma } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RewardsIntegrationService } from '../rewards-integration/rewards-integration.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private rewardsIntegration: RewardsIntegrationService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const {
      userId,
      userEmail,
      userPhone,
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      couponCode,
      walletAmount,
      customerNotes,
    } = createOrderDto;

    // 1. Validate items and fetch product details
    const validatedItems = await this.validateOrderItems(items);

    // 2. Calculate order totals
    const calculations = await this.calculateOrderTotals(
      validatedItems,
      couponCode,
      walletAmount,
    );

    // 3. Split order by vendor (multi-vendor logic)
    const vendorSplits = this.splitOrderByVendor(validatedItems);

    // 4. Generate order number
    const orderNumber = await this.generateOrderNumber();

    // 5. Create order with sub-orders in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create main order
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          userEmail,
          userPhone,
          status: OrderStatus.PENDING,
          shippingAddress: shippingAddress || {},
          billingAddress: billingAddress || shippingAddress || {},
          paymentMethod,
          paymentStatus: 'pending',
          customerNotes,

          // Totals
          subtotal: calculations.subtotal,
          tax: calculations.tax,
          shippingFee: calculations.shippingFee,
          discount: calculations.discount,
          walletUsed: calculations.walletUsed,
          cashbackEarned: calculations.cashbackEarned,
          total: calculations.total,

          // Applied coupons
          appliedCoupons: couponCode ? { couponCode, discount: calculations.discount } : null,

          // Timeline
          timeline: {
            create: {
              status: OrderStatus.PENDING,
              message: 'Order created',
            },
          },
        },
      });

      // Create sub-orders for each vendor
      for (const [vendorId, vendorItems] of Object.entries(vendorSplits)) {
        const subOrderNumber = await this.generateSubOrderNumber(orderNumber);
        const subOrderSubtotal = vendorItems.reduce(
          (sum, item) => sum + item.subtotal,
          0,
        );
        const subOrderTax = vendorItems.reduce((sum, item) => sum + item.tax, 0);
        const subOrderTotal = subOrderSubtotal + subOrderTax;

        // Calculate commission (default 10%)
        const commissionRate = 10;
        const commissionAmount = (subOrderTotal * commissionRate) / 100;
        const vendorPayout = subOrderTotal - commissionAmount;

        await tx.subOrder.create({
          data: {
            subOrderNumber,
            orderId: createdOrder.id,
            vendorId,
            vendorName: vendorItems[0].vendorName,
            status: OrderStatus.PENDING,
            subtotal: subOrderSubtotal,
            tax: subOrderTax,
            shippingFee: 0, // Would be calculated per vendor
            total: subOrderTotal,
            commissionRate,
            commissionAmount,
            vendorPayout,

            items: {
              create: vendorItems.map((item) => ({
                productId: item.productId,
                productSku: item.productSku,
                productName: item.productName,
                productSlug: item.productSlug,
                productImage: item.productImage,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                subtotal: item.subtotal,
                tax: item.tax,
                total: item.total,
              })),
            },

            timeline: {
              create: {
                status: OrderStatus.PENDING,
                message: 'Sub-order created',
              },
            },
          },
        });
      }

      // Track coupon usage if provided
      if (couponCode && calculations.couponId) {
        await tx.couponUsage.create({
          data: {
            couponId: calculations.couponId,
            userId,
            orderId: createdOrder.id,
            discount: calculations.discount,
          },
        });

        // Increment coupon usage
        await tx.coupon.update({
          where: { id: calculations.couponId },
          data: { currentUses: { increment: 1 } },
        });
      }

      return createdOrder;
    });

    // 6. Send notifications (async)
    this.sendOrderNotifications(order.id, userId).catch((error) => {
      this.logger.error('Failed to send order notifications:', error.message);
    });

    // 7. Award coins and create pending cashback (async)
    this.awardRewardsForOrder(order.id, userId, orderNumber, calculations, validatedItems).catch(
      (error) => {
        this.logger.error('Failed to award rewards:', error.message);
      },
    );

    return this.findOne(order.id);
  }

  private async validateOrderItems(items: any[]) {
    const validatedItems = [];

    for (const item of items) {
      // In production, fetch product details from Product Service
      // For now, we'll use the provided data
      const unitPrice = item.price || item.unitPrice;
      const quantity = item.quantity;
      const subtotal = unitPrice * quantity;
      const tax = subtotal * 0.05; // 5% VAT
      const total = subtotal + tax;

      validatedItems.push({
        productId: item.productId,
        productSku: item.productSku || `SKU-${item.productId}`,
        productName: item.productName || `Product ${item.productId}`,
        productSlug:
          item.productSlug ||
          (item.productName || item.productId)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-'),
        productImage: item.productImage || null,
        vendorId: item.vendorId,
        vendorName: item.vendorName || `Vendor ${item.vendorId}`,
        unitPrice,
        quantity,
        subtotal,
        tax,
        total,
      });
    }

    return validatedItems;
  }

  private async calculateOrderTotals(
    items: any[],
    couponCode?: string,
    walletAmount?: number,
  ) {
    // Calculate subtotal
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Calculate tax (5% VAT for GCC)
    const tax = subtotal * 0.05;

    // Calculate shipping (flat rate for now, would use Delivery Service API)
    const shippingFee = 25.0; // AED 25 flat rate

    // Apply coupon discount
    let discount = 0;
    let couponId = null;

    if (couponCode) {
      const couponResult = await this.validateCoupon(couponCode, subtotal);
      if (couponResult) {
        discount = couponResult.discountAmount;
        couponId = couponResult.couponId;
      }
    }

    // Calculate wallet usage
    const walletUsed = Math.min(walletAmount || 0, subtotal - discount);

    // Calculate cashback (2% of subtotal)
    const cashbackEarned = subtotal * 0.02;

    // Calculate total
    const total = subtotal + tax + shippingFee - discount - walletUsed;

    return {
      subtotal,
      tax,
      shippingFee,
      discount,
      walletUsed,
      cashbackEarned,
      total,
      couponId,
    };
  }

  private splitOrderByVendor(items: any[]) {
    const vendorSplits: Record<string, any[]> = {};

    for (const item of items) {
      if (!vendorSplits[item.vendorId]) {
        vendorSplits[item.vendorId] = [];
      }
      vendorSplits[item.vendorId].push(item);
    }

    return vendorSplits;
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Get count of orders today
    const todayStart = new Date(date.setHours(0, 0, 0, 0));
    const todayEnd = new Date(date.setHours(23, 59, 59, 999));

    const count = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `ORD-${year}${month}-${sequence}`;
  }

  private async generateSubOrderNumber(orderNumber: string): Promise<string> {
    const count = await this.prisma.subOrder.count({
      where: {
        order: {
          orderNumber,
        },
      },
    });

    return `${orderNumber}-SUB${count + 1}`;
  }

  private async validateCoupon(
    code: string,
    subtotal: number,
  ): Promise<{ discountAmount: number; couponId: string } | null> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      throw new BadRequestException('Invalid coupon code');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is not active');
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (coupon.minOrderValue && subtotal < coupon.minOrderValue.toNumber()) {
      throw new BadRequestException(
        `Minimum order value of ${coupon.minOrderValue} required`,
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (subtotal * coupon.value.toNumber()) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount.toNumber());
      }
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discountAmount = coupon.value.toNumber();
    }

    return {
      discountAmount,
      couponId: coupon.id,
    };
  }

  private async sendOrderNotifications(orderId: string, userId: string) {
    try {
      await firstValueFrom(
        this.httpService.post(
          'http://localhost:3400/api/notifications/send',
          {
            templateKey: 'order-confirmed',
            userId,
            channels: ['EMAIL', 'SMS', 'PUSH'],
            variables: {
              orderNumber: orderId,
            },
          },
        ),
      );
    } catch (error) {
      this.logger.error('Notification service error:', error.message);
    }
  }

  private async awardRewardsForOrder(
    orderId: string,
    userId: string,
    orderNumber: string,
    calculations: any,
    validatedItems: any[],
  ) {
    try {
      // 1. Award Coins (branded + universal)
      const coinItems = validatedItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        brandId: item.vendorId, // Using vendorId as brandId for now
        brandName: item.vendorName,
        brandSlug: item.productSlug.split('-')[0], // Extract brand from slug
        subtotal: item.subtotal,
      }));

      await this.rewardsIntegration.earnCoinsOnOrder({
        userId,
        orderId,
        orderNumber,
        orderTotal: calculations.subtotal,
        items: coinItems,
      });

      // 2. Create Pending Cashback (assuming products have cashback rates)
      // In production, fetch cashback rates from Product Service
      const cashbackItems = validatedItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        cashbackRate: 2.0, // Default 2% - should come from product data
        subtotal: item.subtotal,
      }));

      await this.rewardsIntegration.earnCashbackOnOrder({
        userId,
        orderId,
        orderNumber,
        items: cashbackItems,
      });

      this.logger.log(`Successfully awarded rewards for order ${orderNumber}`);
    } catch (error) {
      this.logger.error(`Failed to award rewards for order ${orderId}:`, error.message);
      // Don't throw - rewards failure shouldn't block order creation
    }
  }

  async findAll(params?: {
    userId?: string;
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.userId) where.userId = params.userId;
    if (params?.status) where.status = params.status;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subOrders: {
            include: {
              items: true,
            },
          },
        },
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

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        subOrders: {
          include: {
            items: true,
            timeline: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        timeline: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.findOne(id);

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        timeline: {
          create: {
            status,
            message: `Order status updated to ${status}`,
          },
        },
      },
    });

    // Credit cashback when order is delivered
    if (status === OrderStatus.DELIVERED) {
      this.rewardsIntegration.creditCashbackOnDelivery(id).catch((error) => {
        this.logger.error(`Failed to credit cashback for order ${id}:`, error.message);
      });
    }

    return updatedOrder;
  }

  async cancel(id: string, reason?: string) {
    const order = await this.findOne(id);

    if (
      !['PENDING', 'PAYMENT_PENDING', 'CONFIRMED'].includes(order.status)
    ) {
      throw new BadRequestException(
        'Order cannot be cancelled at this stage',
      );
    }

    const cancelledOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        timeline: {
          create: {
            status: OrderStatus.CANCELLED,
            message: reason || 'Order cancelled by customer',
          },
        },
      },
    });

    // Cancel pending cashback when order is cancelled
    this.rewardsIntegration.cancelCashbackOnOrderCancel(id).catch((error) => {
      this.logger.error(`Failed to cancel cashback for order ${id}:`, error.message);
    });

    return cancelledOrder;
  }
}
