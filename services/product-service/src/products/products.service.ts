import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Check if SKU already exists
    const existingSku = await this.productModel.findOne({
      sku: createProductDto.sku,
    });
    if (existingSku) {
      throw new ConflictException(`Product with SKU ${createProductDto.sku} already exists`);
    }

    // Check if slug already exists
    const existingSlug = await this.productModel.findOne({
      slug: createProductDto.slug,
    });
    if (existingSlug) {
      throw new ConflictException(`Product with slug ${createProductDto.slug} already exists`);
    }

    const product = new this.productModel({
      ...createProductDto,
      stats: {
        viewsTotal: 0,
        views30d: 0,
        salesTotal: 0,
        sales30d: 0,
        ratingAvg: 0,
        ratingCount: 0,
        conversionRate: 0,
      },
      flags: {
        active: true,
        featured: false,
        newArrival: true,
        bestSeller: false,
        lowStock: false,
        outOfStock: false,
      },
    });

    return product.save();
  }

  async findAll(page = 1, limit = 20): Promise<{ data: Product[]; pagination: any }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.productModel
        .find({ 'flags.active': true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments({ 'flags.active': true }),
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

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Increment view count
    await this.productModel.findByIdAndUpdate(id, {
      $inc: { 'stats.viewsTotal': 1, 'stats.views30d': 1 },
    });

    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productModel.findOne({ slug }).exec();

    if (!product) {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }

    // Increment view count
    await this.productModel.findOneAndUpdate(
      { slug },
      { $inc: { 'stats.viewsTotal': 1, 'stats.views30d': 1 } },
    );

    return product;
  }

  async findBySku(sku: string): Promise<Product> {
    const product = await this.productModel.findOne({ sku }).exec();

    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }

    return product;
  }

  async search(searchDto: SearchProductDto): Promise<{ data: Product[]; pagination: any }> {
    const {
      q,
      type,
      scentFamily,
      gender,
      brand,
      priceSegment,
      minPrice,
      maxPrice,
      occasion,
      oudType,
      concentration,
      region,
      sortBy = 'newest',
      page = 1,
      limit = 20,
    } = searchDto;

    const filter: any = { 'flags.active': true };

    // Text search
    if (q) {
      filter.$text = { $search: q };
    }

    // Taxonomy filters
    if (type && type.length > 0) {
      filter['taxonomy.type'] = { $in: type };
    }

    if (scentFamily && scentFamily.length > 0) {
      filter['taxonomy.scentFamily'] = { $in: scentFamily };
    }

    if (gender && gender.length > 0) {
      filter['taxonomy.gender'] = { $in: gender };
    }

    if (priceSegment) {
      filter['taxonomy.priceSegment'] = priceSegment;
    }

    if (occasion && occasion.length > 0) {
      filter['taxonomy.occasion'] = { $in: occasion };
    }

    if (oudType) {
      filter['taxonomy.oudType'] = oudType;
    }

    if (concentration) {
      filter['taxonomy.concentration'] = concentration;
    }

    if (region) {
      filter['taxonomy.region'] = region;
    }

    // Brand filter
    if (brand) {
      filter['brand.slug'] = brand;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter['pricing.retail.amount'] = {};
      if (minPrice !== undefined) {
        filter['pricing.retail.amount'].$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        filter['pricing.retail.amount'].$lte = maxPrice;
      }
    }

    // Sorting
    let sort: any = {};
    switch (sortBy) {
      case 'price_asc':
        sort = { 'pricing.retail.amount': 1 };
        break;
      case 'price_desc':
        sort = { 'pricing.retail.amount': -1 };
        break;
      case 'rating':
        sort = { 'stats.ratingAvg': -1 };
        break;
      case 'sales':
        sort = { 'stats.salesTotal': -1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
        break;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.productModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
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

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    // Check if slug is being changed and if it conflicts
    if (updateProductDto.slug) {
      const existingSlug = await this.productModel.findOne({
        slug: updateProductDto.slug,
        _id: { $ne: id },
      });
      if (existingSlug) {
        throw new ConflictException(`Product with slug ${updateProductDto.slug} already exists`);
      }
    }

    // Check if SKU is being changed and if it conflicts
    if (updateProductDto.sku) {
      const existingSku = await this.productModel.findOne({
        sku: updateProductDto.sku,
        _id: { $ne: id },
      });
      if (existingSku) {
        throw new ConflictException(`Product with SKU ${updateProductDto.sku} already exists`);
      }
    }

    const product = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async remove(id: string): Promise<{ message: string }> {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Soft delete by setting active flag to false
    await this.productModel.findByIdAndUpdate(id, {
      'flags.active': false,
    });

    return { message: `Product ${product.name} has been deactivated` };
  }

  async hardDelete(id: string): Promise<{ message: string }> {
    const product = await this.productModel.findByIdAndDelete(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return { message: `Product ${product.name} has been permanently deleted` };
  }

  // Featured products
  async getFeatured(limit = 10): Promise<Product[]> {
    return this.productModel
      .find({ 'flags.active': true, 'flags.featured': true })
      .sort({ 'stats.salesTotal': -1 })
      .limit(limit)
      .exec();
  }

  // New arrivals
  async getNewArrivals(limit = 10): Promise<Product[]> {
    return this.productModel
      .find({ 'flags.active': true, 'flags.newArrival': true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  // Best sellers
  async getBestSellers(limit = 10): Promise<Product[]> {
    return this.productModel
      .find({ 'flags.active': true })
      .sort({ 'stats.salesTotal': -1 })
      .limit(limit)
      .exec();
  }

  // Similar products based on scent DNA
  async getSimilarProducts(productId: string, limit = 5): Promise<Product[]> {
    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Find products with similar scent families and type
    return this.productModel
      .find({
        _id: { $ne: productId },
        'flags.active': true,
        'taxonomy.scentFamily': { $in: product.taxonomy.scentFamily },
        'taxonomy.type': { $in: product.taxonomy.type },
      })
      .sort({ 'stats.ratingAvg': -1 })
      .limit(limit)
      .exec();
  }

  // Products by brand
  async getByBrand(brandSlug: string, page = 1, limit = 20): Promise<{ data: Product[]; pagination: any }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.productModel
        .find({ 'brand.slug': brandSlug, 'flags.active': true })
        .sort({ 'stats.salesTotal': -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments({ 'brand.slug': brandSlug, 'flags.active': true }),
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

  // Update stock levels
  async updateStock(productId: string, vendorId: string, quantity: number): Promise<Product> {
    const product = await this.productModel.findOneAndUpdate(
      { _id: productId, 'vendors.vendorId': vendorId },
      { $set: { 'vendors.$.stock': quantity } },
      { new: true },
    );

    if (!product) {
      throw new NotFoundException(`Product or vendor not found`);
    }

    // Update low stock flag
    const totalStock = product.vendors.reduce((sum, vendor) => sum + vendor.stock, 0);
    if (totalStock === 0) {
      product.flags.outOfStock = true;
      product.flags.lowStock = false;
    } else if (totalStock < 10) {
      product.flags.lowStock = true;
      product.flags.outOfStock = false;
    } else {
      product.flags.lowStock = false;
      product.flags.outOfStock = false;
    }

    await product.save();
    return product;
  }

  // Bulk operations
  async bulkUpdatePrices(updates: Array<{ id: string; price: number }>): Promise<{ modified: number }> {
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: { 'pricing.retail.amount': update.price } },
      },
    }));

    const result = await this.productModel.bulkWrite(bulkOps);
    return { modified: result.modifiedCount };
  }
}
