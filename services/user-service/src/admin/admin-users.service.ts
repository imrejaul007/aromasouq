import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  // ==================== USER MANAGEMENT ====================

  async getAllUsers(options: {
    search?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}) {
    const { search, role, isActive, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
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

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is a vendor and get vendor profile separately
    let vendorProfile = null;
    if (user.role === 'VENDOR') {
      vendorProfile = await this.prisma.vendorProfile.findUnique({
        where: { userId: user.id },
      });
    }

    return {
      ...user,
      vendorProfile,
    };
  }

  async suspendUser(userId: string, reason: string, suspendedBy: string) {
    const user = await this.getUserDetails(userId);

    if (!user.isActive) {
      throw new BadRequestException('User is already suspended');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // TODO: Log admin action
    // await this.logAdminAction('USER_SUSPENDED', userId, suspendedBy, reason);

    return {
      ...updated,
      message: 'User suspended successfully',
    };
  }

  async reactivateUser(userId: string, reactivatedBy: string) {
    const user = await this.getUserDetails(userId);

    if (user.isActive) {
      throw new BadRequestException('User is already active');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    // TODO: Log admin action
    // await this.logAdminAction('USER_REACTIVATED', userId, reactivatedBy);

    return {
      ...updated,
      message: 'User reactivated successfully',
    };
  }

  async deleteUser(userId: string, deletedBy: string) {
    const user = await this.getUserDetails(userId);

    // Soft delete by marking as inactive and adding deletion timestamp
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        email: `deleted_${Date.now()}_${user.email}`, // Prevent email conflicts
      },
    });

    // TODO: Log admin action
    // await this.logAdminAction('USER_DELETED', userId, deletedBy);

    return {
      message: 'User deleted successfully',
    };
  }

  async updateUserRole(userId: string, role: 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'SUPER_ADMIN', updatedBy: string) {
    const user = await this.getUserDetails(userId);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    // TODO: Log admin action
    // await this.logAdminAction('USER_ROLE_UPDATED', userId, updatedBy, `Role changed to ${role}`);

    return {
      ...updated,
      message: 'User role updated successfully',
    };
  }

  // ==================== USER STATISTICS ====================

  async getUserStats() {
    const [total, active, suspended, verified, vendors, customers, admins] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: false } }),
      this.prisma.user.count({ where: { emailVerified: true } }),
      this.prisma.user.count({ where: { role: 'VENDOR' } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRegistrations = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    return {
      overview: {
        total,
        active,
        suspended,
        verified,
        recentRegistrations,
      },
      byRole: {
        vendors,
        customers,
        admins,
      },
    };
  }

  async getUserGrowth(period: 'daily' | 'weekly' | 'monthly' = 'daily', days = 30) {
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
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const growth: Record<string, { customers: number; vendors: number; total: number }> = {};

    users.forEach((user) => {
      const dateKey = user.createdAt.toISOString().split('T')[0];

      if (!growth[dateKey]) {
        growth[dateKey] = { customers: 0, vendors: 0, total: 0 };
      }

      growth[dateKey].total++;
      if (user.role === 'CUSTOMER') growth[dateKey].customers++;
      if (user.role === 'VENDOR') growth[dateKey].vendors++;
    });

    return {
      period,
      days,
      data: Object.entries(growth).map(([date, counts]) => ({
        date,
        ...counts,
      })),
    };
  }

  async getActiveUsers(minutes = 60) {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

    const activeUsers = await this.prisma.user.count({
      where: {
        lastLoginAt: {
          gte: cutoffTime,
        },
      },
    });

    return {
      activeUsers,
      timeWindow: `${minutes} minutes`,
    };
  }
}
