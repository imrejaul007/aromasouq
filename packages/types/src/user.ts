import { UUID, ISODateTime, Timestamps, UserRole, Address } from './common';

export interface User extends Timestamps {
  id: UUID;
  email: string;
  phone?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  password: string; // hashed
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  isBanned: boolean;
  lastLoginAt?: ISODateTime;
  preferences: UserPreferences;
  walletBalance: number;
  totalSpent: number;
  totalOrders: number;
}

export interface UserPreferences {
  language: 'en' | 'ar';
  currency: 'AED' | 'USD' | 'SAR';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  marketing: {
    emailMarketing: boolean;
    smsMarketing: boolean;
  };
}

export interface UserProfile {
  id: UUID;
  user: User;
  bio?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  addresses: Address[];
  favoriteProducts: UUID[];
  wishlist: UUID[];
  recentlyViewed: UUID[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  agreeToTerms: boolean;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  tokens: AuthTokens;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface VerifyOTPRequest {
  phone: string;
  otp: string;
}

export interface WalletTransaction extends Timestamps {
  id: UUID;
  userId: UUID;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  reason: 'order' | 'refund' | 'cashback' | 'bonus' | 'withdrawal';
  referenceId?: UUID;
  balanceBefore: number;
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
}
