import { UUID, ISODateTime, Timestamps, Address } from './common';

export interface Vendor extends Timestamps {
  id: UUID;
  userId: UUID;
  businessName: string;
  slug: string;
  description: string;
  logo?: string;
  coverImage?: string;

  // Business details
  businessType: 'manufacturer' | 'distributor' | 'retailer' | 'individual';
  licenseNumber: string;
  taxNumber?: string;

  // Contact
  contactPerson: string;
  email: string;
  phone: string;
  address: Address;

  // Verification
  verified: boolean;
  verifiedAt?: ISODateTime;
  documents: VendorDocument[];

  // Performance
  rating: number;
  totalReviews: number;
  totalSales: number;
  totalProducts: number;
  totalOrders: number;
  responseTime: number; // in hours

  // Financial
  commissionRate: number; // percentage
  balance: number;
  totalEarnings: number;
  totalPaid: number;

  // Settings
  settings: VendorSettings;

  // Status
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
}

export interface VendorDocument {
  id: UUID;
  type: 'license' | 'tax_certificate' | 'id_card' | 'other';
  name: string;
  url: string;
  verified: boolean;
  uploadedAt: ISODateTime;
}

export interface VendorSettings {
  autoAcceptOrders: boolean;
  minOrderAmount: number;
  maxOrderAmount?: number;
  returnPolicy: string;
  shippingPolicy: string;
  processingTime: number; // in hours
  notifications: {
    newOrder: boolean;
    lowStock: boolean;
    payment: boolean;
  };
}

export interface VendorDashboard {
  stats: {
    todaySales: number;
    weekSales: number;
    monthSales: number;
    totalSales: number;
    pendingOrders: number;
    totalProducts: number;
    lowStockProducts: number;
  };
  recentOrders: any[]; // Order[]
  topProducts: any[]; // Product[]
  earnings: VendorEarning[];
}

export interface VendorEarning extends Timestamps {
  id: UUID;
  vendorId: UUID;
  orderId: UUID;
  orderNumber: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'paid';
  paidAt?: ISODateTime;
  paymentMethod?: string;
}

export interface VendorPayout extends Timestamps {
  id: UUID;
  vendorId: UUID;
  amount: number;
  method: 'bank_transfer' | 'stripe' | 'paypal';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    swiftCode?: string;
    iban?: string;
  };
  processedAt?: ISODateTime;
}

export interface CreateVendorRequest {
  businessName: string;
  description: string;
  businessType: Vendor['businessType'];
  licenseNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: Address;
}

export interface UpdateVendorRequest extends Partial<CreateVendorRequest> {
  logo?: string;
  coverImage?: string;
}

export interface VendorReview extends Timestamps {
  id: UUID;
  vendorId: UUID;
  userId: UUID;
  userName: string;
  orderId: UUID;
  rating: number; // 1-5
  comment: string;
  response?: {
    comment: string;
    createdAt: ISODateTime;
  };
}
