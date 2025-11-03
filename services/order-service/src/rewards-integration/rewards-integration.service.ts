import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RewardsIntegrationService {
  private readonly logger = new Logger(RewardsIntegrationService.name);
  private readonly rewardsServiceUrl = process.env.REWARDS_SERVICE_URL || 'http://localhost:3100/api';

  constructor(private httpService: HttpService) {}

  // ==================== EARN COINS ON ORDER ====================

  async earnCoinsOnOrder(params: {
    userId: string;
    orderId: string;
    orderNumber: string;
    orderTotal: number;
    items: Array<{
      productId: string;
      productName: string;
      brandId: string;
      brandName: string;
      brandSlug: string;
      subtotal: number;
    }>;
  }) {
    const { userId, orderId, orderNumber, orderTotal, items } = params;

    try {
      // 1. Earn Branded Coins (20% of item subtotal for each brand)
      for (const item of items) {
        const brandedCoins = Math.floor(item.subtotal * 0.20 * 10); // 20% as coins (10 coins = 1 AED)

        await firstValueFrom(
          this.httpService.post(`${this.rewardsServiceUrl}/rewards/coins/earn`, {
            userId,
            coinType: 'BRANDED',
            amount: brandedCoins,
            reason: 'PURCHASE',
            brandId: item.brandId,
            brandName: item.brandName,
            brandSlug: item.brandSlug,
            orderId,
            productId: item.productId,
            description: `Earned ${brandedCoins} ${item.brandName} coins from order ${orderNumber}`,
            expiresInDays: 90, // Branded coins expire in 90 days
          }),
        );

        this.logger.log(
          `Awarded ${brandedCoins} branded coins to user ${userId} for ${item.brandName}`,
        );
      }

      // 2. Earn Universal Coins (2% of total order)
      const universalCoins = Math.floor(orderTotal * 0.02 * 10); // 2% as universal coins

      await firstValueFrom(
        this.httpService.post(`${this.rewardsServiceUrl}/rewards/coins/earn`, {
          userId,
          coinType: 'UNIVERSAL',
          amount: universalCoins,
          reason: 'PURCHASE',
          orderId,
          description: `Earned ${universalCoins} universal coins from order ${orderNumber}`,
          // Universal coins don't expire
        }),
      );

      this.logger.log(`Awarded ${universalCoins} universal coins to user ${userId}`);

      return {
        success: true,
        brandedCoins: items.reduce((sum, item) => sum + Math.floor(item.subtotal * 0.20 * 10), 0),
        universalCoins,
      };
    } catch (error) {
      this.logger.error(`Failed to award coins for order ${orderId}:`, error.message);
      // Don't throw - rewards failure shouldn't block order creation
      return { success: false, error: error.message };
    }
  }

  // ==================== EARN CASHBACK ON ORDER ====================

  async earnCashbackOnOrder(params: {
    userId: string;
    orderId: string;
    orderNumber: string;
    items: Array<{
      productId: string;
      productName: string;
      cashbackRate: number; // Percentage (e.g., 5.0 for 5%)
      subtotal: number;
    }>;
  }) {
    const { userId, orderId, orderNumber, items } = params;

    try {
      // Create pending cashback for each item with cashback rate > 0
      for (const item of items) {
        if (item.cashbackRate > 0) {
          const cashbackAmount = Math.floor(item.subtotal * (item.cashbackRate / 100) * 100); // In Fils

          if (cashbackAmount > 0) {
            await firstValueFrom(
              this.httpService.post(`${this.rewardsServiceUrl}/cashback/earn`, {
                userId,
                amount: cashbackAmount,
                orderId,
                orderNumber,
                productId: item.productId,
                productName: item.productName,
                cashbackRate: item.cashbackRate,
                description: `${item.cashbackRate}% cashback on ${item.productName}`,
                pendingDays: 7, // Cashback pending for 7 days (until order is delivered)
              }),
            );

            this.logger.log(
              `Created pending cashback of ${cashbackAmount} Fils for user ${userId} on ${item.productName}`,
            );
          }
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to create cashback for order ${orderId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // ==================== CREDIT CASHBACK ON DELIVERY ====================

  async creditCashbackOnDelivery(orderId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.rewardsServiceUrl}/cashback/credit/order/${orderId}`),
      );

      this.logger.log(`Credited cashback for order ${orderId}: ${JSON.stringify(response.data)}`);
      return { success: true, ...response.data };
    } catch (error) {
      this.logger.error(`Failed to credit cashback for order ${orderId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // ==================== CANCEL CASHBACK ON ORDER CANCEL ====================

  async cancelCashbackOnOrderCancel(orderId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.rewardsServiceUrl}/cashback/cancel/order/${orderId}`),
      );

      this.logger.log(`Cancelled cashback for order ${orderId}: ${JSON.stringify(response.data)}`);
      return { success: true, ...response.data };
    } catch (error) {
      this.logger.error(`Failed to cancel cashback for order ${orderId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // ==================== CHECK COIN REDEMPTION ELIGIBILITY ====================

  async checkCoinRedemption(params: {
    userId: string;
    coinType: 'BRANDED' | 'UNIVERSAL' | 'PROMO';
    amount: number;
    brandId?: string;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.rewardsServiceUrl}/rewards/coins/check-redemption`, params),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to check coin redemption:', error.message);
      return { canRedeem: false, error: error.message };
    }
  }

  // ==================== REDEEM COINS ON ORDER ====================

  async redeemCoinsOnOrder(params: {
    userId: string;
    coinType: 'BRANDED' | 'UNIVERSAL' | 'PROMO';
    amount: number;
    redemptionType: 'DISCOUNT' | 'FREE_PRODUCT' | 'FREE_SHIPPING';
    orderId: string;
    brandId?: string;
    description: string;
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.rewardsServiceUrl}/rewards/coins/redeem`, params),
      );

      this.logger.log(`Redeemed ${params.amount} ${params.coinType} coins for user ${params.userId}`);
      return { success: true, ...response.data };
    } catch (error) {
      this.logger.error('Failed to redeem coins:', error.message);
      throw error; // Throw here because redemption failure should block order
    }
  }

  // ==================== GET USER WALLET ====================

  async getUserWallet(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.rewardsServiceUrl}/rewards/wallet/${userId}`),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get wallet for user ${userId}:`, error.message);
      return null;
    }
  }

  // ==================== CHECK CAMPAIGN ELIGIBILITY ====================

  async checkCampaignEligibility(params: {
    userId: string;
    campaignId: string;
    orderData?: {
      total: number;
      items: Array<{
        productId: string;
        brandId: string;
      }>;
    };
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.rewardsServiceUrl}/campaigns/check-eligibility`, params),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to check campaign eligibility:', error.message);
      return { eligible: false, error: error.message };
    }
  }

  // ==================== APPLY CAMPAIGN ON ORDER ====================

  async applyCampaignOnOrder(params: {
    userId: string;
    campaignId: string;
    orderData?: {
      total: number;
      items: Array<{
        productId: string;
        brandId: string;
      }>;
    };
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.rewardsServiceUrl}/campaigns/apply`, params),
      );

      this.logger.log(`Applied campaign ${params.campaignId} for user ${params.userId}`);
      return { success: true, ...response.data };
    } catch (error) {
      this.logger.error('Failed to apply campaign:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ==================== GET ELIGIBLE CAMPAIGNS ====================

  async getEligibleCampaigns(userId: string, orderData?: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.rewardsServiceUrl}/campaigns/eligible/${userId}`, orderData),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get eligible campaigns:', error.message);
      return [];
    }
  }
}
