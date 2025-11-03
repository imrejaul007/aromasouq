import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

// Sub-schemas
@Schema({ _id: false })
export class Brand {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;
}

@Schema({ _id: false })
export class Taxonomy {
  @Prop({ type: [String], required: true })
  type: string[]; // 'original', 'similar_dna', 'clone', 'niche', 'our_brand', 'attar', 'body_spray', 'home_fragrance'

  @Prop({ type: [String], required: true })
  scentFamily: string[]; // 'floral', 'fruity', 'fresh', 'aquatic', 'oriental', 'woody', 'musky', 'sweet', 'gourmand', 'spicy', 'oud', 'leather'

  @Prop({ type: [String], required: true })
  gender: string[]; // 'men', 'women', 'unisex'

  @Prop({ type: [String] })
  region: string[]; // 'UAE', 'Saudi Arabia', 'Kuwait', etc.

  @Prop({ required: true })
  priceSegment: string; // 'budget', 'mid_range', 'premium', 'luxury', 'ultra_luxury'

  @Prop({ type: [String] })
  occasion: string[]; // 'office', 'party', 'date', 'daily', 'wedding', 'ramadan', 'eid', 'gift'

  @Prop({ type: [String] })
  mood: string[]; // 'romantic', 'confident', 'fresh', 'mysterious', 'elegant', 'casual', 'powerful', 'seductive', 'playful'

  @Prop()
  oudType?: string; // 'dehn_al_oud', 'cambodian', 'indian', 'thai', 'laotian', 'malaysian', 'mukhallat', 'incense', 'spray', 'luxury_extract'

  @Prop({ required: true })
  concentration: string; // 'parfum', 'edp', 'edt', 'edc', 'attar', 'mist'

  @Prop()
  collection?: string;

  @Prop({ required: true })
  fulfillmentType: string; // 'retail', 'wholesale', 'manufacturing', 'raw_material', 'packaging'
}

@Schema({ _id: false })
export class Attributes {
  @Prop({ required: true })
  volume: string; // "100ml", "50ml"

  @Prop({ required: true })
  longevityHours: number; // 2-24 hours

  @Prop({ required: true })
  projection: string; // 'soft', 'moderate', 'strong', 'very_strong'

  @Prop({ required: true, min: 1, max: 10 })
  projectionRating: number; // 1-10 numeric rating for filtering

  @Prop({ type: [String] })
  seasons: string[]; // 'spring', 'summer', 'fall', 'winter', 'all_season'

  @Prop({ type: [String] })
  timesOfDay: string[]; // 'morning', 'afternoon', 'evening', 'night', 'anytime'
}

@Schema({ _id: false })
export class Scent {
  @Prop({ type: [String], required: true })
  topNotes: string[];

  @Prop({ type: [String], required: true })
  middleNotes: string[];

  @Prop({ type: [String], required: true })
  baseNotes: string[];

  @Prop({ type: [String] })
  dnaSimilarTo?: string[]; // Slugs of similar products

  @Prop()
  similarityScore?: number; // 0-1
}

@Schema({ _id: false })
export class Oud {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  grade: string; // 'standard', 'premium', 'luxury'

  @Prop({ required: true })
  purityPercentage: number;

  @Prop({ required: true })
  origin: string;

  @Prop()
  agingYears?: number;
}

@Schema({ _id: false })
export class Price {
  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'AED' })
  currency: string;
}

@Schema({ _id: false })
export class WholesalePrice extends Price {
  @Prop({ required: true })
  minQuantity: number;
}

@Schema({ _id: false })
export class Pricing {
  @Prop({ type: Price, required: true })
  retail: Price;

  @Prop({ type: WholesalePrice })
  wholesale?: WholesalePrice;

  @Prop({ type: WholesalePrice })
  manufacture?: WholesalePrice;

  @Prop({ type: Object })
  salePrice?: {
    amount: number;
    currency: string;
    validUntil?: Date;
  };

  @Prop({ default: 0, min: 0, max: 100 })
  cashbackRate: number; // Cashback percentage (0-100), default 2%
}

@Schema({ _id: false })
export class ProductVendor {
  @Prop({ required: true })
  vendorId: string;

  @Prop({ required: true })
  vendorName: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, default: 0 })
  stock: number;

  @Prop({ required: true })
  fulfillmentType: string; // 'brand', 'platform', 'dropship'

  @Prop({ required: true })
  deliveryDays: number;

  @Prop({ default: false })
  isDefault: boolean;
}

@Schema({ _id: false })
export class Media {
  @Prop({ required: true })
  url: string;

  @Prop()
  size?: string; // 'original', 'large', 'medium', 'small', 'thumbnail'

  @Prop()
  width?: number;

  @Prop()
  height?: number;
}

@Schema({ _id: false })
export class VideoContent {
  @Prop({ required: true })
  url: string;

