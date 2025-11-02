import { UUID, ISODateTime, Timestamps, PaymentStatus, PaymentMethod } from './common';

export interface Payment extends Timestamps {
  id: UUID;
  orderId: UUID;
  userId: UUID;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;

  // Gateway details
  gateway: 'stripe' | 'telr' | 'paytabs' | 'wallet';
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, any>;

  // Card details (tokenized)
  cardLast4?: string;
  cardBrand?: string;
  cardToken?: string;

  // Refund
  refundedAmount: number;
  refundReason?: string;
  refundedAt?: ISODateTime;

  // Metadata
  ipAddress?: string;
  userAgent?: string;
  failureReason?: string;
}

export interface PaymentIntent {
  id: UUID;
  orderId: UUID;
  amount: number;
  currency: string;
  clientSecret?: string; // For Stripe
  paymentUrl?: string; // For Telr/PayTabs
  expiresAt: ISODateTime;
}

export interface CreatePaymentRequest {
  orderId: UUID;
  amount: number;
  method: PaymentMethod;
  saveCard?: boolean;
  cardToken?: string;
  returnUrl?: string;
}

export interface ProcessPaymentRequest {
  paymentIntentId: UUID;
  gatewayResponse: Record<string, any>;
}

export interface RefundRequest {
  paymentId: UUID;
  amount?: number; // partial refund if specified
  reason: string;
}

export interface SavedCard {
  id: UUID;
  userId: UUID;
  cardToken: string;
  cardLast4: string;
  cardBrand: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  gateway: 'stripe' | 'telr';
}
