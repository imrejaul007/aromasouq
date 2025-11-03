# AromaSouQ Rewards System API Documentation

## Overview

The Rewards System provides a comprehensive loyalty and cashback program for AromaSouQ customers. It includes three types of coins (Branded, Universal, and Promo), cashback tracking, and promotional campaigns.

**Base URL**: `http://localhost:3100/api`

---

## Table of Contents

1. [Rewards API](#rewards-api)
2. [Cashback API](#cashback-api)
3. [Campaigns API](#campaigns-api)
4. [Data Models](#data-models)
5. [Business Logic](#business-logic)

---

## Rewards API

### Get User Wallet

Get complete wallet information including all coin types and cashback balance.

**Endpoint**: `GET /rewards/wallet/:userId`

**Response**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "brandedCoins": 500,
  "universalCoins": 200,
  "promoCoins": 100,
  "cashbackBalance": 1500,
  "cashbackBalanceAED": "15.00",
  "lifetimeCashbackEarned": 5000,
  "lifetimeCashbackEarnedAED": "50.00",
  "totalCoinsEarned": 2000,
  "totalCoinsRedeemed": 1200,
  "brandedBreakdown": [
    {
      "brandId": "uuid",
      "brandName": "Dior",
      "brandSlug": "dior",
      "balance": 300,
      "lifetimeEarned": 500,
      "lifetimeRedeemed": 200
    }
  ]
}
```

---

### Get Branded Coins Breakdown

Get detailed per-brand coin balances.

**Endpoint**: `GET /rewards/wallet/:userId/branded-coins`

**Response**:
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "brandId": "uuid",
    "brandName": "Dior",
    "brandSlug": "dior",
    "balance": 300,
    "lifetimeEarned": 500,
    "lifetimeRedeemed": 200,
    "expiresAt": "2025-12-31T23:59:59Z"
  }
]
```

---

### Earn Coins

Award coins to a user for various activities.

**Endpoint**: `POST /rewards/coins/earn`

**Request Body**:
```json
{
  "userId": "uuid",
  "coinType": "BRANDED",
  "amount": 100,
  "reason": "PURCHASE",
  "brandId": "uuid",
  "brandName": "Dior",
  "brandSlug": "dior",
  "orderId": "uuid",
  "description": "Earned 100 Dior coins for purchase",
  "expiresInDays": 90
}
```

**Coin Types**:
- `BRANDED` - Per-brand coins (can only be used with that brand)
- `UNIVERSAL` - Platform-wide coins (can be used anywhere)
- `PROMO` - Campaign-based promotional coins

**Earn Reasons**:
- `PURCHASE` - Earned from product purchase
- `REVIEW` - Earned from writing a review
- `REFERRAL` - Earned from referring a friend
- `SIGNUP_BONUS` - Welcome bonus for new users
- `BIRTHDAY` - Birthday reward
- `CAMPAIGN` - Campaign-based reward
- `ADMIN_BONUS` - Manual bonus from admin
- `SOCIAL_SHARE` - Earned from social media sharing
- `FIRST_ORDER` - First order bonus

**Response**:
```json
{
  "transaction": {
    "id": "uuid",
    "userId": "uuid",
    "type": "EARN",
    "coinType": "BRANDED",
    "amount": 100,
    "balanceBefore": 200,
    "balanceAfter": 300,
    "description": "Earned 100 Dior coins for purchase",
    "status": "COMPLETED",
    "createdAt": "2025-11-03T10:00:00Z"
  },
  "wallet": {
    "brandedCoins": 300,
    "universalCoins": 200,
    "promoCoins": 100
  }
}
```

---

### Redeem Coins

Redeem coins for discounts, free products, or other benefits.

**Endpoint**: `POST /rewards/coins/redeem`

**Request Body**:
```json
{
  "userId": "uuid",
  "coinType": "BRANDED",
  "amount": 50,
  "redemptionType": "DISCOUNT",
  "orderId": "uuid",
  "brandId": "uuid",
  "description": "Redeemed 50 Dior coins for 5 AED discount"
}
```

**Redemption Types**:
- `DISCOUNT` - Apply discount to order
- `FREE_PRODUCT` - Redeem for free product
- `FREE_SHIPPING` - Redeem for free shipping
- `CASHBACK_CONVERSION` - Convert to cashback

**Response**:
```json
{
  "transaction": {
    "id": "uuid",
    "type": "REDEEM",
    "amount": -50,
    "balanceBefore": 300,
    "balanceAfter": 250,
    "status": "COMPLETED"
  },
  "wallet": {
    "brandedCoins": 250
  }
}
```

---

### Check Redemption Eligibility

Check if a user has enough coins for redemption.

**Endpoint**: `POST /rewards/coins/check-redemption`

**Request Body**:
```json
{
  "userId": "uuid",
  "coinType": "BRANDED",
  "amount": 50,
  "brandId": "uuid"
}
```

**Response**:
```json
{
  "canRedeem": true,
  "available": 300,
  "required": 50,
  "shortage": 0
}
```

---

### Get Coin Transactions

Get transaction history with pagination and filters.

**Endpoint**: `GET /rewards/transactions/:userId`

**Query Parameters**:
- `coinType` (optional): Filter by coin type (BRANDED, UNIVERSAL, PROMO)
- `type` (optional): Filter by transaction type (EARN, REDEEM, EXPIRE, BONUS, REFUND)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "EARN",
      "coinType": "BRANDED",
      "amount": 100,
      "brandName": "Dior",
      "reason": "PURCHASE",
      "description": "Earned 100 Dior coins",
      "balanceBefore": 200,
      "balanceAfter": 300,
      "status": "COMPLETED",
      "createdAt": "2025-11-03T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### Get Transaction by ID

Get detailed information about a specific transaction.

**Endpoint**: `GET /rewards/transactions/:userId/:transactionId`

**Response**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "EARN",
  "coinType": "BRANDED",
  "amount": 100,
  "brandId": "uuid",
  "brandName": "Dior",
  "reason": "PURCHASE",
  "orderId": "uuid",
  "balanceBefore": 200,
  "balanceAfter": 300,
  "description": "Earned 100 Dior coins for purchase",
  "metadata": {},
  "status": "COMPLETED",
  "createdAt": "2025-11-03T10:00:00Z"
}
```

---

## Cashback API

### Earn Cashback

Create a pending cashback transaction (will be credited after order delivery).

**Endpoint**: `POST /cashback/earn`

**Request Body**:
```json
{
  "userId": "uuid",
  "amount": 500,
  "orderId": "uuid",
  "orderNumber": "ORD-12345",
  "productName": "Dior Sauvage 100ml",
  "cashbackRate": 5.0,
  "description": "5% cashback on Dior Sauvage",
  "pendingDays": 7
}
```

**Note**: Amount is in **Fils** (1 AED = 100 Fils). So 500 Fils = 5 AED.

**Response**:
```json
{
  "transaction": {
    "id": "uuid",
    "type": "EARN",
    "amount": 500,
    "amountAED": "5.00",
    "status": "PENDING",
    "pendingUntil": "2025-11-10T10:00:00Z",
    "createdAt": "2025-11-03T10:00:00Z"
  },
  "message": "Cashback of 5.00 AED is pending. Will be credited after order delivery."
}
```

---

### Credit Cashback

Credit a pending cashback transaction (called after order is delivered).

**Endpoint**: `POST /cashback/credit/:transactionId`

**Response**:
```json
{
  "transaction": {
    "id": "uuid",
    "status": "CREDITED",
    "balanceBefore": 1000,
    "balanceAfter": 1500,
    "creditedAt": "2025-11-10T10:00:00Z"
  },
  "wallet": {
    "cashbackBalance": 1500,
    "lifetimeCashbackEarned": 3000
  }
}
```

---

### Credit Cashback by Order ID

Credit all pending cashback for a specific order.

**Endpoint**: `POST /cashback/credit/order/:orderId`

**Response**:
```json
{
  "credited": 3,
  "failed": 0,
  "details": [
    {
      "success": true,
      "transactionId": "uuid",
      "result": { ... }
    }
  ]
}
```

---

### Redeem Cashback

Transfer cashback balance to main wallet (minimum 10 AED).

**Endpoint**: `POST /cashback/redeem`

**Request Body**:
```json
{
  "userId": "uuid",
  "amount": 1000
}
```

**Note**: Minimum redemption is 1000 Fils (10 AED).

**Response**:
```json
{
  "cashbackTransaction": {
    "id": "uuid",
    "type": "REDEEM",
    "amount": -1000,
    "amountAED": "-10.00",
    "status": "REDEEMED"
  },
  "walletTransaction": {
    "id": "uuid",
    "type": "CREDIT",
    "amount": "10.00",
    "reason": "CASHBACK"
  },
  "message": "Successfully redeemed 10.00 AED to your wallet",
  "newCashbackBalance": "5.00",
  "newWalletBalance": "110.00"
}
```

---

### Cancel Cashback

Cancel a pending cashback transaction.

**Endpoint**: `POST /cashback/cancel/:transactionId`

**Response**:
```json
{
  "id": "uuid",
  "status": "CANCELLED"
}
```

---

### Cancel Cashback by Order ID

Cancel all pending cashback for an order (e.g., when order is cancelled).

**Endpoint**: `POST /cashback/cancel/order/:orderId`

**Response**:
```json
{
  "cancelled": 2,
  "message": "Cancelled 2 pending cashback transaction(s)"
}
```

---

### Get Cashback Transactions

Get cashback transaction history.

**Endpoint**: `GET /cashback/transactions/:userId`

**Query Parameters**:
- `type` (optional): Filter by type (EARN, REDEEM, EXPIRE)
- `status` (optional): Filter by status (PENDING, CREDITED, REDEEMED, EXPIRED, CANCELLED)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "EARN",
      "amount": 500,
      "amountAED": "5.00",
      "orderId": "uuid",
      "orderNumber": "ORD-12345",
      "cashbackRate": "5.00",
      "status": "CREDITED",
      "creditedAt": "2025-11-10T10:00:00Z",
      "createdAt": "2025-11-03T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### Get Pending Cashback

Get all pending cashback for a user.

**Endpoint**: `GET /cashback/pending/:userId`

**Response**:
```json
{
  "transactions": [
    {
      "id": "uuid",
      "amount": 500,
      "amountAED": "5.00",
      "orderNumber": "ORD-12345",
      "status": "PENDING",
      "pendingUntil": "2025-11-10T10:00:00Z"
    }
  ],
  "totalPendingFils": 1500,
  "totalPendingAED": "15.00",
  "count": 3
}
```

---

## Campaigns API

### Create Campaign

Create a new promotional campaign (Admin only).

**Endpoint**: `POST /campaigns`

**Request Body**:
```json
{
  "name": "Black Friday Bonus",
  "description": "Earn 2x coins on all purchases",
  "type": "SEASONAL",
  "coinType": "UNIVERSAL",
  "coinAmount": 200,
  "minPurchaseAmount": 100,
  "brandIds": [],
  "productIds": [],
  "userSegment": "vip",
  "startDate": "2025-11-25T00:00:00Z",
  "endDate": "2025-11-27T23:59:59Z",
  "maxRedemptions": 1000,
  "maxRedemptionsPerUser": 1
}
```

**Campaign Types**:
- `SIGNUP_BONUS` - New user welcome bonus
- `PURCHASE_REWARD` - Purchase-based rewards
- `REFERRAL` - Referral program
- `SEASONAL` - Holiday/seasonal campaigns
- `FLASH` - Limited-time flash campaigns
- `VIP` - VIP customer exclusive
- `BIRTHDAY` - Birthday rewards

**Response**:
```json
{
  "id": "uuid",
  "name": "Black Friday Bonus",
  "type": "SEASONAL",
  "coinType": "UNIVERSAL",
  "coinAmount": 200,
  "isActive": true,
  "startDate": "2025-11-25T00:00:00Z",
  "endDate": "2025-11-27T23:59:59Z",
  "totalRedemptions": 0
}
```

---

### Get Campaigns

Get all campaigns with filtering.

**Endpoint**: `GET /campaigns`

**Query Parameters**:
- `type` (optional): Filter by campaign type
- `isActive` (optional): Filter by active status (true/false)
- `includeExpired` (optional): Include expired campaigns (true/false)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Black Friday Bonus",
      "type": "SEASONAL",
      "coinType": "UNIVERSAL",
      "coinAmount": 200,
      "cashbackRate": null,
      "minPurchaseAmount": "100.00",
      "isActive": true,
      "totalRedemptions": 245
    }
  ],
  "pagination": { ... }
}
```

---

### Get Active Campaigns

Get all currently active campaigns.

**Endpoint**: `GET /campaigns/active`

**Query Parameters**:
- `type` (optional): Filter by campaign type

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Black Friday Bonus",
    "description": "Earn 2x coins on all purchases",
    "coinType": "UNIVERSAL",
    "coinAmount": 200,
    "startDate": "2025-11-25T00:00:00Z",
    "endDate": "2025-11-27T23:59:59Z"
  }
]
```

---

### Get Campaign by ID

Get detailed campaign information.

**Endpoint**: `GET /campaigns/:id`

**Response**:
```json
{
  "id": "uuid",
  "name": "Black Friday Bonus",
  "description": "Earn 2x coins on all purchases",
  "type": "SEASONAL",
  "coinType": "UNIVERSAL",
  "coinAmount": 200,
  "cashbackRate": null,
  "minPurchaseAmount": "100.00",
  "brandIds": [],
  "productIds": [],
  "userSegment": "vip",
  "startDate": "2025-11-25T00:00:00Z",
  "endDate": "2025-11-27T23:59:59Z",
  "maxRedemptions": 1000,
  "maxRedemptionsPerUser": 1,
  "totalRedemptions": 245,
  "isActive": true
}
```

---

### Update Campaign

Update campaign details (Admin only).

**Endpoint**: `PUT /campaigns/:id`

**Request Body**: Same as Create Campaign, but all fields optional.

---

### Delete Campaign

Delete a campaign (Admin only).

**Endpoint**: `DELETE /campaigns/:id`

**Response**:
```json
{
  "message": "Campaign deleted successfully"
}
```

---

### Deactivate Campaign

Deactivate a campaign without deleting it.

**Endpoint**: `POST /campaigns/:id/deactivate`

**Response**:
```json
{
  "id": "uuid",
  "isActive": false
}
```

---

### Check Eligibility

Check if a user is eligible for a specific campaign.

**Endpoint**: `POST /campaigns/check-eligibility`

**Request Body**:
```json
{
  "userId": "uuid",
  "campaignId": "uuid",
  "orderData": {
    "total": 150,
    "items": [
      {
        "productId": "uuid",
        "brandId": "uuid"
      }
    ]
  }
}
```

**Response (Eligible)**:
```json
{
  "eligible": true,
  "campaign": {
    "id": "uuid",
    "name": "Black Friday Bonus",
    "coinType": "UNIVERSAL",
    "coinAmount": 200
  }
}
```

**Response (Not Eligible)**:
```json
{
  "eligible": false,
  "reason": "Minimum purchase amount is 100.00 AED"
}
```

---

### Get Eligible Campaigns

Get all campaigns a user is eligible for.

**Endpoint**: `POST /campaigns/eligible/:userId`

**Request Body** (optional):
```json
{
  "total": 150,
  "items": [ ... ]
}
```

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Black Friday Bonus",
    "coinAmount": 200,
    "eligibility": {
      "eligible": true,
      "campaign": { ... }
    }
  }
]
```

---

### Apply Campaign

Apply a campaign to earn rewards.

**Endpoint**: `POST /campaigns/apply`

**Request Body**:
```json
{
  "userId": "uuid",
  "campaignId": "uuid",
  "orderData": {
    "total": 150
  }
}
```

**Response**:
```json
{
  "campaignId": "uuid",
  "campaignName": "Black Friday Bonus",
  "coinType": "UNIVERSAL",
  "rewardAmount": 200,
  "message": "Campaign \"Black Friday Bonus\" applied successfully"
}
```

---

### Get Campaign Stats

Get detailed statistics for a campaign (Admin only).

**Endpoint**: `GET /campaigns/:id/stats`

**Response**:
```json
{
  "campaign": {
    "id": "uuid",
    "name": "Black Friday Bonus",
    "type": "SEASONAL",
    "isActive": true
  },
  "stats": {
    "totalRedemptions": 245,
    "totalCoinsAwarded": 49000,
    "uniqueUsers": 245,
    "averageCoinsPerUser": 200,
    "remainingRedemptions": 755
  }
}
```

---

## Data Models

### CoinWallet

```typescript
{
  id: string;
  userId: string;
  brandedCoins: number;
  universalCoins: number;
  promoCoins: number;
  cashbackBalance: number; // In Fils
  lifetimeCashbackEarned: number; // In Fils
  totalCoinsEarned: number;
  totalCoinsRedeemed: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### CoinTransaction

```typescript
{
  id: string;
  userId: string;
  type: CoinTransactionType; // EARN, REDEEM, EXPIRE, BONUS, REFUND
  coinType: CoinType; // BRANDED, UNIVERSAL, PROMO
  amount: number;
  brandId?: string;
  brandName?: string;
  reason?: CoinEarnReason;
  redemptionType?: CoinRedemptionType;
  orderId?: string;
  productId?: string;
  reviewId?: string;
  referralId?: string;
  campaignId?: string;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  metadata?: any;
  expiresAt?: Date;
  status: CoinTransactionStatus; // PENDING, COMPLETED, FAILED, EXPIRED, REVERSED
  createdAt: Date;
  updatedAt: Date;
}
```

### CashbackTransaction

```typescript
{
  id: string;
  userId: string;
  type: CashbackType; // EARN, REDEEM, EXPIRE
  amount: number; // In Fils
  amountAED: Decimal; // Display format
  orderId?: string;
  orderNumber?: string;
  productId?: string;
  productName?: string;
  cashbackRate?: Decimal; // Percentage
  balanceBefore: number; // In Fils
  balanceAfter: number; // In Fils
  description: string;
  status: CashbackStatus; // PENDING, CREDITED, REDEEMED, EXPIRED, CANCELLED
  pendingUntil?: Date;
  creditedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Business Logic

### Earning Rules

**Branded Coins (Per-brand)**:
- 20% of order value in brand-specific coins
- Can only be used with products from that brand
- Expires after 90 days (configurable)

**Universal Coins (Platform-wide)**:
- 2% of order value in universal coins
- Can be used on any product
- No expiration

**Cashback**:
- 1-10% of order value (product/brand specific)
- Stored in Fils (1 AED = 100 Fils)
- Pending until order is delivered (7 days default)
- Can be redeemed to main wallet (minimum 10 AED)

### Redemption Rules

**Coin Redemption**:
- 10 coins = 1 AED discount
- Maximum 50% of order value can be paid with coins
- Branded coins must match product brand
- Universal/Promo coins can be used anywhere

**Cashback Redemption**:
- Minimum redemption: 10 AED (1000 Fils)
- Transfers to main wallet immediately
- No fees or restrictions

### Expiry Logic

**Coins**:
- Branded coins: 90 days from earning
- Universal coins: No expiry
- Promo coins: Campaign-specific expiry
- CRON job runs daily to expire old coins

**Cashback**:
- Pending cashback: 90 days from order date
- If not credited within 90 days, automatically expires
- CRON job runs daily to expire old cashback

### Campaign Rules

**Eligibility Checks**:
1. Campaign must be active and within date range
2. User hasn't exceeded max redemptions
3. Order meets minimum purchase amount (if set)
4. Order contains eligible brands/products (if restricted)
5. User matches target segment (new/vip/etc.)

**Application**:
1. Check eligibility
2. Calculate reward amount
3. Create coin/cashback transaction
4. Increment campaign redemption count

---

## Error Handling

All endpoints return standard HTTP status codes:

- **200 OK**: Successful GET/POST/PUT
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid input or business logic error
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

**Error Response Format**:
```json
{
  "statusCode": 400,
  "message": "Insufficient branded coins for this brand",
  "error": "Bad Request"
}
```

---

## Integration Examples

### Order Service Integration

When an order is placed:

```typescript
// 1. Earn branded coins (20% of order value)
await rewardsService.earnCoins({
  userId: order.userId,
  coinType: 'BRANDED',
  amount: Math.floor(orderTotal * 0.20 * 10), // 20% as coins
  reason: 'PURCHASE',
  brandId: product.brandId,
  brandName: product.brandName,
  orderId: order.id,
  description: `Earned coins from order ${order.orderNumber}`,
  expiresInDays: 90,
});

// 2. Earn universal coins (2% of order value)
await rewardsService.earnCoins({
  userId: order.userId,
  coinType: 'UNIVERSAL',
  amount: Math.floor(orderTotal * 0.02 * 10), // 2% as coins
  reason: 'PURCHASE',
  orderId: order.id,
  description: `Universal coins from order ${order.orderNumber}`,
});

// 3. Earn cashback (product-specific rate)
await cashbackService.earnCashback({
  userId: order.userId,
  amount: Math.floor(orderTotal * product.cashbackRate), // In Fils
  orderId: order.id,
  orderNumber: order.orderNumber,
  productName: product.name,
  cashbackRate: product.cashbackRate,
  description: `${product.cashbackRate}% cashback`,
  pendingDays: 7,
});
```

When order is delivered:

```typescript
// Credit all pending cashback for the order
await cashbackService.creditCashbackByOrderId(order.id);
```

When order is cancelled:

```typescript
// Cancel all pending cashback
await cashbackService.cancelCashbackByOrderId(order.id);
```

---

## CRON Jobs

### Expire Coins

**Schedule**: Daily at 00:00 UTC

**Endpoint**: `POST /rewards/admin/expire-coins`

**Purpose**: Expire coins that have passed their expiry date.

### Expire Cashback

**Schedule**: Daily at 00:00 UTC

**Endpoint**: `POST /cashback/admin/expire`

**Purpose**: Expire pending cashback that has exceeded the pending period.

---

## Summary

The Rewards System provides:

✅ **3 Coin Types**: Branded, Universal, and Promo
✅ **Cashback System**: Pending → Credited → Redeemed workflow
✅ **Campaign Management**: Flexible promotional campaigns
✅ **Complete Audit Trail**: Every transaction tracked
✅ **Expiry Management**: Automated expiry of old rewards
✅ **Balance Validation**: Prevents over-redemption
✅ **Transaction Safety**: Prisma transactions for atomicity

**Zero Errors**: All code compiles successfully with TypeScript strict mode.
