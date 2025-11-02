import { UUID, ISODateTime, Timestamps, OrderStatus, Address } from './common';

export interface DeliveryPartner extends Timestamps {
  id: UUID;
  name: string;
  code: 'fetchr' | 'aramex' | 'smsa' | 'dhl' | 'custom';
  logo: string;
  isActive: boolean;
  countries: string[];
  cities: string[];
  services: DeliveryService[];
  apiConfig: {
    baseUrl: string;
    apiKey?: string;
    username?: string;
    accountNumber?: string;
  };
}

export interface DeliveryService {
  type: 'standard' | 'express' | 'same_day';
  name: string;
  deliveryDays: number;
  cutoffTime?: string; // "14:00" for same-day
  baseRate: number;
  perKgRate: number;
  minWeight: number;
  maxWeight: number;
}

export interface Shipment extends Timestamps {
  id: UUID;
  orderId: UUID;
  trackingNumber: string;
  partnerId: UUID;
  partnerName: string;

  // Package details
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };

  // Addresses
  pickupAddress: Address;
  deliveryAddress: Address;

  // Status
  status: OrderStatus;
  timeline: ShipmentTimeline[];

  // Costs
  shippingCost: number;
  codAmount?: number;

  // Label
  labelUrl?: string;
  awbNumber?: string;

  // Delivery
  estimatedDeliveryDate?: ISODateTime;
  actualDeliveryDate?: ISODateTime;
  deliveryAttempts: number;

  // Courier
  courierName?: string;
  courierPhone?: string;
  courierLocation?: {
    latitude: number;
    longitude: number;
    timestamp: ISODateTime;
  };
}

export interface ShipmentTimeline {
  status: OrderStatus;
  timestamp: ISODateTime;
  location: string;
  description: string;
  updatedBy?: 'system' | 'partner' | 'admin';
}

export interface CreateShipmentRequest {
  orderId: UUID;
  partnerId: UUID;
  serviceType: 'standard' | 'express' | 'same_day';
  pickupAddressId: UUID;
  deliveryAddressId: UUID;
  weight: number;
  dimensions: Shipment['dimensions'];
  codAmount?: number;
  instructions?: string;
}

export interface RateShoppingRequest {
  weight: number;
  dimensions: Shipment['dimensions'];
  pickupCity: string;
  deliveryCity: string;
  deliveryCountry: string;
  serviceType?: 'standard' | 'express' | 'same_day';
}

export interface DeliveryRate {
  partnerId: UUID;
  partnerName: string;
  serviceType: string;
  cost: number;
  deliveryDays: number;
  cutoffTime?: string;
  recommended: boolean;
}

export interface TrackShipmentRequest {
  trackingNumber: string;
  partnerId?: UUID;
}

export interface TrackingResponse {
  trackingNumber: string;
  status: OrderStatus;
  currentLocation: string;
  estimatedDelivery?: ISODateTime;
  timeline: ShipmentTimeline[];
  courierInfo?: {
    name: string;
    phone: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface DeliveryWebhook {
  partnerId: UUID;
  trackingNumber: string;
  status: OrderStatus;
  timestamp: ISODateTime;
  location?: string;
  notes?: string;
  signature?: string; // HMAC signature for verification
}
