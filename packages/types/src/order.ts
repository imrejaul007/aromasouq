import { UUID, ISODateTime, Timestamps, OrderStatus, PaymentStatus, PaymentMethod, Address } from './common';

export interface Order extends Timestamps {
  id: UUID;
  orderNumber: string;
  userId: UUID;

  // Order items
  items: OrderItem[];

  // Pricing
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  currency: string;

  // Status
  status: OrderStatus;
  paymentStatus: PaymentStatus;

  // Delivery
  deliveryAddress: Address;
  deliveryMethod: 'standard' | 'express' | 'same_day';
  deliveryPartnerId?: UUID;
  deliveryPartnerName?: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: ISODateTime;
  actualDeliveryDate?: ISODateTime;

  // Payment
  paymentMethod: PaymentMethod;
  paymentId?: UUID;

  // Cashback
  cashbackEarned: number;
  cashbackApplied: number;

  // Special instructions
  notes?: string;
  giftMessage?: string;
  isGift: boolean;

  // Timeline
  timeline: OrderTimeline[];

  // Multi-vendor
  isMultiVendor: boolean;
  vendorOrders?: VendorOrder[];
}

export interface OrderItem {
  id: UUID;
  productId: UUID;
  productName: string;
  productImage: string;
  variantId?: UUID;
  variantName?: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  vendorId: UUID;
  vendorName: string;
  fulfillmentType: 'brand' | 'platform' | 'dropship';
}

export interface VendorOrder {
  vendorId: UUID;
  vendorName: string;
  items: OrderItem[];
  subtotal: number;
  status: OrderStatus;
  trackingNumber?: string;
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: ISODateTime;
  description: string;
  location?: string;
  updatedBy?: UUID;
}

export interface CreateOrderRequest {
  userId: UUID;
  items: {
    productId: UUID;
    variantId?: UUID;
    quantity: number;
  }[];
  deliveryAddressId: UUID;
  deliveryMethod: 'standard' | 'express' | 'same_day';
  paymentMethod: PaymentMethod;
  cashbackToUse?: number;
  promoCode?: string;
  notes?: string;
  giftMessage?: string;
  isGift?: boolean;
}

export interface OrderSummary {
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  cashback: number;
  total: number;
}

export interface UpdateOrderStatusRequest {
  orderId: UUID;
  status: OrderStatus;
  notes?: string;
  location?: string;
}

export interface CancelOrderRequest {
  orderId: UUID;
  reason: string;
  refundToWallet: boolean;
}

export interface ReturnOrderRequest {
  orderId: UUID;
  items: {
    orderItemId: UUID;
    quantity: number;
    reason: string;
  }[];
  refundMethod: 'original' | 'wallet';
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}
