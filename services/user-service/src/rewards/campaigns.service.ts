import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignType, CoinType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  // ==================== CAMPAIGN CRUD ====================

  async createCampaign(data: {
    name: string;
    description: string;
    type: CampaignType;
    coinType: CoinType;
    coinAmount?: number;
    cashbackRate?: number;
    minPurchaseAmount?: number;
    brandIds?: string[];
    productIds?: string[];
    userSegment?: string;
    startDate: Date;
    endDate: Date;
    maxRedemptions?: number;
    maxRedemptionsPerUser?: number;
  }) {
    const {
      name,
      description,
      type,
      coinType,
      coinAmount,
      cashbackRate,
      minPurchaseAmount,
      brandIds = [],
      productIds = [],
      userSegment,
      startDate,
      endDate,
      maxRedemptions,
      maxRedemptionsPerUser = 1,
    } = data;

    // Validation
    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (!coinAmount && !cashbackRate) {
      throw new BadRequestException('Either coinAmount or cashbackRate must be provided');
    }

    if (cashbackRate && (cashbackRate < 0 || cashbackRate > 100)) {
      throw new BadRequestException('Cashback rate must be between 0 and 100');
    }

    // Create campaign
    const campaign = await this.prisma.rewardCampaign.create({
      data: {
        name,
        description,
        type,
        coinType,
        coinAmount,
        cashbackRate: cashbackRate ? new Decimal(cashbackRate) : null,
        minPurchaseAmount: minPurchaseAmount ? new Decimal(minPurchaseAmount) : null,
        brandIds,
        productIds,
        userSegment,
        startDate,
        endDate,
        maxRedemptions,
        maxRedemptionsPerUser,
        isActive: true,
      },
    });

    return campaign;
  }

  async getCampaigns(options: {
    type?: CampaignType;
    isActive?: boolean;
    includeExpired?: boolean;
    page?: number;
    limit?: number;
  } = {}) {
    const { type, isActive, includeExpired = false, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;
    if (!includeExpired) {
      where.endDate = { gte: new Date() };
    }

    const [campaigns, total] = await Promise.all([
      this.prisma.rewardCampaign.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.rewardCampaign.count({ where }),
    ]);

    return {
      data: campaigns.map((campaign) => ({
        ...campaign,
        cashbackRate: campaign.cashbackRate?.toFixed(2),
        minPurchaseAmount: campaign.minPurchaseAmount?.toFixed(2),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getActiveCampaigns(type?: CampaignType) {
    const now = new Date();
    const where: any = {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (type) where.type = type;

    const campaigns = await this.prisma.rewardCampaign.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });

    return campaigns.map((campaign) => ({
      ...campaign,
      cashbackRate: campaign.cashbackRate?.toFixed(2),
      minPurchaseAmount: campaign.minPurchaseAmount?.toFixed(2),
    }));
  }

  async getCampaignById(id: string) {
    const campaign = await this.prisma.rewardCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return {
      ...campaign,
      cashbackRate: campaign.cashbackRate?.toFixed(2),
      minPurchaseAmount: campaign.minPurchaseAmount?.toFixed(2),
    };
  }

  async updateCampaign(
    id: string,
    data: {
      name?: string;
      description?: string;
      coinAmount?: number;
      cashbackRate?: number;
      minPurchaseAmount?: number;
      brandIds?: string[];
      productIds?: string[];
      userSegment?: string;
      startDate?: Date;
      endDate?: Date;
      maxRedemptions?: number;
      maxRedemptionsPerUser?: number;
      isActive?: boolean;
    },
  ) {
    const campaign = await this.getCampaignById(id);

    const {
      name,
      description,
      coinAmount,
      cashbackRate,
      minPurchaseAmount,
      brandIds,
      productIds,
      userSegment,
      startDate,
      endDate,
      maxRedemptions,
      maxRedemptionsPerUser,
      isActive,
    } = data;

    // Validation
    if (startDate && endDate && startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (cashbackRate !== undefined && (cashbackRate < 0 || cashbackRate > 100)) {
      throw new BadRequestException('Cashback rate must be between 0 and 100');
    }

    const updated = await this.prisma.rewardCampaign.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(coinAmount !== undefined && { coinAmount }),
        ...(cashbackRate !== undefined && { cashbackRate: new Decimal(cashbackRate) }),
        ...(minPurchaseAmount !== undefined && {
          minPurchaseAmount: new Decimal(minPurchaseAmount),
        }),
        ...(brandIds && { brandIds }),
        ...(productIds && { productIds }),
        ...(userSegment && { userSegment }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(maxRedemptions !== undefined && { maxRedemptions }),
        ...(maxRedemptionsPerUser !== undefined && { maxRedemptionsPerUser }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return {
      ...updated,
      cashbackRate: updated.cashbackRate?.toFixed(2),
      minPurchaseAmount: updated.minPurchaseAmount?.toFixed(2),
    };
  }

  async deleteCampaign(id: string) {
    await this.getCampaignById(id);

    await this.prisma.rewardCampaign.delete({
      where: { id },
    });

    return { message: 'Campaign deleted successfully' };
  }

  async deactivateCampaign(id: string) {
    return this.updateCampaign(id, { isActive: false });
  }

  // ==================== ELIGIBILITY & APPLICATION ====================

  async checkEligibility(userId: string, campaignId: string, orderData?: any) {
    const campaign = await this.getCampaignById(campaignId);

    // Check if campaign is active and within date range
    const now = new Date();
    if (!campaign.isActive) {
      return {
        eligible: false,
        reason: 'Campaign is not active',
      };
    }

    if (now < campaign.startDate || now > campaign.endDate) {
      return {
        eligible: false,
        reason: 'Campaign is not currently running',
      };
    }

    // Check max redemptions
    if (campaign.maxRedemptions && campaign.totalRedemptions >= campaign.maxRedemptions) {
      return {
        eligible: false,
        reason: 'Campaign has reached maximum redemptions',
      };
    }

    // Check user redemption count
    const userRedemptions = await this.prisma.coinTransaction.count({
      where: {
        userId,
        campaignId,
      },
    });

    if (
      campaign.maxRedemptionsPerUser &&
      userRedemptions >= campaign.maxRedemptionsPerUser
    ) {
      return {
        eligible: false,
        reason: 'You have reached the maximum redemptions for this campaign',
      };
    }

    // Check minimum purchase amount (if orderData provided)
    if (orderData && campaign.minPurchaseAmount) {
      const orderTotal = new Decimal(orderData.total || 0);
      if (orderTotal.lessThan(campaign.minPurchaseAmount)) {
        return {
          eligible: false,
          reason: `Minimum purchase amount is ${campaign.minPurchaseAmount} AED`,
        };
      }
    }

    // Check brand/product restrictions (if orderData provided)
    if (orderData) {
      if (campaign.brandIds.length > 0) {
        const orderBrands = orderData.items?.map((item: any) => item.brandId) || [];
        const hasMatchingBrand = orderBrands.some((brandId: string) =>
          campaign.brandIds.includes(brandId),
        );
        if (!hasMatchingBrand) {
          return {
            eligible: false,
            reason: 'This campaign is only valid for specific brands',
          };
        }
      }

      if (campaign.productIds.length > 0) {
        const orderProducts = orderData.items?.map((item: any) => item.productId) || [];
        const hasMatchingProduct = orderProducts.some((productId: string) =>
          campaign.productIds.includes(productId),
        );
        if (!hasMatchingProduct) {
          return {
            eligible: false,
            reason: 'This campaign is only valid for specific products',
          };
        }
      }
    }

    // Check user segment (simplified - in production, implement proper segmentation)
    if (campaign.userSegment) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return {
          eligible: false,
          reason: 'User not found',
        };
      }

      // Example segmentation logic
      if (campaign.userSegment === 'new' && user.totalOrders > 0) {
        return {
          eligible: false,
          reason: 'This campaign is only for new users',
        };
      }

      if (campaign.userSegment === 'vip' && user.totalSpent.lessThan(new Decimal(1000))) {
        return {
          eligible: false,
          reason: 'This campaign is only for VIP users',
        };
      }
    }

    return {
      eligible: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        coinType: campaign.coinType,
        coinAmount: campaign.coinAmount,
        cashbackRate: campaign.cashbackRate,
      },
    };
  }

  async getEligibleCampaigns(userId: string, orderData?: any) {
    const activeCampaigns = await this.getActiveCampaigns();
    const eligibleCampaigns = [];

    for (const campaign of activeCampaigns) {
      const eligibility = await this.checkEligibility(userId, campaign.id, orderData);
      if (eligibility.eligible) {
        eligibleCampaigns.push({
          ...campaign,
          eligibility,
        });
      }
    }

    return eligibleCampaigns;
  }

  async applyCampaign(userId: string, campaignId: string, orderData?: any) {
    // Check eligibility
    const eligibility = await this.checkEligibility(userId, campaignId, orderData);

    if (!eligibility.eligible) {
      throw new BadRequestException(eligibility.reason);
    }

    const campaign = await this.getCampaignById(campaignId);

    // Calculate reward
    let rewardAmount = 0;
    if (campaign.coinAmount) {
      rewardAmount = campaign.coinAmount;
    } else if (campaign.cashbackRate && orderData) {
      const orderTotal = new Decimal(orderData.total || 0);
      rewardAmount = orderTotal
        .mul(campaign.cashbackRate)
        .div(100)
        .toNumber();
    }

    if (rewardAmount <= 0) {
      throw new BadRequestException('Invalid reward amount');
    }

    // Update campaign redemption count
    await this.prisma.rewardCampaign.update({
      where: { id: campaignId },
      data: {
        totalRedemptions: { increment: 1 },
      },
    });

    return {
      campaignId,
      campaignName: campaign.name,
      coinType: campaign.coinType,
      rewardAmount,
      message: `Campaign "${campaign.name}" applied successfully`,
    };
  }

  // ==================== STATS ====================

  async getCampaignStats(campaignId: string) {
    const campaign = await this.getCampaignById(campaignId);

    // Get total transactions for this campaign
    const transactions = await this.prisma.coinTransaction.findMany({
      where: { campaignId },
    });

    const totalCoinsAwarded = transactions.reduce((sum, txn) => sum + txn.amount, 0);
    const uniqueUsers = new Set(transactions.map((txn) => txn.userId)).size;

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        isActive: campaign.isActive,
      },
      stats: {
        totalRedemptions: campaign.totalRedemptions,
        totalCoinsAwarded,
        uniqueUsers,
        averageCoinsPerUser: uniqueUsers > 0 ? totalCoinsAwarded / uniqueUsers : 0,
        remainingRedemptions: campaign.maxRedemptions
          ? campaign.maxRedemptions - campaign.totalRedemptions
          : null,
      },
    };
  }
}
