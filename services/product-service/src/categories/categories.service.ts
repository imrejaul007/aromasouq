import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Check if category with same slug exists
    const existingCategory = await this.categoryModel.findOne({
      slug: createCategoryDto.slug,
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category with slug ${createCategoryDto.slug} already exists`,
      );
    }

    const category = new this.categoryModel(createCategoryDto);
    return category.save();
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel
      .find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .exec();
  }

  async findByType(type: string): Promise<Category[]> {
    return this.categoryModel
      .find({ type, isActive: true })
      .sort({ order: 1, name: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryModel.findOne({ slug }).exec();

    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }

    return category;
  }

  async findChildren(parentId: string): Promise<Category[]> {
    return this.categoryModel
      .find({ parentId, isActive: true })
      .sort({ order: 1, name: 1 })
      .exec();
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    // Check if slug is being changed and if it conflicts
    if (updateCategoryDto.slug) {
      const existingCategory = await this.categoryModel.findOne({
        slug: updateCategoryDto.slug,
        _id: { $ne: id },
      });

      if (existingCategory) {
        throw new ConflictException(
          `Category with slug ${updateCategoryDto.slug} already exists`,
        );
      }
    }

    const category = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .exec();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async remove(id: string): Promise<{ message: string }> {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Soft delete
    await this.categoryModel.findByIdAndUpdate(id, { isActive: false });

    return { message: `Category ${category.name} has been deactivated` };
  }

  async incrementProductCount(slug: string): Promise<void> {
    await this.categoryModel.findOneAndUpdate(
      { slug },
      { $inc: { productCount: 1 } },
    );
  }

  async decrementProductCount(slug: string): Promise<void> {
    await this.categoryModel.findOneAndUpdate(
      { slug },
      { $inc: { productCount: -1 } },
    );
  }

  // Get category tree (hierarchical structure)
  async getTree(): Promise<any[]> {
    const categories = await this.categoryModel
      .find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .exec();

    const categoryMap = new Map();
    const roots = [];

    // First pass: create map
    categories.forEach((cat) => {
      categoryMap.set(cat._id.toString(), {
        ...cat.toObject(),
        children: [],
      });
    });

    // Second pass: build tree
    categories.forEach((cat) => {
      const categoryObj = categoryMap.get(cat._id.toString());
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(categoryObj);
        }
      } else {
        roots.push(categoryObj);
      }
    });

    return roots;
  }
}
