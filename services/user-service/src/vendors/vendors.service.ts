import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  VendorBusinessType,
  VendorVerificationStatus,
  VendorDocumentType,
  DocumentVerificationStatus,
} from '@prisma/client';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  // ==================== VENDOR REGISTRATION ====================

  async register(userId: string, data: any) {
    // Check if user exists and has VENDOR role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'VENDOR') {
      throw new BadRequestException('User must have VENDOR role to register as vendor');
    }

    // Check if vendor profile already exists
    const existingVendor = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (existingVendor) {
      throw new ConflictException('Vendor profile already exists');
    }

    // Check brand slug uniqueness
    const slugExists = await this.prisma.vendorProfile.findUnique({
      where: { brandSlug: data.brandSlug },
    });

    if (slugExists) {
      throw new ConflictException('Brand slug already taken');
    }

    // Check trade license uniqueness
    const licenseExists = await this.prisma.vendorProfile.findFirst({
      where: { tradeLicenseNumber: data.tradeLicenseNumber },
    });

    if (licenseExists) {
      throw new ConflictException('Trade license already registered');
    }

    // Create vendor profile
    const vendor = await this.prisma.vendorProfile.create({
      data: {
        userId,
        businessName: data.businessName,
        businessNameArabic: data.businessNameArabic,
        brandName: data.brandName,
        brandSlug: data.brandSlug,
        description: data.description,
        descriptionArabic: data.descriptionArabic,
        tradeLicenseNumber: data.tradeLicenseNumber,
        tradeLicenseExpiry: new Date(data.tradeLicenseExpiry),
        taxRegistrationNumber: data.taxRegistrationNumber,
        businessType: data.businessType as VendorBusinessType,
        categoryIds: data.categoryIds || [],
        businessEmail: data.businessEmail,
        businessPhone: data.businessPhone,
        whatsappNumber: data.whatsappNumber,
        businessAddress: data.businessAddress,
        warehouseAddress: data.warehouseAddress,
        bankName: data.bankName,
        bankAccountNumber: data.bankAccountNumber,
        bankAccountName: data.bankAccountName,
        iban: data.iban,
        swiftCode: data.swiftCode,
        logo: data.logo,
        banner: data.banner,
        galleries: data.galleries || [],
        verificationStatus: VendorVerificationStatus.PENDING,
        isActive: false,
      },
    });

    return {
      ...vendor,
      message: 'Vendor registration submitted successfully. Awaiting admin verification.',
    };
  }

  // ==================== VENDOR PROFILE ====================

  async getProfile(userId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return vendor;
  }

  async getProfileBySlug(brandSlug: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { brandSlug },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async updateProfile(userId: string, data: any) {
    const vendor = await this.getProfile(userId);

    // If changing brand slug, check uniqueness
    if (data.brandSlug && data.brandSlug !== vendor.brandSlug) {
      const slugExists = await this.prisma.vendorProfile.findUnique({
        where: { brandSlug: data.brandSlug },
      });

      if (slugExists) {
        throw new ConflictException('Brand slug already taken');
      }
    }

    const updated = await this.prisma.vendorProfile.update({
      where: { userId },
      data: {
        ...(data.businessName && { businessName: data.businessName }),
        ...(data.businessNameArabic && { businessNameArabic: data.businessNameArabic }),
        ...(data.brandName && { brandName: data.brandName }),
        ...(data.brandSlug && { brandSlug: data.brandSlug }),
        ...(data.description && { description: data.description }),
        ...(data.descriptionArabic && { descriptionArabic: data.descriptionArabic }),
        ...(data.businessEmail && { businessEmail: data.businessEmail }),
        ...(data.businessPhone && { businessPhone: data.businessPhone }),
        ...(data.whatsappNumber !== undefined && { whatsappNumber: data.whatsappNumber }),
        ...(data.businessAddress && { businessAddress: data.businessAddress }),
        ...(data.warehouseAddress !== undefined && {
          warehouseAddress: data.warehouseAddress,
        }),
        ...(data.bankName && { bankName: data.bankName }),
        ...(data.bankAccountNumber && { bankAccountNumber: data.bankAccountNumber }),
        ...(data.bankAccountName && { bankAccountName: data.bankAccountName }),
        ...(data.iban && { iban: data.iban }),
        ...(data.swiftCode && { swiftCode: data.swiftCode }),
        ...(data.logo !== undefined && { logo: data.logo }),
        ...(data.banner !== undefined && { banner: data.banner }),
        ...(data.galleries && { galleries: data.galleries }),
        ...(data.categoryIds && { categoryIds: data.categoryIds }),
        ...(data.shippingEnabled !== undefined && { shippingEnabled: data.shippingEnabled }),
        ...(data.freeShippingThreshold !== undefined && {
          freeShippingThreshold: data.freeShippingThreshold,
        }),
        ...(data.shippingFee !== undefined && { shippingFee: data.shippingFee }),
        ...(data.averageProcessingDays !== undefined && {
          averageProcessingDays: data.averageProcessingDays,
        }),
        ...(data.returnPolicy !== undefined && { returnPolicy: data.returnPolicy }),
        ...(data.shippingPolicy !== undefined && { shippingPolicy: data.shippingPolicy }),
        ...(data.metadata && { metadata: data.metadata }),
      },
    });

    return updated;
  }

  // ==================== ADMIN - VENDOR MANAGEMENT ====================

  async getAllVendors(options: {
    verificationStatus?: VendorVerificationStatus;
    isActive?: boolean;
    isFeatured?: boolean;
    businessType?: VendorBusinessType;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const {
      verificationStatus,
      isActive,
      isFeatured,
      businessType,
      search,
      page = 1,
      limit = 20,
    } = options;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (verificationStatus) where.verificationStatus = verificationStatus;
    if (isActive !== undefined) where.isActive = isActive;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (businessType) where.businessType = businessType;

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { brandName: { contains: search, mode: 'insensitive' } },
        { businessEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [vendors, total] = await Promise.all([
      this.prisma.vendorProfile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vendorProfile.count({ where }),
    ]);

    return {
      data: vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVendorById(vendorId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Get associated documents
    const documents = await this.prisma.vendorDocument.findMany({
      where: { vendorId },
      orderBy: { uploadedAt: 'desc' },
    });

    return {
      ...vendor,
      documents,
    };
  }

  async verifyVendor(vendorId: string, adminId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Check if all required documents are approved
    const documents = await this.prisma.vendorDocument.findMany({
      where: { vendorId },
    });

    const requiredDocs = [
      VendorDocumentType.TRADE_LICENSE,
      VendorDocumentType.TAX_REGISTRATION,
      VendorDocumentType.ID_CARD,
    ];

    const hasAllRequired = requiredDocs.every((type) =>
      documents.some(
        (doc) => doc.type === type && doc.status === DocumentVerificationStatus.APPROVED,
      ),
    );

    if (!hasAllRequired) {
      throw new BadRequestException(
        'All required documents must be approved before verifying vendor',
      );
    }

    const updated = await this.prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        verificationStatus: VendorVerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        verifiedBy: adminId,
        isActive: true,
      },
    });

    // TODO: Send notification to vendor about verification

    return {
      ...updated,
      message: 'Vendor verified successfully',
    };
  }

  async rejectVendor(vendorId: string, adminId: string, reason: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const updated = await this.prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        verificationStatus: VendorVerificationStatus.REJECTED,
        verifiedBy: adminId,
        isActive: false,
        metadata: {
          ...(vendor.metadata as any),
          rejectionReason: reason,
          rejectedAt: new Date().toISOString(),
        },
      },
    });

    // TODO: Send notification to vendor about rejection with reason

    return {
      ...updated,
      message: 'Vendor rejected',
    };
  }

  async requestResubmission(vendorId: string, adminId: string, message: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const updated = await this.prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        verificationStatus: VendorVerificationStatus.RESUBMISSION_REQUIRED,
        verifiedBy: adminId,
        metadata: {
          ...(vendor.metadata as any),
          resubmissionMessage: message,
          resubmissionRequestedAt: new Date().toISOString(),
        },
      },
    });

    // TODO: Send notification to vendor requesting resubmission

    return {
      ...updated,
      message: 'Resubmission requested',
    };
  }

  async suspendVendor(vendorId: string, adminId: string, reason: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const updated = await this.prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        isSuspended: true,
        suspensionReason: reason,
        isActive: false,
        metadata: {
          ...(vendor.metadata as any),
          suspendedBy: adminId,
          suspendedAt: new Date().toISOString(),
        },
      },
    });

    // TODO: Send notification to vendor about suspension

    return {
      ...updated,
      message: 'Vendor suspended',
    };
  }

  async unsuspendVendor(vendorId: string, adminId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const updated = await this.prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        isSuspended: false,
        suspensionReason: null,
        isActive: vendor.verificationStatus === VendorVerificationStatus.VERIFIED,
        metadata: {
          ...(vendor.metadata as any),
          unsuspendedBy: adminId,
          unsuspendedAt: new Date().toISOString(),
        },
      },
    });

    return {
      ...updated,
      message: 'Vendor unsuspended',
    };
  }

  async updateCommission(vendorId: string, commissionRate: number) {
    if (commissionRate < 0 || commissionRate > 100) {
      throw new BadRequestException('Commission rate must be between 0 and 100');
    }

    const updated = await this.prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        commissionRate,
        customCommissionRate: commissionRate !== 10, // 10 is default
      },
    });

    return updated;
  }

  async toggleFeatured(vendorId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const updated = await this.prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        isFeatured: !vendor.isFeatured,
      },
    });

    return updated;
  }

  // ==================== STATISTICS ====================

  async getVendorStats(vendorId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Get recent analytics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await this.prisma.vendorAnalytics.findMany({
      where: {
        vendorId,
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'asc' },
    });

    const last30Days = {
      totalOrders: analytics.reduce((sum, a) => sum + a.ordersCount, 0),
      totalRevenue: analytics.reduce((sum, a) => sum + a.revenue.toNumber(), 0),
      totalCommission: analytics.reduce((sum, a) => sum + a.commission.toNumber(), 0),
      totalProductsSold: analytics.reduce((sum, a) => sum + a.productsSold, 0),
      uniqueCustomers: analytics.reduce((sum, a) => sum + a.uniqueCustomers, 0),
    };

    return {
      profile: {
        totalProducts: vendor.totalProducts,
        totalOrders: vendor.totalOrders,
        totalRevenue: vendor.totalRevenue.toFixed(2),
        totalCommission: vendor.totalCommission.toFixed(2),
        averageRating: vendor.averageRating.toFixed(2),
        totalReviews: vendor.totalReviews,
      },
      last30Days,
      analytics: analytics.map((a) => ({
        date: a.date,
        orders: a.ordersCount,
        revenue: a.revenue.toFixed(2),
        commission: a.commission.toFixed(2),
        productsSold: a.productsSold,
      })),
    };
  }

  async getPlatformStats() {
    const [
      totalVendors,
      activeVendors,
      pendingVerification,
      verifiedVendors,
      suspendedVendors,
    ] = await Promise.all([
      this.prisma.vendorProfile.count(),
      this.prisma.vendorProfile.count({ where: { isActive: true } }),
      this.prisma.vendorProfile.count({
        where: { verificationStatus: VendorVerificationStatus.PENDING },
      }),
      this.prisma.vendorProfile.count({
        where: { verificationStatus: VendorVerificationStatus.VERIFIED },
      }),
      this.prisma.vendorProfile.count({ where: { isSuspended: true } }),
    ]);

    // Get top vendors by revenue
    const topVendors = await this.prisma.vendorProfile.findMany({
      where: { isActive: true },
      orderBy: { totalRevenue: 'desc' },
      take: 10,
      select: {
        id: true,
        brandName: true,
        totalRevenue: true,
        totalOrders: true,
        averageRating: true,
      },
    });

    return {
      overview: {
        totalVendors,
        activeVendors,
        pendingVerification,
        verifiedVendors,
        suspendedVendors,
      },
      topVendors: topVendors.map((v) => ({
        ...v,
        totalRevenue: v.totalRevenue.toFixed(2),
        averageRating: v.averageRating.toFixed(2),
      })),
    };
  }
}
