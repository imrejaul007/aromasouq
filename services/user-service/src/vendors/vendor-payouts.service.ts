import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayoutStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class VendorPayoutsService {
  constructor(private prisma: PrismaService) {}

  // ==================== VENDOR PAYOUT MANAGEMENT ====================

  // Get all payouts for a vendor
  async getVendorPayouts(
    vendorId: string,
    options: {
      status?: PayoutStatus;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = { vendorId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.vendorPayout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vendorPayout.count({ where }),
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

  // Get single payout details
  async getPayoutById(payoutId: string, vendorId?: string) {
    const payout = await this.prisma.vendorPayout.findUnique({
      where: { id: payoutId },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            brandName: true,
            businessEmail: true,
            bankName: true,
            bankAccountNumber: true,
            iban: true,
          },
        },
      },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    // If vendorId provided, verify ownership
    if (vendorId && payout.vendorId !== vendorId) {
      throw new NotFoundException('Payout not found or access denied');
    }

    return payout;
  }

  // Get current period earnings (not yet in a payout)
  async getCurrentPeriodEarnings(vendorId: string) {
    // This would typically call the Order Service to get completed orders
    // For now, return a placeholder structure
    // TODO: Integrate with Order Service to fetch real data

    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Get the last payout to determine period start
    const lastPayout = await this.prisma.vendorPayout.findFirst({
      where: { vendorId },
      orderBy: { periodEnd: 'desc' },
    });

    const periodStart = lastPayout
      ? lastPayout.periodEnd
      : new Date(vendor.createdAt);
    const periodEnd = new Date();

    return {
      vendorId,
      periodStart,
      periodEnd,
      totalSales: 0, // TODO: Fetch from Order Service
      platformCommission: 0,
      pendingAmount: 0,
      orderCount: 0,
      message:
        'Integration with Order Service needed to fetch real-time earnings',
    };
  }

  // Request payout (creates a pending payout record)
  async requestPayout(vendorId: string, data: {
    periodStart: Date;
    periodEnd: Date;
    orderIds: string[];
    totalSales: number;
    platformCommission: number;
    adjustments?: number;
  }) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Verify vendor has bank details
    if (!vendor.bankAccountNumber || !vendor.bankName) {
      throw new BadRequestException(
        'Please complete your bank details before requesting a payout',
      );
    }

    const adjustments = data.adjustments || 0;
    const netAmount = data.totalSales - data.platformCommission - adjustments;

    // Create payout record
    const payout = await this.prisma.vendorPayout.create({
      data: {
        vendorId,
        amount: new Decimal(data.totalSales),
        currency: 'AED',
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        totalSales: new Decimal(data.totalSales),
        platformCommission: new Decimal(data.platformCommission),
        adjustments: new Decimal(adjustments),
        netAmount: new Decimal(netAmount),
        status: PayoutStatus.PENDING,
        orderIds: data.orderIds,
      },
    });

    // TODO: Notify admin about new payout request

    return {
      ...payout,
      message: 'Payout request submitted successfully. Awaiting admin approval.',
    };
  }

  // ==================== ADMIN PAYOUT MANAGEMENT ====================

  // Get all payouts (admin)
  async getAllPayouts(options: {
    status?: PayoutStatus;
    vendorId?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { status, vendorId, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;

    const [data, total] = await Promise.all([
      this.prisma.vendorPayout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              brandName: true,
              businessEmail: true,
            },
          },
        },
      }),
      this.prisma.vendorPayout.count({ where }),
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

  // Process payout (admin marks as processing)
  async processPayout(payoutId: string, adminId: string) {
    const payout = await this.getPayoutById(payoutId);

    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException(
        'Only pending payouts can be processed',
      );
    }

    const updated = await this.prisma.vendorPayout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.PROCESSING,
        notes: `Processing by admin ${adminId}`,
      },
    });

    // TODO: Notify vendor that payout is being processed

    return {
      ...updated,
      message: 'Payout marked as processing',
    };
  }

  // Complete payout (admin marks as paid)
  async completePayout(
    payoutId: string,
    adminId: string,
    data: {
      transactionReference: string;
      paymentMethod: string;
      notes?: string;
    },
  ) {
    const payout = await this.getPayoutById(payoutId);

    if (payout.status !== PayoutStatus.PROCESSING) {
      throw new BadRequestException(
        'Only processing payouts can be completed',
      );
    }

    const updated = await this.prisma.vendorPayout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.COMPLETED,
        transactionReference: data.transactionReference,
        paymentMethod: data.paymentMethod,
        paidAt: new Date(),
        notes: data.notes || `Completed by admin ${adminId}`,
      },
    });

    // TODO: Notify vendor that payout has been completed

    return {
      ...updated,
      message: 'Payout completed successfully',
    };
  }

  // Fail payout (admin marks as failed)
  async failPayout(payoutId: string, adminId: string, reason: string) {
    const payout = await this.getPayoutById(payoutId);

    if (payout.status === PayoutStatus.COMPLETED) {
      throw new BadRequestException('Cannot fail a completed payout');
    }

    const updated = await this.prisma.vendorPayout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.FAILED,
        notes: `Failed by admin ${adminId}: ${reason}`,
      },
    });

    // TODO: Notify vendor about failed payout with reason

    return {
      ...updated,
      message: 'Payout marked as failed',
    };
  }

  // Cancel payout (admin or vendor)
  async cancelPayout(payoutId: string, reason: string, cancelledBy: string) {
    const payout = await this.getPayoutById(payoutId);

    if (payout.status === PayoutStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed payout');
    }

    if (payout.status === PayoutStatus.PROCESSING) {
      throw new BadRequestException(
        'Cannot cancel a payout that is being processed',
      );
    }

    const updated = await this.prisma.vendorPayout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.CANCELLED,
        notes: `Cancelled by ${cancelledBy}: ${reason}`,
      },
    });

    return {
      ...updated,
      message: 'Payout cancelled',
    };
  }

  // Get payout summary (admin dashboard)
  async getPayoutSummary() {
    const [
      totalPayouts,
      pendingPayouts,
      processingPayouts,
      completedPayouts,
      failedPayouts,
    ] = await Promise.all([
      this.prisma.vendorPayout.count(),
      this.prisma.vendorPayout.count({
        where: { status: PayoutStatus.PENDING },
      }),
      this.prisma.vendorPayout.count({
        where: { status: PayoutStatus.PROCESSING },
      }),
      this.prisma.vendorPayout.count({
        where: { status: PayoutStatus.COMPLETED },
      }),
      this.prisma.vendorPayout.count({
        where: { status: PayoutStatus.FAILED },
      }),
    ]);

    // Get pending payout amounts
    const pendingPayoutRecords = await this.prisma.vendorPayout.findMany({
      where: { status: PayoutStatus.PENDING },
      select: { netAmount: true },
    });

    const totalPendingAmount = pendingPayoutRecords.reduce(
      (sum, p) => sum + p.netAmount.toNumber(),
      0,
    );

    // Get completed payout amounts
    const completedPayoutRecords = await this.prisma.vendorPayout.findMany({
      where: { status: PayoutStatus.COMPLETED },
      select: { netAmount: true },
    });

    const totalPaidAmount = completedPayoutRecords.reduce(
      (sum, p) => sum + p.netAmount.toNumber(),
      0,
    );

    return {
      overview: {
        totalPayouts,
        pendingPayouts,
        processingPayouts,
        completedPayouts,
        failedPayouts,
      },
      financial: {
        totalPendingAmount: totalPendingAmount.toFixed(2),
        totalPaidAmount: totalPaidAmount.toFixed(2),
      },
    };
  }

  // Generate monthly payouts (scheduled job)
  async generateMonthlyPayouts() {
    // This would be called by a cron job at the end of each month
    // TODO: Integrate with Order Service to fetch completed orders
    // For now, return a placeholder

    return {
      message:
        'Monthly payout generation requires integration with Order Service',
      note: 'This will fetch all completed orders per vendor and create payout records',
    };
  }
}
