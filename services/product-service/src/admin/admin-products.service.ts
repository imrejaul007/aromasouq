import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../schemas/product.schema';

@Injectable()
export class AdminProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  // ==================== PRODUCT MODERATION ====================

  async getPendingProducts(options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.productModel
        .find({ 'flags.active': false, 'flags.pendingApproval': true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments({
        'flags.active': false,
        'flags.pendingApproval': true,
      }),
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

  async approveProduct(productId: string, approvedBy: string) {
    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.flags.active) {
      throw new BadRequestException('Product is already approved');
    }

    const updated = await this.productModel.findByIdAndUpdate(
      productId,
      {
        $set: {
          'flags.active': true,
          'flags.pendingApproval': false,
          approvedAt: new Date(),
          approvedBy,
        },
      },
      { new: true },
    );

    return {
      ...updated.toObject(),
      message: 'Product approved successfully',
    };
  }

  async rejectProduct(productId: string, reason: string, rejectedBy: string) {
    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const updated = await this.productModel.findByIdAndUpdate(
      productId,
      {
        $set: {
          'flags.active': false,
          'flags.pendingApproval': false,
          'flags.rejected': true,
          rejectionReason: reason,
          rejectedAt: new Date(),
          rejectedBy,
        },
      },
      { new: true },
    );

    return {
      ...updated.toObject(),
      message: 'Product rejected successfully',
    };
  }

  async deactivateProduct(productId: string, reason: string, deactivatedBy: string) {
    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const updated = await this.productModel.findByIdAndUpdate(
      productId,
      {
        $set: {
          'flags.active': false,
          deactivationReason: reason,
          deactivatedAt: new Date(),
          deactivatedBy,
        },
      },
      { new: true },
    );

    return {
      ...updated.toObject(),
      message: 'Product deactivated successfully',
    };
  }

  async reactivateProduct(productId: string, reactivatedBy: string) {
    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.flags.active) {
      throw new BadRequestException('Product is already active');
    }

    const updated = await this.productModel.findByIdAndUpdate(
      productId,
      {
        $set: {
          'flags.active': true,
          'flags.rejected': false,
          reactivatedAt: new Date(),
          reactivatedBy,
          $unset: {
            rejectionReason: '',
            deactivationReason: '',
          },
        },
      },
      { new: true },
    );

    return {
      ...updated.toObject(),
      message: 'Product reactivated successfully',
    };
  }

  async updateProductFlags(productId: string, flags: Partial<any>, updatedBy: string) {
    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const updated = await this.productModel.findByIdAndUpdate(
      productId,
      {
        $set: {
          'flags.featured': flags.featured ?? product.flags.featured,
          'flags.newArrival': flags.newArrival ?? product.flags.newArrival,
          'flags.bestSeller': flags.bestSeller ?? product.flags.bestSeller,
        },
      },
      { new: true },
    );

    return updated;
  }

  // ==================== PRODUCT STATISTICS ====================

  async getProductStats() {
    const [
      total,
      active,
      inactive,
      pending,
      rejected,
      outOfStock,
      lowStock,
      featured,
      newArrivals,
    ] = await Promise.all([
      this.productModel.countDocuments(),
      this.productModel.countDocuments({ 'flags.active': true }),
      this.productModel.countDocuments({ 'flags.active': false }),
      this.productModel.countDocuments({ 'flags.pendingApproval': true }),
      this.productModel.countDocuments({ 'flags.rejected': true }),
      this.productModel.countDocuments({ 'flags.outOfStock': true }),
      this.productModel.countDocuments({ 'flags.lowStock': true }),
      this.productModel.countDocuments({ 'flags.featured': true }),
      this.productModel.countDocuments({ 'flags.newArrival': true }),
    ]);

    return {
      overview: {
        total,
        active,
        inactive,
        pending,
        rejected,
      },
      inventory: {
        outOfStock,
        lowStock,
      },
      highlights: {
        featured,
        newArrivals,
      },
    };
  }

  async getTopProducts(options: {
    sortBy: 'views' | 'sales' | 'rating';
    limit?: number;
  }) {
    const { sortBy, limit = 10 } = options;

    const sortField =
      sortBy === 'views'
        ? 'stats.viewsTotal'
        : sortBy === 'sales'
          ? 'stats.salesTotal'
          : 'stats.ratingAvg';

    const products = await this.productModel
      .find({ 'flags.active': true })
      .sort({ [sortField]: -1 })
      .limit(limit)
      .select('name sku primaryVendorId pricing stats')
      .exec();

    return products;
  }

  async getProductsByVendor(vendorId: string, options: {
    status?: 'active' | 'inactive' | 'pending';
    page?: number;
    limit?: number;
  } = {}) {
    const { status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const filter: any = { primaryVendorId: vendorId };

    if (status === 'active') {
      filter['flags.active'] = true;
    } else if (status === 'inactive') {
      filter['flags.active'] = false;
    } else if (status === 'pending') {
      filter['flags.pendingApproval'] = true;
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter),
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

  async bulkApprove(productIds: string[], approvedBy: string) {
    const result = await this.productModel.updateMany(
      {
        _id: { $in: productIds },
        'flags.pendingApproval': true,
      },
      {
        $set: {
          'flags.active': true,
          'flags.pendingApproval': false,
          approvedAt: new Date(),
          approvedBy,
        },
      },
    );

    return {
      modified: result.modifiedCount,
      message: `${result.modifiedCount} products approved successfully`,
    };
  }

  async bulkDeactivate(productIds: string[], reason: string, deactivatedBy: string) {
    const result = await this.productModel.updateMany(
      {
        _id: { $in: productIds },
      },
      {
        $set: {
          'flags.active': false,
          deactivationReason: reason,
          deactivatedAt: new Date(),
          deactivatedBy,
        },
      },
    );

    return {
      modified: result.modifiedCount,
      message: `${result.modifiedCount} products deactivated successfully`,
    };
  }
}
