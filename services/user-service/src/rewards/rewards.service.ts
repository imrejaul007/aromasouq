import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CoinType,
  CoinTransactionType,
  CoinEarnReason,
  CoinRedemptionType,
  CoinTransactionStatus,
} from '@prisma/client';

@Injectable()
export class RewardsService {
  constructor(private prisma: PrismaService) {}

  // ==================== WALLET MANAGEMENT ====================

  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.coinWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.coinWallet.create({
        data: { userId },
      });
    }

    return wallet;
  }

  async getWallet(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    // Get branded coin breakdown
    const brandedBreakdown = await this.prisma.brandedCoinBalance.findMany({
      where: { userId },
      orderBy: { balance: 'desc' },
    });

    return {
      ...wallet,
      cashbackBalanceAED: (wallet.cashbackBalance / 100).toFixed(2),
      lifetimeCashbackEarnedAED: (wallet.lifetimeCashbackEarned / 100).toFixed(2),
      brandedBreakdown,
    };
  }

  async getBrandedCoins(userId: string) {
    return this.prisma.brandedCoinBalance.findMany({
      where: { userId },
      orderBy: { balance: 'desc' },
    });
  }

  // ==================== EARNING COINS ====================

  async earnCoins(params: {
    userId: string;
    coinType: CoinType;
    amount: number;
    reason: CoinEarnReason;
    brandId?: string;
    brandName?: string;
    brandSlug?: string;
    orderId?: string;
    productId?: string;
    reviewId?: string;
    referralId?: string;
    campaignId?: string;
    description: string;
    expiresInDays?: number;
    metadata?: any;
  }) {
    const {
      userId,
      coinType,
      amount,
      reason,
      brandId,
      brandName,
      brandSlug,
      orderId,
      productId,
      reviewId,
      referralId,
      campaignId,
      description,
      expiresInDays,
      metadata,
    } = params;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    // Get wallet
    const wallet = await this.getOrCreateWallet(userId);

    // Calculate expiry date
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Get current balance for the coin type
    let balanceBefore = 0;
    let fieldToUpdate = '';

    switch (coinType) {
      case 'BRANDED':
        balanceBefore = wallet.brandedCoins;
        fieldToUpdate = 'brandedCoins';
        break;
      case 'UNIVERSAL':
        balanceBefore = wallet.universalCoins;
        fieldToUpdate = 'universalCoins';
        break;
      case 'PROMO':
        balanceBefore = wallet.promoCoins;
        fieldToUpdate = 'promoCoins';
        break;
    }

    const balanceAfter = balanceBefore + amount;

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.coinTransaction.create({
        data: {
          userId,
          type: CoinTransactionType.EARN,
          coinType,
          amount,
          brandId,
          brandName,
          reason,
          orderId,
          productId,
          reviewId,
          referralId,
          campaignId,
          balanceBefore,
          balanceAfter,
          description,
          expiresAt,
          metadata,
          status: CoinTransactionStatus.COMPLETED,
        },
      });

      // Update wallet
      const updatedWallet = await tx.coinWallet.update({
        where: { userId },
        data: {
          [fieldToUpdate]: balanceAfter,
          totalCoinsEarned: { increment: amount },
        },
      });

      // If branded coins, update/create branded balance
      if (coinType === 'BRANDED' && brandId && brandName && brandSlug) {
        await tx.brandedCoinBalance.upsert({
          where: {
            userId_brandId: {
              userId,
              brandId,
            },
          },
          create: {
            userId,
            brandId,
            brandName,
            brandSlug,
            balance: amount,
            lifetimeEarned: amount,
            expiresAt,
          },
          update: {
            balance: { increment: amount },
            lifetimeEarned: { increment: amount },
            expiresAt, // Update expiry to the latest
          },
        });
      }

      return { transaction, wallet: updatedWallet };
    });

    return result;
  }

  // ==================== REDEEMING COINS ====================

  async redeemCoins(params: {
    userId: string;
    coinType: CoinType;
    amount: number;
    redemptionType: CoinRedemptionType;
    orderId?: string;
    brandId?: string;
    description: string;
    metadata?: any;
  }) {
    const {
      userId,
      coinType,
      amount,
      redemptionType,
      orderId,
      brandId,
      description,
      metadata,
    } = params;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    // Get wallet
    const wallet = await this.getOrCreateWallet(userId);

    // Check balance
    let balanceBefore = 0;
    let fieldToUpdate = '';

    switch (coinType) {
      case 'BRANDED':
        balanceBefore = wallet.brandedCoins;
        fieldToUpdate = 'brandedCoins';

        // For branded coins, also check the specific brand balance
        if (brandId) {
          const brandBalance = await this.prisma.brandedCoinBalance.findUnique({
            where: { userId_brandId: { userId, brandId } },
          });

          if (!brandBalance || brandBalance.balance < amount) {
            throw new BadRequestException(
              `Insufficient branded coins for this brand. Available: ${brandBalance?.balance || 0}`,
            );
          }
        }
        break;
      case 'UNIVERSAL':
        balanceBefore = wallet.universalCoins;
        fieldToUpdate = 'universalCoins';
        break;
      case 'PROMO':
        balanceBefore = wallet.promoCoins;
        fieldToUpdate = 'promoCoins';
        break;
    }

    if (balanceBefore < amount) {
      throw new BadRequestException(
        `Insufficient ${coinType.toLowerCase()} coins. Available: ${balanceBefore}, Required: ${amount}`,
      );
    }

    const balanceAfter = balanceBefore - amount;

    // Use transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.coinTransaction.create({
        data: {
          userId,
          type: CoinTransactionType.REDEEM,
          coinType,
          amount: -amount, // Negative for redemption
          brandId,
          redemptionType,
          orderId,
          balanceBefore,
          balanceAfter,
          description,
          metadata,
          status: CoinTransactionStatus.COMPLETED,
        },
      });

      // Update wallet
      const updatedWallet = await tx.coinWallet.update({
        where: { userId },
        data: {
          [fieldToUpdate]: balanceAfter,
          totalCoinsRedeemed: { increment: amount },
        },
      });

      // If branded coins, update branded balance
      if (coinType === 'BRANDED' && brandId) {
        const brandBalance = await tx.brandedCoinBalance.findUnique({
          where: { userId_brandId: { userId, brandId } },
        });

        if (brandBalance) {
          await tx.brandedCoinBalance.update({
            where: { userId_brandId: { userId, brandId } },
            data: {
              balance: { decrement: amount },
              lifetimeRedeemed: { increment: amount },
            },
          });
        }
      }

      return { transaction, wallet: updatedWallet };
    });

    return result;
  }

  // ==================== CHECK REDEMPTION ====================

  async checkRedemption(params: {
    userId: string;
    coinType: CoinType;
    amount: number;
    brandId?: string;
  }) {
    const { userId, coinType, amount, brandId } = params;

    const wallet = await this.getOrCreateWallet(userId);

    let available = 0;
    let canRedeem = false;

    switch (coinType) {
      case 'BRANDED':
        if (brandId) {
          const brandBalance = await this.prisma.brandedCoinBalance.findUnique({
            where: { userId_brandId: { userId, brandId } },
          });
          available = brandBalance?.balance || 0;
        } else {
          available = wallet.brandedCoins;
        }
        break;
      case 'UNIVERSAL':
        available = wallet.universalCoins;
        break;
      case 'PROMO':
        available = wallet.promoCoins;
        break;
    }

    canRedeem = available >= amount;

    return {
      canRedeem,
      available,
      required: amount,
      shortage: canRedeem ? 0 : amount - available,
    };
  }

  // ==================== TRANSACTIONS ====================

  async getCoinTransactions(
    userId: string,
    options: {
      coinType?: CoinType;
      type?: CoinTransactionType;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { coinType, type, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (coinType) where.coinType = coinType;
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      this.prisma.coinTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.coinTransaction.count({ where }),
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

  async getTransactionById(userId: string, transactionId: string) {
    const transaction = await this.prisma.coinTransaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  // ==================== EXPIRY MANAGEMENT ====================

  async expireCoins() {
    const now = new Date();

    // Find all expired transactions that haven't been processed
    const expiredTransactions = await this.prisma.coinTransaction.findMany({
      where: {
        expiresAt: { lte: now },
        type: CoinTransactionType.EARN,
        status: CoinTransactionStatus.COMPLETED,
      },
    });

    const results = [];

    for (const txn of expiredTransactions) {
      try {
        // Get current wallet
        const wallet = await this.prisma.coinWallet.findUnique({
          where: { userId: txn.userId },
        });

        if (!wallet) continue;

        let fieldToUpdate = '';
        let currentBalance = 0;

        switch (txn.coinType) {
          case 'BRANDED':
            fieldToUpdate = 'brandedCoins';
            currentBalance = wallet.brandedCoins;
            break;
          case 'UNIVERSAL':
            fieldToUpdate = 'universalCoins';
            currentBalance = wallet.universalCoins;
            break;
          case 'PROMO':
            fieldToUpdate = 'promoCoins';
            currentBalance = wallet.promoCoins;
            break;
        }

        // Deduct expired amount (but not more than current balance)
        const amountToDeduct = Math.min(txn.amount, currentBalance);

        if (amountToDeduct > 0) {
          await this.prisma.$transaction(async (tx) => {
            // Create EXPIRE transaction
            await tx.coinTransaction.create({
              data: {
                userId: txn.userId,
                type: CoinTransactionType.EXPIRE,
                coinType: txn.coinType,
                amount: -amountToDeduct,
                brandId: txn.brandId,
                brandName: txn.brandName,
                balanceBefore: currentBalance,
                balanceAfter: currentBalance - amountToDeduct,
                description: `Expired coins from transaction ${txn.id}`,
                status: CoinTransactionStatus.COMPLETED,
              },
            });

            // Update wallet
            await tx.coinWallet.update({
              where: { userId: txn.userId },
              data: {
                [fieldToUpdate]: { decrement: amountToDeduct },
              },
            });

            // If branded, update brand balance
            if (txn.coinType === 'BRANDED' && txn.brandId) {
              const brandBalance = await tx.brandedCoinBalance.findUnique({
                where: {
                  userId_brandId: {
                    userId: txn.userId,
                    brandId: txn.brandId,
                  },
                },
              });

              if (brandBalance && brandBalance.balance >= amountToDeduct) {
                await tx.brandedCoinBalance.update({
                  where: {
                    userId_brandId: {
                      userId: txn.userId,
                      brandId: txn.brandId,
                    },
                  },
                  data: {
                    balance: { decrement: amountToDeduct },
                  },
                });
              }
            }

            // Mark original transaction as expired
            await tx.coinTransaction.update({
              where: { id: txn.id },
              data: { status: CoinTransactionStatus.EXPIRED },
            });
          });

          results.push({
            userId: txn.userId,
            amount: amountToDeduct,
            coinType: txn.coinType,
          });
        }
      } catch (error) {
        console.error(`Error expiring coins for transaction ${txn.id}:`, error);
      }
    }

    return {
      expired: results.length,
      details: results,
    };
  }

  // ==================== BULK OPERATIONS (ADMIN) ====================

  async bulkEarnCoins(
    awards: Array<{
      userId: string;
      coinType: CoinType;
      amount: number;
      reason: CoinEarnReason;
      description: string;
    }>,
  ) {
    const results = [];

    for (const award of awards) {
      try {
        const result = await this.earnCoins(award);
        results.push({ success: true, userId: award.userId, result });
      } catch (error) {
        results.push({
          success: false,
          userId: award.userId,
          error: error.message,
        });
      }
    }

    return results;
  }
}
