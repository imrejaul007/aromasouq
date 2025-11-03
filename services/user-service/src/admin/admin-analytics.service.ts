import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminAnalyticsService {
  constructor(private prisma: PrismaService) {}

  // ==================== PLATFORM OVERVIEW ====================

  async getPlatformOverview() {
    const [
      totalUsers,
      totalVendors,
      activeVendors,
      verifiedVendors,
      // Note: These would come from other services in production
      // For now, returning placeholders with TODO comments
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'VENDOR' } }),
      this.prisma.vendorProfile.count({ where: { isActive: true } }),
      this.prisma.vendorProfile.count({ where: { verificationStatus: 'VERIFIED' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        vendors: totalVendors,
        activeVendors,
        verifiedVendors,
      },
      // TODO: Add from Product Service
      products: {
        total: 0,
        active: 0,
        pending: 0,
      },
      // TODO: Add from Order Service
      orders: {
        total: 0,
        completed: 0,
        revenue: '0.00',
      },
    };
  }

  // ==================== USER ANALYTICS ====================

  async getUserAnalytics(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        role: true,
        emailVerified: true,
        isActive: true,
      },
    });

    // Group by date
    const dailyData: Record<
      string,
      { newUsers: number; newVendors: number; verified: number }
    > = {};

    users.forEach((user) => {
      const dateKey = user.createdAt.toISOString().split('T')[0];

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { newUsers: 0, newVendors: 0, verified: 0 };
      }

      dailyData[dateKey].newUsers++;
      if (user.role === 'VENDOR') dailyData[dateKey].newVendors++;
      if (user.emailVerified) dailyData[dateKey].verified++;
    });

    return {
      period: days,
      data: Object.entries(dailyData)
        .map(([date, counts]) => ({
          date,
          ...counts,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  // ==================== VENDOR ANALYTICS ====================

  async getVendorAnalytics() {
    const [
      totalVendors,
      pendingVendors,
      verifiedVendors,
      rejectedVendors,
      activeVendors,
    ] = await Promise.all([
      this.prisma.vendorProfile.count(),
      this.prisma.vendorProfile.count({ where: { verificationStatus: 'PENDING' } }),
      this.prisma.vendorProfile.count({ where: { verificationStatus: 'VERIFIED' } }),
      this.prisma.vendorProfile.count({ where: { verificationStatus: 'REJECTED' } }),
      this.prisma.vendorProfile.count({ where: { isActive: true } }),
    ]);

    // Get vendor type distribution
    const allVendors = await this.prisma.vendorProfile.findMany({
      select: { businessType: true },
    });

    const typeDistribution: Record<string, number> = {};
    allVendors.forEach((vendor) => {
      typeDistribution[vendor.businessType] = (typeDistribution[vendor.businessType] || 0) + 1;
    });

    return {
      overview: {
        total: totalVendors,
        pending: pendingVendors,
        verified: verifiedVendors,
        rejected: rejectedVendors,
        active: activeVendors,
      },
      byType: typeDistribution,
    };
  }

  async getVendorPerformance(limit = 10) {
    // Get vendors with most products/sales
    // Note: This requires integration with Product and Order services
    // For now, returning vendor list with placeholders
    const topVendors = await this.prisma.vendorProfile.findMany({
      where: {
        verificationStatus: 'VERIFIED',
        isActive: true,
      },
      select: {
        id: true,
        businessName: true,
        brandSlug: true,
        userId: true,
      },
      take: limit,
    });

    return topVendors.map((vendor) => ({
      ...vendor,
      // TODO: Add from Product Service
      totalProducts: 0,
      activeProducts: 0,
      // TODO: Add from Order Service
      totalOrders: 0,
      totalRevenue: '0.00',
      rating: 0,
    }));
  }

  // ==================== COMMISSION & PAYOUT ANALYTICS ====================

  async getCommissionAnalytics(options: { dateFrom?: Date; dateTo?: Date } = {}) {
    const { dateFrom, dateTo } = options;

    const where: any = { status: 'COMPLETED' };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const payouts = await this.prisma.vendorPayout.findMany({
      where,
      select: {
        totalSales: true,
        platformCommission: true,
        netAmount: true,
        createdAt: true,
      },
    });

    const totalSales = payouts.reduce((sum, p) => sum + p.totalSales.toNumber(), 0);
    const totalCommission = payouts.reduce(
      (sum, p) => sum + p.platformCommission.toNumber(),
      0,
    );
    const totalPayouts = payouts.reduce((sum, p) => sum + p.netAmount.toNumber(), 0);

    return {
      totalSales: totalSales.toFixed(2),
      platformCommission: totalCommission.toFixed(2),
      vendorPayouts: totalPayouts.toFixed(2),
      commissionRate: totalSales > 0 ? ((totalCommission / totalSales) * 100).toFixed(2) : 0,
      payoutCount: payouts.length,
    };
  }

  async getPayoutAnalytics() {
    const [total, pending, processing, completed, failed] = await Promise.all([
      this.prisma.vendorPayout.count(),
      this.prisma.vendorPayout.count({ where: { status: 'PENDING' } }),
      this.prisma.vendorPayout.count({ where: { status: 'PROCESSING' } }),
      this.prisma.vendorPayout.count({ where: { status: 'COMPLETED' } }),
      this.prisma.vendorPayout.count({ where: { status: 'FAILED' } }),
    ]);

    const pendingPayouts = await this.prisma.vendorPayout.findMany({
      where: { status: 'PENDING' },
      select: { netAmount: true },
    });

    const completedPayouts = await this.prisma.vendorPayout.findMany({
      where: { status: 'COMPLETED' },
      select: { netAmount: true },
    });

    const pendingAmount = pendingPayouts.reduce((sum, p) => sum + p.netAmount.toNumber(), 0);
    const completedAmount = completedPayouts.reduce((sum, p) => sum + p.netAmount.toNumber(), 0);

    return {
      overview: {
        total,
        pending,
        processing,
        completed,
        failed,
      },
      financial: {
        pendingAmount: pendingAmount.toFixed(2),
        completedAmount: completedAmount.toFixed(2),
      },
    };
  }

  // ==================== REWARDS ANALYTICS ====================

  async getRewardsAnalytics() {
    const [totalCoins, totalCashback] = await Promise.all([
      this.prisma.coinTransaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          type: 'EARN',
        },
      }),
      this.prisma.cashbackTransaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: 'CREDITED',
        },
      }),
    ]);

    const [coinTransactions, cashbackTransactions] = await Promise.all([
      this.prisma.coinTransaction.findMany({
        where: { type: 'EARN' },
        select: { coinType: true, amount: true },
      }),
      this.prisma.cashbackTransaction.findMany({
        select: { status: true, amount: true },
      }),
    ]);

    const coinsByType: Record<string, number> = {};
    coinTransactions.forEach((tx) => {
      coinsByType[tx.coinType] = (coinsByType[tx.coinType] || 0) + tx.amount;
    });

    const cashbackByStatus: Record<string, number> = {};
    cashbackTransactions.forEach((tx) => {
      const amount = Number(tx.amount);
      cashbackByStatus[tx.status] = (cashbackByStatus[tx.status] || 0) + amount;
    });

    return {
      coins: {
        totalDistributed: totalCoins._sum.amount || 0,
        byType: coinsByType,
      },
      cashback: {
        totalDistributed: totalCashback._sum.amount?.toFixed(2) || '0.00',
        byStatus: Object.entries(cashbackByStatus).reduce(
          (acc, [status, amount]) => {
            acc[status] = amount.toFixed(2);
            return acc;
          },
          {} as Record<string, string>,
        ),
      },
    };
  }

  // ==================== TIME-BASED ANALYTICS ====================

  async getHourlyActivity(date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const users = await this.prisma.user.findMany({
      where: {
        lastLoginAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        lastLoginAt: true,
      },
    });

    // Group by hour
    const hourlyData: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }

    users.forEach((user) => {
      if (user.lastLoginAt) {
        const hour = user.lastLoginAt.getHours();
        hourlyData[hour]++;
      }
    });

    return {
      date: targetDate.toISOString().split('T')[0],
      data: Object.entries(hourlyData).map(([hour, count]) => ({
        hour: parseInt(hour),
        activeUsers: count,
      })),
    };
  }
}
