import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(userId: string, updateData: any) {
    // Remove sensitive fields that shouldn't be updated this way
    const { password, email, role, walletBalance, totalSpent, totalOrders, ...safeUpdateData } = updateData;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: safeUpdateData,
    });

    const { password: pwd, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify old password
    const passwordValid = await bcrypt.compare(oldPassword, user.password);

    if (!passwordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = this.config.get<number>('BCRYPT_SALT_ROUNDS') || 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    return { message: 'Password changed successfully. Please log in again.' };
  }

  async deleteAccount(userId: string) {
    // Soft delete (set deletedAt timestamp)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    return { message: 'Account deleted successfully' };
  }

  // Address management
  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async createAddress(userId: string, addressData: any) {
    // If this is set as default, unset other default addresses
    if (addressData.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        ...addressData,
        userId,
      },
    });
  }

  async updateAddress(userId: string, addressId: string, addressData: any) {
    // Verify address belongs to user
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // If setting as default, unset other default addresses
    if (addressData.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: addressData,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    // Verify address belongs to user
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return { message: 'Address deleted successfully' };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    // Verify address belongs to user
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Unset all default addresses
    await this.prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Set this address as default
    return this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }

  // Wallet management
  async getWalletBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletBalance: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      balance: user.walletBalance,
      currency: 'AED',
    };
  }

  async getWalletTransactions(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({
        where: { userId },
      }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
