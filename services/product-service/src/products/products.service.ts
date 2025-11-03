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
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly elasticsearchService: ElasticsearchService,
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

    const savedProduct = await product.save();

    // Index in Elasticsearch
    await this.elasticsearchService.indexProduct(savedProduct as any);

    return savedProduct;
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
      mood,
      oudType,
      concentration,
      region,
      fulfillmentType,
      minProjectionRating,
      maxProjectionRating,
      minCashbackRate,
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

    // NEW: Mood filter
    if (mood && mood.length > 0) {
      filter['taxonomy.mood'] = { $in: mood };
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

    // NEW: Fulfillment type filter
    if (fulfillmentType) {
      filter['taxonomy.fulfillmentType'] = fulfillmentType;
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

    // NEW: Projection rating range filter
    if (minProjectionRating !== undefined || maxProjectionRating !== undefined) {
      filter['attributes.projectionRating'] = {};
      if (minProjectionRating !== undefined) {
        filter['attributes.projectionRating'].$gte = minProjectionRating;
      }
      if (maxProjectionRating !== undefined) {
        filter['attributes.projectionRating'].$lte = maxProjectionRating;
      }
    }

    // NEW: Cashback rate filter
    if (minCashbackRate !== undefined) {
      filter['pricing.cashbackRate'] = { $gte: minCashbackRate };
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
      case 'cashback':
        sort = { 'pricing.cashbackRate': -1 };
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

    // Update in Elasticsearch
    await this.elasticsearchService.updateProduct(id, updateProductDto as any);

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

    // Update in Elasticsearch
    await this.elasticsearchService.updateProduct(id, { flags: { active: false } } as any);

    return { message: `Product ${product.name} has been deactivated` };
  }

  async hardDelete(id: string): Promise<{ message: string }> {
    const product = await this.productModel.findByIdAndDelete(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Delete from Elasticsearch
    await this.elasticsearchService.deleteProduct(id);

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

  // NEW: Get products by mood
  async getByMood(mood: string, limit = 20): Promise<Product[]> {
    return this.productModel
      .find({
        'flags.active': true,
        'taxonomy.mood': mood
      })
      .sort({ 'stats.ratingAvg': -1 })
      .limit(limit)
      .exec();
  }

  // NEW: Get high cashback products
  async getHighCashback(minRate = 5, limit = 20): Promise<Product[]> {
    return this.productModel
      .find({
        'flags.active': true,
        'pricing.cashbackRate': { $gte: minRate }
      })
      .sort({ 'pricing.cashbackRate': -1 })
      .limit(limit)
      .exec();
  }

  // NEW: Get products by fulfillment type
  async getByFulfillmentType(fulfillmentType: string, page = 1, limit = 20): Promise<{ data: Product[]; pagination: any }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.productModel
        .find({
          'taxonomy.fulfillmentType': fulfillmentType,
          'flags.active': true
        })
        .sort({ 'stats.salesTotal': -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments({
        'taxonomy.fulfillmentType': fulfillmentType,
        'flags.active': true
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

  // NEW: Get products with strong projection
  async getStrongProjection(minRating = 7, limit = 20): Promise<Product[]> {
    return this.productModel
      .find({
        'flags.active': true,
        'attributes.projectionRating': { $gte: minRating }
      })
      .sort({ 'attributes.projectionRating': -1 })
      .limit(limit)
      .exec();
  }

  // NEW: Enhanced similar products with mood and projection matching
  async getSimilarProductsEnhanced(productId: string, limit = 5): Promise<Product[]> {
    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Find products with similar scent families, type, AND mood
    const filter: any = {
      _id: { $ne: productId },
      'flags.active': true,
      'taxonomy.scentFamily': { $in: product.taxonomy.scentFamily },
    };

    // Add mood matching if product has mood tags
    if (product.taxonomy.mood && product.taxonomy.mood.length > 0) {
      filter['taxonomy.mood'] = { $in: product.taxonomy.mood };
    }

    // Add projection rating similarity (within ±2 points)
    if (product.attributes.projectionRating) {
      filter['attributes.projectionRating'] = {
        $gte: Math.max(1, product.attributes.projectionRating - 2),
        $lte: Math.min(10, product.attributes.projectionRating + 2),
      };
    }

    return this.productModel
      .find(filter)
      .sort({ 'stats.ratingAvg': -1 })
      .limit(limit)
      .exec();
  }

  // NEW: Get products by multiple moods (perfect for "vibe shopping")
  async getByMultipleMoods(moods: string[], limit = 20): Promise<Product[]> {
    return this.productModel
      .find({
        'flags.active': true,
        'taxonomy.mood': { $all: moods } // Product must have ALL specified moods
      })
      .sort({ 'stats.ratingAvg': -1 })
      .limit(limit)
      .exec();
  }

  // NEW: Get wholesale products
  async getWholesaleProducts(page = 1, limit = 20): Promise<{ data: Product[]; pagination: any }> {
    return this.getByFulfillmentType('wholesale', page, limit);
  }

  // NEW: Get manufacturing products
  async getManufacturingProducts(page = 1, limit = 20): Promise<{ data: Product[]; pagination: any }> {
    return this.getByFulfillmentType('manufacturing', page, limit);
  }

  // NEW: Get raw materials
  async getRawMaterials(page = 1, limit = 20): Promise<{ data: Product[]; pagination: any }> {
    return this.getByFulfillmentType('raw_material', page, limit);
  }

  // ELASTICSEARCH METHODS

  // Advanced Elasticsearch search with fuzzy matching and boosting
  async elasticSearch(searchDto: SearchProductDto): Promise<{ data: any[]; pagination: any; aggregations?: any }> {
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
      mood,
      oudType,
      concentration,
      region,
      fulfillmentType,
      minProjectionRating,
      maxProjectionRating,
      minCashbackRate,
      sortBy = 'newest',
      page = 1,
      limit = 20,
    } = searchDto;

    const must: any[] = [{ term: { 'flags.active': true } }];
    const should: any[] = [];
    const filter: any[] = [];

    // Text search with fuzzy matching and boosting
    if (q) {
      should.push(
        { match: { name: { query: q, boost: 3, fuzziness: 'AUTO' } } },
        { match: { description: { query: q, boost: 2, fuzziness: 'AUTO' } } },
        { match: { 'brand.name': { query: q, boost: 2.5, fuzziness: 'AUTO' } } },
        { match: { 'scent.topNotes': { query: q, boost: 1.5 } } },
        { match: { 'scent.middleNotes': { query: q, boost: 1.5 } } },
        { match: { 'scent.baseNotes': { query: q, boost: 1.5 } } },
      );
    }

    // Filters
    if (type && type.length > 0) filter.push({ terms: { 'taxonomy.type': type } });
    if (scentFamily && scentFamily.length > 0) filter.push({ terms: { 'taxonomy.scentFamily': scentFamily } });
    if (gender && gender.length > 0) filter.push({ terms: { 'taxonomy.gender': gender } });
    if (brand) filter.push({ term: { 'brand.slug': brand } });
    if (priceSegment) filter.push({ term: { 'taxonomy.priceSegment': priceSegment } });
    if (occasion && occasion.length > 0) filter.push({ terms: { 'taxonomy.occasion': occasion } });
    if (mood && mood.length > 0) filter.push({ terms: { 'taxonomy.mood': mood } });
    if (oudType) filter.push({ term: { 'taxonomy.oudType': oudType } });
    if (concentration) filter.push({ term: { 'taxonomy.concentration': concentration } });
    if (region) filter.push({ term: { 'taxonomy.region': region } });
    if (fulfillmentType) filter.push({ term: { 'taxonomy.fulfillmentType': fulfillmentType } });

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceRange: any = {};
      if (minPrice !== undefined) priceRange.gte = minPrice;
      if (maxPrice !== undefined) priceRange.lte = maxPrice;
      filter.push({ range: { 'pricing.retail.amount': priceRange } });
    }

    // Projection rating range
    if (minProjectionRating !== undefined || maxProjectionRating !== undefined) {
      const projectionRange: any = {};
      if (minProjectionRating !== undefined) projectionRange.gte = minProjectionRating;
      if (maxProjectionRating !== undefined) projectionRange.lte = maxProjectionRating;
      filter.push({ range: { 'attributes.projectionRating': projectionRange } });
    }

    // Cashback rate
    if (minCashbackRate !== undefined) {
      filter.push({ range: { 'pricing.cashbackRate': { gte: minCashbackRate } } });
    }

    // Sorting
    let sort: any[] = [];
    switch (sortBy) {
      case 'price_asc':
        sort = [{ 'pricing.retail.amount': { order: 'asc' } }];
        break;
      case 'price_desc':
        sort = [{ 'pricing.retail.amount': { order: 'desc' } }];
        break;
      case 'rating':
        sort = [{ 'stats.ratingAvg': { order: 'desc' } }];
        break;
      case 'sales':
        sort = [{ 'stats.salesTotal': { order: 'desc' } }];
        break;
      case 'cashback':
        sort = [{ 'pricing.cashbackRate': { order: 'desc' } }];
        break;
      case 'relevance':
        sort = [{ _score: { order: 'desc' } }];
        break;
      case 'newest':
      default:
        sort = [{ createdAt: { order: 'desc' } }];
        break;
    }

    const from = (page - 1) * limit;

    const query: any = {
      bool: {
        must,
        filter,
      },
    };

    if (should.length > 0) {
      query.bool.should = should;
      query.bool.minimum_should_match = 1;
    }

    const body: any = {
      from,
      size: limit,
      query,
      sort,
    };

    const result: any = await this.elasticsearchService.search(body);

    const hits = result.hits.hits.map((hit: any) => ({
      ...hit._source,
      _id: hit._id,
      _score: hit._score,
    }));

    const total = typeof result.hits.total === 'number' ? result.hits.total : result.hits.total.value;

    return {
      data: hits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get filter aggregations
  async getAggregations(filters: any = {}): Promise<any> {
    return this.elasticsearchService.getAggregations(filters);
  }

  // Autocomplete suggestions
  async autocomplete(field: string, text: string, size = 10): Promise<any> {
    return this.elasticsearchService.suggest(field, text, size);
  }

  // Bulk index all products to Elasticsearch
  async bulkIndexToElasticsearch(): Promise<{ indexed: number }> {
    const products = await this.productModel.find({}).exec();
    await this.elasticsearchService.bulkIndex(products as any);
    return { indexed: products.length };
  }

  // ==================== VENDOR-SPECIFIC METHODS ====================

  // Get all products for a specific vendor
  async getVendorProducts(
    vendorId: string,
    options: {
      search?: string;
      status?: 'active' | 'inactive' | 'outOfStock';
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: Product[]; pagination: any }> {
    const { search, status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const filter: any = { primaryVendorId: vendorId };

    // Status filter
    if (status === 'active') {
      filter['flags.active'] = true;
      filter['flags.outOfStock'] = false;
    } else if (status === 'inactive') {
      filter['flags.active'] = false;
    } else if (status === 'outOfStock') {
      filter['flags.outOfStock'] = true;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.productModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
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

  // Get single product by vendor (with ownership check)
  async getVendorProduct(vendorId: string, productId: string): Promise<Product> {
    const product = await this.productModel.findOne({
      _id: productId,
      primaryVendorId: vendorId,
    }).exec();

    if (!product) {
      throw new NotFoundException('Product not found or you do not have access to it');
    }

    return product;
  }

  // Create product as vendor
  async createAsVendor(vendorId: string, createProductDto: CreateProductDto): Promise<Product> {
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
      primaryVendorId: vendorId,
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

    const savedProduct = await product.save();

    // Index in Elasticsearch
    await this.elasticsearchService.indexProduct(savedProduct as any);

    return savedProduct;
  }

  // Update product as vendor (partial update)
  async updateAsVendor(
    vendorId: string,
    productId: string,
    updateData: any,
  ): Promise<Product> {
    const product = await this.productModel.findOne({
      _id: productId,
      primaryVendorId: vendorId,
    });

    if (!product) {
      throw new NotFoundException('Product not found or you do not have access to it');
    }

    // Apply updates
    Object.assign(product, updateData);
    const updated = await product.save();

    // Re-index in Elasticsearch
    await this.elasticsearchService.indexProduct(updated as any);

    return updated;
  }

  // Update stock for vendor's product
  async updateVendorStock(
    vendorId: string,
    productId: string,
    stock: number,
  ): Promise<Product> {
    const product = await this.productModel.findOne({
      _id: productId,
      primaryVendorId: vendorId,
    });

    if (!product) {
      throw new NotFoundException('Product not found or you do not have access to it');
    }

    // Update stock in vendors array if vendor exists
    const vendorIndex = product.vendors.findIndex((v) => v.vendorId === vendorId);
    if (vendorIndex >= 0) {
      product.vendors[vendorIndex].stock = stock;
    } else {
      // Add vendor to vendors array if not exists
      product.vendors.push({
        vendorId,
        vendorName: 'Vendor', // TODO: Fetch vendor name from user-service
        price: product.pricing.retail.amount,
        stock,
        fulfillmentType: product.taxonomy.fulfillmentType,
        deliveryDays: 2,
        isDefault: true,
      } as any);
    }

    // Update stock flags
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

    const updated = await product.save();

    // Re-index in Elasticsearch
    await this.elasticsearchService.indexProduct(updated as any);

    return updated;
  }

  // Soft delete (deactivate) product as vendor
  async deleteAsVendor(vendorId: string, productId: string): Promise<{ message: string }> {
    const product = await this.productModel.findOne({
      _id: productId,
      primaryVendorId: vendorId,
    });

    if (!product) {
      throw new NotFoundException('Product not found or you do not have access to it');
    }

    product.flags.active = false;
    await product.save();

    // Remove from Elasticsearch
    await this.elasticsearchService.deleteProduct(productId);

    return { message: 'Product deactivated successfully' };
  }

  // Get vendor product statistics
  async getVendorProductStats(vendorId: string): Promise<any> {
    const products = await this.productModel.find({ primaryVendorId: vendorId }).exec();

    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.flags.active).length;
    const outOfStock = products.filter((p) => p.flags.outOfStock).length;
    const lowStock = products.filter((p) => p.flags.lowStock).length;

    const totalViews = products.reduce((sum, p) => sum + p.stats.viewsTotal, 0);
    const totalSales = products.reduce((sum, p) => sum + p.stats.salesTotal, 0);
    const averageRating = products.length > 0
      ? products.reduce((sum, p) => sum + p.stats.ratingAvg, 0) / products.length
      : 0;

    const topProducts = products
      .sort((a, b) => b.stats.salesTotal - a.stats.salesTotal)
      .slice(0, 5)
      .map((p) => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        sales: p.stats.salesTotal,
        revenue: p.stats.salesTotal * p.pricing.retail.amount,
      }));

    return {
      overview: {
        totalProducts,
        activeProducts,
        outOfStock,
        lowStock,
      },
      performance: {
        totalViews,
        totalSales,
        averageRating: averageRating.toFixed(2),
      },
      topProducts,
    };
  }
}