  @Prop()
  thumbnail?: string;

  @Prop()
  duration?: number; // in seconds

  @Prop()
  type?: string; // 'product_demo', 'review', 'unboxing', 'tutorial'
}

@Schema({ _id: false })
export class UGCVideo extends VideoContent {
  @Prop({ required: true })
  creatorId: string;

  @Prop({ required: true })
  creatorName: string;

  @Prop()
  creatorHandle?: string;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ default: false })
  verified: boolean;

  @Prop()
  uploadedAt?: Date;
}

@Schema({ _id: false })
export class ProductMedia {
  @Prop({ type: [Media], required: true })
  images: Media[];

  @Prop({ type: [VideoContent] })
  videos?: VideoContent[];

  @Prop({ type: [UGCVideo] })
  ugcVideos?: UGCVideo[];

  @Prop()
  arModel?: string;
}

@Schema({ _id: false })
export class AIData {
  @Prop()
  imageVectorId?: string;

  @Prop()
  scentVectorId?: string;

  @Prop({ type: [Number] })
  textEmbedding?: number[];
}

@Schema({ _id: false })
export class SEOData {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String] })
  keywords: string[];
}

@Schema({ _id: false })
export class SEO {
  @Prop({ type: SEOData, required: true })
  en: SEOData;

  @Prop({ type: SEOData, required: true })
  ar: SEOData;
}

@Schema({ _id: false })
export class Geo {
  @Prop({ type: [String], required: true })
  availableCountries: string[];

  @Prop({ type: [String] })
  featuredCities: string[];

  @Prop({ type: [String] })
  sameDayDeliveryCities: string[];
}

@Schema({ _id: false })
export class Stats {
  @Prop({ default: 0 })
  viewsTotal: number;

  @Prop({ default: 0 })
  views30d: number;

  @Prop({ default: 0 })
  salesTotal: number;

  @Prop({ default: 0 })
  sales30d: number;

  @Prop({ default: 0 })
  ratingAvg: number;

  @Prop({ default: 0 })
  ratingCount: number;

  @Prop({ default: 0 })
  conversionRate: number;
}

@Schema({ _id: false })
export class Flags {
  @Prop({ default: true })
  active: boolean;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ default: false })
  newArrival: boolean;

  @Prop({ default: false })
  bestSeller: boolean;

  @Prop({ default: false })
  lowStock: boolean;

  @Prop({ default: false })
  outOfStock: boolean;
}

// Main Product Schema
@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, unique: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  shortDescription?: string;

  @Prop({ type: Brand, required: true })
  brand: Brand;

  @Prop({ type: Taxonomy, required: true })
  taxonomy: Taxonomy;

  @Prop({ type: Attributes, required: true })
  attributes: Attributes;

  @Prop({ type: Scent, required: true })
  scent: Scent;

  @Prop({ type: Oud })
  oud?: Oud;

  @Prop({ type: Pricing, required: true })
  pricing: Pricing;

  @Prop({ type: [ProductVendor], default: [] })
  vendors: ProductVendor[];

  @Prop({ type: ProductMedia, required: true })
  media: ProductMedia;

  @Prop({ type: AIData })
  ai?: AIData;

  @Prop({ type: SEO, required: true })
  seo: SEO;

  @Prop({ type: Geo, required: true })
  geo: Geo;

  @Prop({ type: Stats, default: {} })
  stats: Stats;

  @Prop({ type: Flags, default: {} })
  flags: Flags;

  @Prop()
  indexedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes for performance
ProductSchema.index({ slug: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ 'taxonomy.type': 1 });
ProductSchema.index({ 'taxonomy.scentFamily': 1 });
ProductSchema.index({ 'taxonomy.gender': 1 });
ProductSchema.index({ 'taxonomy.region': 1 });
ProductSchema.index({ 'taxonomy.oudType': 1 });
ProductSchema.index({ 'brand.slug': 1 });
ProductSchema.index({ 'pricing.retail.amount': 1 });
ProductSchema.index({ 'stats.salesTotal': -1 });
ProductSchema.index({ 'stats.ratingAvg': -1 });
ProductSchema.index({ 'flags.active': 1, 'flags.featured': 1 });
ProductSchema.index({ createdAt: -1 });

// Text index for search
ProductSchema.index({
  name: 'text',
  description: 'text',
  'brand.name': 'text',
  'scent.topNotes': 'text',
  'scent.middleNotes': 'text',
  'scent.baseNotes': 'text',
});

// Indexes for new blueprint fields
ProductSchema.index({ 'taxonomy.mood': 1 });
ProductSchema.index({ 'taxonomy.fulfillmentType': 1 });
ProductSchema.index({ 'attributes.projectionRating': 1 });
ProductSchema.index({ 'pricing.cashbackRate': -1 });
