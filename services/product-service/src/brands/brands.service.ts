import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from '../schemas/brand.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
  ) {}

  async create(createBrandDto: CreateBrandDto): Promise<Brand> {
    // Check if brand with same slug exists
    const existingBrand = await this.brandModel.findOne({
      slug: createBrandDto.slug,
    });

    if (existingBrand) {
      throw new ConflictException(
        `Brand with slug ${createBrandDto.slug} already exists`,
      );
    }

    const brand = new this.brandModel(createBrandDto);
    return brand.save();
  }

  async findAll(page = 1, limit = 20): Promise<{ data: Brand[]; pagination: any }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.brandModel
        .find({ isActive: true })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.brandModel.countDocuments({ isActive: true }),
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

  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandModel.findById(id).exec();

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  async findBySlug(slug: string): Promise<Brand> {
    const brand = await this.brandModel.findOne({ slug }).exec();

    if (!brand) {
      throw new NotFoundException(`Brand with slug ${slug} not found`);
    }

    return brand;
  }

  async getFeatured(limit = 10): Promise<Brand[]> {
    return this.brandModel
      .find({ isActive: true, isFeatured: true })
      .sort({ productCount: -1 })
      .limit(limit)
      .exec();
  }

  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<Brand> {
    // Check if slug is being changed and if it conflicts
    if (updateBrandDto.slug) {
      const existingBrand = await this.brandModel.findOne({
        slug: updateBrandDto.slug,
        _id: { $ne: id },
      });

      if (existingBrand) {
        throw new ConflictException(
          `Brand with slug ${updateBrandDto.slug} already exists`,
        );
      }
    }

    const brand = await this.brandModel
      .findByIdAndUpdate(id, updateBrandDto, { new: true })
      .exec();

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  async remove(id: string): Promise<{ message: string }> {
    const brand = await this.brandModel.findById(id);

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    // Soft delete
    await this.brandModel.findByIdAndUpdate(id, { isActive: false });

    return { message: `Brand ${brand.name} has been deactivated` };
  }

  async incrementProductCount(slug: string): Promise<void> {
    await this.brandModel.findOneAndUpdate(
      { slug },
      { $inc: { productCount: 1 } },
    );
  }

  async decrementProductCount(slug: string): Promise<void> {
    await this.brandModel.findOneAndUpdate(
      { slug },
      { $inc: { productCount: -1 } },
    );
  }
}
