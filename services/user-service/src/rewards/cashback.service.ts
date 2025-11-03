import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CashbackType, CashbackStatus, TransactionType, TransactionReason, TransactionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CashbackService {
  constructor(private prisma: PrismaService) {}

  // ==================== EARNING CASHBACK ====================

  async earnCashback(params: {
    userId: string;
    amount: number; // In Fils
    orderId?: string;
    orderNumber?: string;
    productId?: string;
    productName?: string;
    cashbackRate?: number;
    description: string;
    pendingDays?: number;
  }) {
    const {
      userId,
      amount,
      orderId,
      orderNumber,
      productId,
      productName,
      cashbackRate,
      description,
      pendingDays = 7,
    } = params;

    if (amount <= 0) {
      throw new BadRequestException('Cashback amount must be positive');
    }

    // Get or create wallet
    let wallet = await this.prisma.coinWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.coinWallet.create({
        data: { userId },
      });
    }

    const balanceBefore = wallet.cashbackBalance;
    const amountAED = new Decimal(amount / 100);

    // Calculate pending until date
    const pendingUntil = new Date(Date.now() + pendingDays * 24 * 60 * 60 * 1000);

    // Create cashback transaction (PENDING status)
    const transaction = await this.prisma.cashbackTransaction.create({
      data: {
        userId,
        type: CashbackType.EARN,
        amount,
        amountAED,
        orderId,
        orderNumber,
        productId,
        productName,
        cashbackRate: cashbackRate ? new Decimal(cashbackRate) : null,
        balanceBefore,
        balanceAfter: balanceBefore, // Not credited yet
        description,
        status: CashbackStatus.PENDING,
        pendingUntil,
      },
    });

    return {
      transaction,
      message: `Cashback of ${amountAED.toFixed(2)} AED is pending. Will be credited after order delivery.`,
    };
  }

  // ==================== CREDIT PENDING CASHBACK ====================

  async creditCashback(transactionId: string) {
    const transaction = await this.prisma.cashbackTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Cashback transaction not found');
    }

    if (transaction.status !== CashbackStatus.PENDING) {
      throw new BadRequestException(`Cashback is already ${transaction.status.toLowerCase()}`);
    }

    // Get wallet
    const wallet = await this.prisma.coinWallet.findUnique({
      where: { userId: transaction.userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const balanceBefore = wallet.cashbackBalance;
    const balanceAfter = balanceBefore + transaction.amount;

    // Update transaction and wallet in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update cashback transaction
      const updatedTransaction = await tx.cashbackTransaction.update({
        where: { id: transactionId },
        data: {
          status: CashbackStatus.CREDITED,
          balanceAfter,
          creditedAt: new Date(),
        },
      });

      // Update wallet
      const updatedWallet = await tx.coinWallet.update({
        where: { userId: transaction.userId },
        data: {
          cashbackBalance: balanceAfter,
          lifetimeCashbackEarned: { increment: transaction.amount },
        },
      });

      return { transaction: updatedTransaction, wallet: updatedWallet };
    });

    return result;
  }

  // ==================== CREDIT BY ORDER ID ====================

  async creditCashbackByOrderId(orderId: string) {
    // Find all pending cashback for this order
    const pendingCashbacks = await this.prisma.cashbackTransaction.findMany({
      where: {
        orderId,
        status: CashbackStatus.PENDING,
      },
    });

    if (pendingCashbacks.length === 0) {
      return { credited: 0, message: 'No pending cashback found for this order' };
    }

    const results = [];

    for (const cashback of pendingCashbacks) {
      try {
        const result = await this.creditCashback(cashback.id);
        results.push({ success: true, transactionId: cashback.id, result });
      } catch (error) {
        results.push({
          success: false,
          transactionId: cashback.id,
          error: error.message,
        });
      }
    }

    return {
      credited: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      details: results,
    };
  }

  // ==================== REDEEM CASHBACK TO WALLET ====================

  async redeemCashback(userId: string, amount: number) {
    if (amount < 1000) {
      // Minimum 10 AED
      throw new BadRequestException('Minimum cashback redemption is 10 AED (1000 Fils)');
    }

    // Get wallet
    const wallet = await this.prisma.coinWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.cashbackBalance < amount) {
      throw new BadRequestException(
        `Insufficient cashback balance. Available: ${(wallet.cashbackBalance / 100).toFixed(2)} AED`,
      );
    }

    const balanceBefore = wallet.cashbackBalance;
    const balanceAfter = balanceBefore - amount;
    const amountAED = new Decimal(amount / 100);

    // Get user for wallet balance
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userWalletBefore = user.walletBalance;
    const userWalletAfter = userWalletBefore.add(amountAED);

    // Use transaction for atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Create cashback transaction (REDEEM)
      const cashbackTransaction = await tx.cashbackTransaction.create({
        data: {
          userId,
          type: CashbackType.REDEEM,
          amount: -amount, // Negative for redemption
          amountAED: amountAED.neg(),
          balanceBefore,
          balanceAfter,
          description: `Redeemed ${amountAED.toFixed(2)} AED cashback to wallet`,
          status: CashbackStatus.REDEEMED,
        },
      });

      // Update coin wallet (cashback balance)
      await tx.coinWallet.update({
        where: { userId },
        data: {
          cashbackBalance: balanceAfter,
        },
      });

      // Create wallet transaction (credit to main wallet)
      const walletTransaction = await tx.walletTransaction.create({
        data: {
          userId,
          type: TransactionType.CREDIT,
          amount: amountAED,
          currency: 'AED',
          reason: TransactionReason.CASHBACK,
          balanceBefore: userWalletBefore,
          balanceAfter: userWalletAfter,
          status: TransactionStatus.COMPLETED,
          description: `Cashback redemption: ${amountAED.toFixed(2)} AED`,
        },
      });

      // Update user wallet balance
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: userWalletAfter,
        },
      });

      return { cashbackTransaction, walletTransaction };
    });

    return {
      ...result,
      message: `Successfully redeemed ${amountAED.toFixed(2)} AED to your wallet`,
      newCashbackBalance: (balanceAfter / 100).toFixed(2),
      newWalletBalance: userWalletAfter.toFixed(2),
    };
  }

  // ==================== CANCEL CASHBACK ====================

  async cancelCashback(transactionId: string) {
    const transaction = await this.prisma.cashbackTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Cashback transaction not found');
    }

    if (transaction.status !== CashbackStatus.PENDING) {
      throw new BadRequestException(
        `Cannot cancel cashback with status: ${transaction.status}`,
      );
    }

    // Update status to CANCELLED
    const updated = await this.prisma.cashbackTransaction.update({
      where: { id: transactionId },
      data: {
        status: CashbackStatus.CANCELLED,
      },
    });

    return updated;
  }

  // ==================== CANCEL BY ORDER ID ====================

  async cancelCashbackByOrderId(orderId: string) {
    const result = await this.prisma.cashbackTransaction.updateMany({
      where: {
        orderId,
        status: CashbackStatus.PENDING,
      },
      data: {
        status: CashbackStatus.CANCELLED,
      },
    });

    return {
      cancelled: result.count,
      message: `Cancelled ${result.count} pending cashback transaction(s)`,
    };
  }

  // ==================== GET CASHBACK TRANSACTIONS ====================

  async getCashbackTransactions(
    userId: string,
    options: {
      type?: CashbackType;
      status?: CashbackStatus;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { type, status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (type) where.type = type;
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      this.prisma.cashbackTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.cashbackTransaction.count({ where }),
    ]);

    return {
      data: transactions.map((txn) => ({
        ...txn,
        amountAED: txn.amountAED.toFixed(2),
        cashbackRate: txn.cashbackRate?.toFixed(2),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== GET PENDING CASHBACK ====================

  async getPendingCashback(userId: string) {
    const pending = await this.prisma.cashbackTransaction.findMany({
      where: {
        userId,
        status: CashbackStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalPending = pending.reduce((sum, txn) => sum + txn.amount, 0);

    return {
      transactions: pending.map((txn) => ({
        ...txn,
        amountAED: txn.amountAED.toFixed(2),
      })),
      totalPendingFils: totalPending,
      totalPendingAED: (totalPending / 100).toFixed(2),
      count: pending.length,
    };
  }

  // ==================== EXPIRE CASHBACK (CRON) ====================

  async expireCashback() {
    const now = new Date();

    // Find all pending cashback that has passed pendingUntil date
    const expired = await this.prisma.cashbackTransaction.updateMany({
      where: {
        status: CashbackStatus.PENDING,
        pendingUntil: { lte: now },
      },
      data: {
        status: CashbackStatus.EXPIRED,
      },
    });

    return {
      expired: expired.count,
      message: `Expired ${expired.count} pending cashback transaction(s)`,
    };
  }
}
