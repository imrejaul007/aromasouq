import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop()
  description?: string;

  @Prop()
  icon?: string;

  @Prop()
  image?: string;

  @Prop({ required: true })
  type: string; // 'type', 'scent_family', 'gender', 'region', 'price_segment', 'occasion', 'oud_type', 'concentration'

  @Prop()
  parentId?: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  productCount: number;

  @Prop({ type: Object })
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Indexes
CategorySchema.index({ slug: 1 });
CategorySchema.index({ type: 1 });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ isActive: 1 });
