// Common types used across the platform

export type UUID = string;
export type ISODateTime = string;
export type Currency = 'AED' | 'USD' | 'EUR' | 'SAR' | 'KWD' | 'QAR' | 'BHD' | 'OMR';
export type Language = 'en' | 'ar';
export type Country = 'AE' | 'SA' | 'KW' | 'QA' | 'BH' | 'OM';

export interface Timestamps {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deletedAt?: ISODateTime;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface Address {
  id: UUID;
  userId: UUID;
  type: 'home' | 'work' | 'other';
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: Country;
  postalCode: string;
  isDefault: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Media {
  id: UUID;
  url: string;
  type: 'image' | 'video' | 'document';
  size: 'original' | 'large' | 'medium' | 'small' | 'thumbnail';
  width?: number;
  height?: number;
  fileSize: number;
  mimeType: string;
}

export interface SEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: ISODateTime;
    requestId: string;
  };
}

export interface Filter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

export interface Sort {
  field: string;
  order: 'asc' | 'desc';
}

export interface QueryParams {
  page?: number;
  limit?: number;
  filters?: Filter[];
  sort?: Sort[];
  search?: string;
}

export enum UserRole {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  INFLUENCER = 'influencer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED_DELIVERY = 'failed_delivery',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  WALLET = 'wallet',
  CASH_ON_DELIVERY = 'cod',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
}
