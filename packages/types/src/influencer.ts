import { UUID, ISODateTime, Timestamps } from './common';

export interface Influencer extends Timestamps {
  id: UUID;
  userId: UUID;
  storeName: string;
  storeSlug: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;

  // Social media
  socialMedia: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
  };
  followersCount: number;

  // Commission
  commissionRate: number; // percentage
  customCommissionRates?: {
    productId: UUID;
    rate: number;
  }[];

  // Earnings
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;

  // Performance
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;

  // Status
  isActive: boolean;
  verified: boolean;
  verifiedAt?: ISODateTime;

  // Settings
  settings: InfluencerSettings;
}

export interface InfluencerSettings {
  storeTheme: 'light' | 'dark' | 'custom';
  customColors?: {
    primary: string;
    secondary: string;
    background: string;
  };
  featuredProducts: UUID[];
  showAllProducts: boolean;
  customMessage?: string;
  notifications: {
    newClick: boolean;
    newSale: boolean;
    payout: boolean;
  };
}

export interface AffiliateLink extends Timestamps {
  id: UUID;
  influencerId: UUID;
  productId?: UUID;
  shortCode: string;
  longUrl: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
  lastClickedAt?: ISODateTime;
}

export interface AffiliateClick extends Timestamps {
  id: UUID;
  linkId: UUID;
  influencerId: UUID;
  productId?: UUID;
  userId?: UUID;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  converted: boolean;
  orderId?: UUID;
  conversionValue?: number;
}

export interface InfluencerEarning extends Timestamps {
  id: UUID;
  influencerId: UUID;
  orderId: UUID;
  orderNumber: string;
  productId: UUID;
  productName: string;
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paidAt?: ISODateTime;
}

export interface InfluencerPayout extends Timestamps {
  id: UUID;
  influencerId: UUID;
  amount: number;
  method: 'bank_transfer' | 'stripe' | 'paypal' | 'wallet';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference?: string;
  processedAt?: ISODateTime;
  failureReason?: string;
}

export interface CreateInfluencerRequest {
  storeName: string;
  bio?: string;
  socialMedia: Influencer['socialMedia'];
  followersCount: number;
}

export interface GenerateAffiliateLinkRequest {
  productId?: UUID;
  customSlug?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}

export interface InfluencerDashboard {
  stats: {
    todayEarnings: number;
    weekEarnings: number;
    monthEarnings: number;
    totalEarnings: number;
    pendingPayout: number;
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
  };
  recentClicks: AffiliateClick[];
  recentEarnings: InfluencerEarning[];
  topProducts: {
    productId: UUID;
    productName: string;
    clicks: number;
    conversions: number;
    earnings: number;
  }[];
}

export interface RequestPayoutRequest {
  amount: number;
  method: InfluencerPayout['method'];
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    swiftCode?: string;
    iban?: string;
  };
}
