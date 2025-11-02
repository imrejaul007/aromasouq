import { UUID, ISODateTime, Timestamps, Media, SEO, Currency } from './common';

// Product Type Categories
export type ProductType = 'original' | 'similar_dna' | 'clone' | 'niche' | 'our_brand' | 'attar' | 'body_spray' | 'home_fragrance';
export type ScentFamily = 'floral' | 'fruity' | 'fresh' | 'aquatic' | 'oriental' | 'woody' | 'musky' | 'sweet' | 'gourmand' | 'spicy' | 'oud' | 'leather';
export type Gender = 'men' | 'women' | 'unisex';
export type Concentration = 'parfum' | 'edp' | 'edt' | 'edc' | 'attar' | 'mist';
export type OudType = 'dehn_al_oud' | 'cambodian' | 'indian' | 'thai' | 'laotian' | 'malaysian' | 'mukhallat' | 'incense' | 'spray' | 'luxury_extract';
export type PriceSegment = 'budget' | 'mid_range' | 'premium' | 'luxury' | 'ultra_luxury';
export type Occasion = 'office' | 'party' | 'date' | 'daily' | 'wedding' | 'ramadan' | 'eid' | 'gift';
export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all_season';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'anytime';

export interface Product extends Timestamps {
  id: UUID;
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;

  // Brand
  brand: {
    id: UUID;
    name: string;
    slug: string;
  };

  // Taxonomy (10 main categories)
  taxonomy: {
    type: ProductType[];
    scentFamily: ScentFamily[];
    gender: Gender[];
    region: string[];
    priceSegment: PriceSegment;
    occasion: Occasion[];
    oudType?: OudType;
    concentration: Concentration;
    collection?: string;
  };

  // Attributes
  attributes: {
    volume: string; // "100ml", "50ml"
    longevityHours: number;
    projection: 'soft' | 'moderate' | 'strong' | 'very_strong';
    seasons: Season[];
    timesOfDay: TimeOfDay[];
  };

  // Scent Profile
  scent: {
    topNotes: string[];
    middleNotes: string[];
    baseNotes: string[];
    dnaSimilarTo?: string[]; // slugs of similar products
    similarityScore?: number; // 0-1
  };

  // Oud Specifics (if applicable)
  oud?: {
    type: OudType;
    grade: 'standard' | 'premium' | 'luxury';
    purityPercentage: number;
    origin: string;
    agingYears?: number;
  };

  // Pricing
  pricing: {
    retail: {
      amount: number;
      currency: Currency;
    };
    wholesale?: {
      amount: number;
      currency: Currency;
      minQuantity: number;
    };
    manufacture?: {
      amount: number;
      currency: Currency;
      minQuantity: number;
    };
    salePrice?: {
      amount: number;
      currency: Currency;
      validUntil?: ISODateTime;
    };
  };

  // Multi-vendor inventory
  vendors: ProductVendor[];

  // Media
  media: {
    images: Media[];
    videos?: Media[];
    arModel?: string; // URL to 3D model for AR try-on
  };

  // AI Embeddings (references to vector DB)
  ai: {
    imageVectorId?: string;
    scentVectorId?: string;
    textEmbedding?: number[]; // For semantic search
  };

  // SEO (multi-language)
  seo: {
    en: SEO;
    ar: SEO;
  };

  // Geo-targeting
  geo: {
    availableCountries: string[];
    featuredCities: string[];
    sameDayDeliveryCities: string[];
  };

  // Analytics & Performance
  stats: {
    viewsTotal: number;
    views30d: number;
    salesTotal: number;
    sales30d: number;
    ratingAvg: number;
    ratingCount: number;
    conversionRate: number;
  };

  // Business logic flags
  flags: {
    active: boolean;
    featured: boolean;
    newArrival: boolean;
    bestSeller: boolean;
    lowStock: boolean;
    outOfStock: boolean;
  };

  // Metadata
  indexedAt?: ISODateTime; // Last Elasticsearch sync
}

export interface ProductVendor {
  vendorId: UUID;
  vendorName: string;
  price: number;
  stock: number;
  fulfillmentType: 'brand' | 'platform' | 'dropship';
  deliveryDays: number;
  isDefault: boolean;
}

export interface ProductVariant {
  id: UUID;
  productId: UUID;
  name: string; // "100ml", "50ml", "Sample"
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, any>;
}

export interface ProductReview extends Timestamps {
  id: UUID;
  productId: UUID;
  userId: UUID;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  images?: string[];
  verified: boolean; // purchased product
  helpful: number; // helpfulness votes
  response?: {
    vendorId: UUID;
    vendorName: string;
    comment: string;
    createdAt: ISODateTime;
  };
}

export interface ProductCategory extends Timestamps {
  id: UUID;
  name: string;
  slug: string;
  description?: string;
  parentId?: UUID;
  image?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  productCount: number;
  seo: {
    en: SEO;
    ar: SEO;
  };
}

export interface Brand extends Timestamps {
  id: UUID;
  name: string;
  slug: string;
  description: string;
  logo: string;
  coverImage?: string;
  country: string;
  website?: string;
  isVerified: boolean;
  productCount: number;
  seo: {
    en: SEO;
    ar: SEO;
  };
}

export interface CreateProductRequest {
  name: string;
  description: string;
  brandId: UUID;
  taxonomy: Product['taxonomy'];
  attributes: Product['attributes'];
  scent: Product['scent'];
  pricing: Product['pricing'];
  media: {
    imageUrls: string[];
    videoUrls?: string[];
  };
  seo: Product['seo'];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: UUID;
}

export interface ProductSearchQuery {
  query?: string;
  type?: ProductType[];
  scentFamily?: ScentFamily[];
  gender?: Gender[];
  brand?: string[];
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  country?: string;
  city?: string;
  occasion?: Occasion[];
  oudType?: OudType[];
  concentration?: Concentration[];
  inStock?: boolean;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}

export interface ProductSearchResult {
  products: Product[];
  facets: {
    brands: { name: string; count: number }[];
    priceRanges: { range: string; count: number }[];
    scentFamilies: { name: string; count: number }[];
    ratings: { rating: number; count: number }[];
  };
  total: number;
  page: number;
  totalPages: number;
}
