import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BrandDocument = Brand & Document;

@Schema({ timestamps: true })
export class Brand {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop()
  description?: string;

  @Prop()
  logo?: string;

  @Prop()
  coverImage?: string;

  @Prop()
  website?: string;

  @Prop()
  origin?: string; // Country of origin

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: 0 })
  productCount: number;

  @Prop({ type: Object })
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

// Indexes
BrandSchema.index({ slug: 1 });
BrandSchema.index({ isActive: 1, isFeatured: 1 });
