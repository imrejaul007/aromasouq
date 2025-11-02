# Order Service - Complete Implementation Guide
## AromaSouQ Platform - World-Class Multi-Vendor Order Management

---

## 🎯 Overview

The Order Service is the **heart of the e-commerce flow**, handling:
- Shopping cart management (guest + authenticated users)
- Multi-vendor order splitting
- Checkout process with validation
- Order state management (15 states)
- Inventory reservations
- Returns & refunds system
- Coupon & discount engine
- Commission calculations
- Timeline tracking with audit trail

---

## 📊 Database Schema (COMPLETED ✅)

**17 Models | 542 Lines | Production-Ready**

### Core Models:
1. **Cart** & **CartItem** - Shopping cart with guest support
2. **Order** - Main order with 15 status states
3. **SubOrder** - Vendor-specific order splits
4. **OrderItem** - Individual product items
5. **OrderTimeline** & **SubOrderTimeline** - Audit trails
6. **InventoryReservation** - Stock hold system
7. **ReturnRequest**, **ReturnItem**, **ReturnTimeline** - Returns system
8. **Coupon** & **CouponUsage** - Discount engine

### Key Features in Schema:
- ✅ Multi-vendor splitting with commission tracking
- ✅ Comprehensive timeline/audit system
- ✅ Inventory reservation with expiration
- ✅ Full returns & refunds flow
- ✅ Coupon system with complex rules
- ✅ 27+ database indexes for performance
- ✅ JSON fields for flexibility (addresses, metadata, etc.)
- ✅ Decimal precision for all monetary values

---

## 🏗️ Architecture

```
Order Service (NestJS + PostgreSQL + Prisma)
│
├── Cart Module
│   ├── Add/Remove items
│   ├── Update quantities
│   ├── Apply coupons
│   ├── Calculate totals
│   ├── Guest cart support
│   └── Cart expiration cleanup
│
├── Orders Module
│   ├── Create order from cart
│   ├── Multi-vendor splitting logic
│   ├── Order status transitions
│   ├── Order history
│   ├── Order tracking
│   ├── Cancel order
│   └── Admin order management
│
├── Coupons Module
│   ├── Validate coupon
│   ├── Apply discount
│   ├── Usage tracking
│   ├── Coupon CRUD (admin)
│   └── Complex rule engine
│
├── Returns Module
│   ├── Create return request
│   ├── Approve/reject returns
│   ├── Schedule pickup
│   ├── Process refund
│   └── Return timeline tracking
│
└── Common Services
    ├── Pricing Calculator
    ├── Tax Calculator
    ├── Commission Calculator
    ├── Inventory Manager
    ├── Order Number Generator
    └── Timeline Tracker
```

---

## 📦 Implementation Checklist

### Phase 1: Foundation (2-3 days)

#### 1.1 Setup & Configuration
- [x] Prisma schema created (DONE ✅)
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Create Prisma service
- [ ] Run migrations

#### 1.2 Common Services
```typescript
// src/common/services/pricing.service.ts
export class PricingService {
  calculateSubtotal(items: CartItem[]): number
  calculateTax(subtotal: number, taxRate: number): number
  calculateShipping(items: CartItem[], deliveryType: string): number
  calculateDiscount(subtotal: number, coupon: Coupon): number
  calculateTotal(breakdown: PriceBreakdown): number
  calculateCashback(total: number, cashbackRate: number): number
}

// src/common/services/order-number.service.ts
export class OrderNumberService {
  generateOrderNumber(): string // ORD-2024-001234
  generateSubOrderNumber(orderNumber: string, index: number): string
  generateReturnNumber(): string // RET-2024-001234
}

// src/common/services/commission.service.ts
export class CommissionService {
  calculateCommission(amount: number, rate: number): number
  calculateVendorPayout(total: number, commission: number): number
  getCommissionRate(vendorId: string): Promise<number>
}
```

---

### Phase 2: Cart Module (3-4 days)

#### 2.1 Cart DTOs
```typescript
// src/cart/dto/add-to-cart.dto.ts
export class AddToCartDto {
  productId: string;
  vendorId: string;
  quantity: number;
  attributes?: Record<string, any>;
}

// src/cart/dto/update-cart-item.dto.ts
export class UpdateCartItemDto {
  quantity: number;
}

// src/cart/dto/apply-coupon.dto.ts
export class ApplyCouponDto {
  code: string;
}
```

#### 2.2 Cart Service
```typescript
// src/cart/cart.service.ts
export class CartService {
  // Cart operations
  async getOrCreateCart(userId: string): Promise<Cart>
  async addItem(userId: string, dto: AddToCartDto): Promise<Cart>
  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<Cart>
  async removeItem(userId: string, itemId: string): Promise<Cart>
  async clearCart(userId: string): Promise<void>
  
  // Coupon operations
  async applyCoupon(userId: string, code: string): Promise<Cart>
  async removeCoupon(userId: string, code: string): Promise<Cart>
  
  // Calculations
  async calculateTotals(cart: Cart): Promise<Cart>
  async validateCart(cart: Cart): Promise<ValidationResult>
  async checkInventory(cart: Cart): Promise<boolean>
  
  // Guest cart
  async getGuestCart(sessionId: string): Promise<Cart>
  async mergeGuestCart(userId: string, sessionId: string): Promise<Cart>
}
```

#### 2.3 Cart Controller
```typescript
// src/cart/cart.controller.ts
@Controller('cart')
export class CartController {
  @Get()                              // GET /api/cart
  @Post('items')                      // POST /api/cart/items
  @Patch('items/:id')                 // PATCH /api/cart/items/:id
  @Delete('items/:id')                // DELETE /api/cart/items/:id
  @Delete()                           // DELETE /api/cart
  @Post('coupons')                    // POST /api/cart/coupons
  @Delete('coupons/:code')            // DELETE /api/cart/coupons/:code
  @Post('validate')                   // POST /api/cart/validate
}
```

**Cart Endpoints**: 8

---

### Phase 3: Orders Module (5-6 days)

#### 3.1 Order DTOs
```typescript
// src/orders/dto/create-order.dto.ts
export class CreateOrderDto {
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethod: PaymentMethod;
  deliveryType: DeliveryType;
  customerNotes?: string;
  isGift?: boolean;
  giftMessage?: string;
  useWallet?: boolean;
  walletAmount?: number;
}

// src/orders/dto/update-order-status.dto.ts
export class UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
  trackingNumber?: string;
  courierName?: string;
}

// src/orders/dto/cancel-order.dto.ts
export class CancelOrderDto {
  reason: string;
  reasonCode: string;
}
```

#### 3.2 Order Service
```typescript
// src/orders/orders.service.ts
export class OrdersService {
  // Order creation
  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order>
  async splitOrderByVendor(cart: Cart): Promise<SubOrder[]>
  async reserveInventory(order: Order): Promise<void>
  async processPayment(order: Order): Promise<PaymentResult>
  
  // Order retrieval
  async getOrders(userId: string, filters: OrderFilters): Promise<PaginatedOrders>
  async getOrder(orderId: string): Promise<Order>
  async getOrderByNumber(orderNumber: string): Promise<Order>
  async getVendorOrders(vendorId: string, filters: OrderFilters): Promise<PaginatedOrders>
  
  // Order updates
  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto): Promise<Order>
  async updateSubOrderStatus(subOrderId: string, dto: UpdateOrderStatusDto): Promise<SubOrder>
  async addTracking(subOrderId: string, trackingNumber: string, courierName: string): Promise<SubOrder>
  
  // Order cancellation
  async cancelOrder(orderId: string, dto: CancelOrderDto): Promise<Order>
  async cancelSubOrder(subOrderId: string, dto: CancelOrderDto): Promise<SubOrder>
  
  // Timeline
  async addOrderTimeline(orderId: string, status: OrderStatus, message: string): Promise<void>
  async getOrderTimeline(orderId: string): Promise<OrderTimeline[]>
  
  // Statistics
  async getOrderStats(userId: string): Promise<OrderStats>
  async getVendorStats(vendorId: string): Promise<VendorStats>
}
```

#### 3.3 Multi-Vendor Splitting Logic
```typescript
async splitOrderByVendor(cart: Cart): Promise<SubOrder[]> {
  // Group cart items by vendor
  const vendorGroups = cart.items.reduce((groups, item) => {
    if (!groups[item.vendorId]) {
      groups[item.vendorId] = [];
    }
    groups[item.vendorId].push(item);
    return groups;
  }, {});

  // Create sub-order for each vendor
  const subOrders = [];
  let subOrderIndex = 1;
  
  for (const [vendorId, items] of Object.entries(vendorGroups)) {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * (this.config.vatRate / 100);
    const shippingFee = this.calculateVendorShipping(items);
    const total = subtotal + tax + shippingFee;
    
    const commissionRate = await this.commissionService.getRate(vendorId);
    const commissionAmount = (total * commissionRate) / 100;
    const vendorPayout = total - commissionAmount;
    
    subOrders.push({
      subOrderNumber: this.orderNumberService.generateSubOrderNumber(orderNumber, subOrderIndex++),
      vendorId,
      vendorName: items[0].vendorName,
      items,
      subtotal,
      tax,
      shippingFee,
      total,
      commissionRate,
      commissionAmount,
      vendorPayout,
      status: 'PENDING',
    });
  }
  
  return subOrders;
}
```

#### 3.4 Order Controller
```typescript
// src/orders/orders.controller.ts
@Controller('orders')
export class OrdersController {
  @Post()                                  // POST /api/orders (create from cart)
  @Get()                                   // GET /api/orders (user orders)
  @Get(':id')                              // GET /api/orders/:id
  @Get('number/:orderNumber')              // GET /api/orders/number/ORD-2024-001234
  @Patch(':id/status')                     // PATCH /api/orders/:id/status
  @Post(':id/cancel')                      // POST /api/orders/:id/cancel
  @Get(':id/timeline')                     // GET /api/orders/:id/timeline
  @Get(':id/track')                        // GET /api/orders/:id/track
  
  // Sub-orders
  @Get('suborders/:id')                    // GET /api/orders/suborders/:id
  @Patch('suborders/:id/status')           // PATCH /api/orders/suborders/:id/status
  @Patch('suborders/:id/tracking')         // PATCH /api/orders/suborders/:id/tracking
  
  // Vendor endpoints
  @Get('vendor/orders')                    // GET /api/orders/vendor/orders
  @Get('vendor/stats')                     // GET /api/orders/vendor/stats
  
  // Statistics
  @Get('user/stats')                       // GET /api/orders/user/stats
}
```

**Order Endpoints**: 15+

---

### Phase 4: Coupons Module (2-3 days)

#### 4.1 Coupon Service
```typescript
// src/coupons/coupons.service.ts
export class CouponsService {
  // Validation
  async validateCoupon(code: string, userId: string, cart: Cart): Promise<ValidationResult>
  async checkEligibility(coupon: Coupon, userId: string, cart: Cart): Promise<boolean>
  async checkUsageLimit(coupon: Coupon, userId: string): Promise<boolean>
  
  // Calculation
  async calculateDiscount(coupon: Coupon, cart: Cart): Promise<number>
  
  // Application
  async applyCoupon(code: string, userId: string, orderId: string): Promise<CouponUsage>
  
  // CRUD (Admin)
  async createCoupon(dto: CreateCouponDto): Promise<Coupon>
  async updateCoupon(id: string, dto: UpdateCouponDto): Promise<Coupon>
  async deactivateCoupon(id: string): Promise<Coupon>
  async getCoupons(filters: CouponFilters): Promise<PaginatedCoupons>
  async getCouponUsage(code: string): Promise<CouponUsage[]>
}
```

#### 4.2 Coupon Engine Logic
```typescript
async calculateDiscount(coupon: Coupon, cart: Cart): Promise<number> {
  let discount = 0;
  
  switch (coupon.type) {
    case 'PERCENTAGE':
      discount = (cart.subtotal * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
      break;
      
    case 'FIXED_AMOUNT':
      discount = coupon.value;
      break;
      
    case 'FREE_SHIPPING':
      discount = cart.shippingFee;
      break;
      
    case 'BUY_X_GET_Y':
      // Complex logic for buy X get Y offers
      discount = this.calculateBuyXGetY(coupon, cart);
      break;
  }
  
  return discount;
}
```

**Coupon Endpoints**: 8

---

### Phase 5: Returns Module (3-4 days)

#### 5.1 Return Service
```typescript
// src/returns/returns.service.ts
export class ReturnsService {
  async createReturn(userId: string, dto: CreateReturnDto): Promise<ReturnRequest>
  async approveReturn(returnId: string, notes?: string): Promise<ReturnRequest>
  async rejectReturn(returnId: string, reason: string): Promise<ReturnRequest>
  async schedulePickup(returnId: string, pickupDate: Date): Promise<ReturnRequest>
  async markPickedUp(returnId: string): Promise<ReturnRequest>
  async markReceived(returnId: string, condition: string): Promise<ReturnRequest>
  async processRefund(returnId: string): Promise<ReturnRequest>
  async getReturns(userId: string, filters: ReturnFilters): Promise<PaginatedReturns>
  async getReturn(returnId: string): Promise<ReturnRequest>
  async addReturnTimeline(returnId: string, status: ReturnStatus, message: string): Promise<void>
}
```

**Return Endpoints**: 10

---

## 🔐 Security & Validation

### Input Validation
```typescript
// All DTOs use class-validator
export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}
```

### Authorization
```typescript
// Guards for different user types
@UseGuards(JwtAuthGuard)        // Authenticated users only
@UseGuards(VendorGuard)         // Vendor-only endpoints
@UseGuards(AdminGuard)          // Admin-only endpoints
```

### Data Privacy
- Sensitive data redacted in logs
- PII handled securely
- Audit trails for all changes

---

## 🚀 Integration Points

### External Service Calls
```typescript
// src/common/services/external.service.ts
export class ExternalService {
  // User Service
  async getUser(userId: string): Promise<User>
  async getUserAddresses(userId: string): Promise<Address[]>
  async updateWallet(userId: string, amount: number, type: 'credit' | 'debit'): Promise<void>
  
  // Product Service
  async getProduct(productId: string): Promise<Product>
  async checkStock(productId: string, vendorId: string, quantity: number): Promise<boolean>
  async updateStock(productId: string, vendorId: string, quantity: number): Promise<void>
  
  // Payment Service
  async createPaymentIntent(orderId: string, amount: number): Promise<PaymentIntent>
  async processPayment(paymentIntentId: string): Promise<PaymentResult>
  async refundPayment(paymentId: string, amount: number): Promise<RefundResult>
  
  // Delivery Service
  async createShipment(subOrder: SubOrder): Promise<Shipment>
  async getTracking(trackingNumber: string): Promise<TrackingInfo>
  async schedulePickup(returnRequest: ReturnRequest): Promise<PickupSchedule>
}
```

---

## 📊 API Endpoints Summary

| Module | Endpoints | Key Features |
|--------|-----------|--------------|
| Cart | 8 | Add/remove items, apply coupons, validate |
| Orders | 15+ | Create, track, cancel, vendor management |
| Coupons | 8 | Validate, apply, admin CRUD |
| Returns | 10 | Request, approve, refund, track |
| **TOTAL** | **41+** | **World-class order management** |

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
describe('CartService', () => {
  it('should add item to cart')
  it('should calculate totals correctly')
  it('should apply coupon discount')
  it('should validate cart before checkout')
  it('should handle out of stock items')
})

describe('OrdersService', () => {
  it('should create order from cart')
  it('should split order by vendor')
  it('should calculate commissions correctly')
  it('should reserve inventory')
  it('should handle payment failures')
})
```

### E2E Tests
```typescript
describe('Checkout Flow', () => {
  it('complete checkout flow: cart -> order -> payment')
  it('multi-vendor order splitting')
  it('order cancellation and refund')
  it('return and refund flow')
})
```

---

## 📈 Performance Optimization

### Database Indexes (27+)
- All foreign keys indexed
- Status fields indexed for filtering
- Timestamps indexed for sorting
- Composite indexes for common queries

### Caching Strategy
```typescript
// Redis caching for frequently accessed data
@Cacheable('cart', 300) // 5 minutes
async getCart(userId: string)

@Cacheable('order', 600) // 10 minutes
async getOrder(orderId: string)
```

### Query Optimization
```typescript
// Use Prisma's include/select for efficient queries
prisma.order.findMany({
  include: {
    subOrders: {
      include: {
        items: true,
        timeline: true,
      },
    },
    timeline: true,
  },
})
```

---

## 🎯 Implementation Roadmap

### Week 1
- ✅ Database schema (DONE)
- [ ] Environment setup
- [ ] Prisma migrations
- [ ] Common services (pricing, commission, order number)
- [ ] External service integrations

### Week 2
- [ ] Cart module (service + controller)
- [ ] Cart calculations and validation
- [ ] Guest cart support
- [ ] Unit tests for cart

### Week 3
- [ ] Orders module (service + controller)
- [ ] Multi-vendor splitting logic
- [ ] Order status state machine
- [ ] Inventory reservations
- [ ] Timeline tracking

### Week 4
- [ ] Coupons module
- [ ] Coupon validation engine
- [ ] Returns module
- [ ] Refund processing
- [ ] E2E tests

### Week 5
- [ ] Performance optimization
- [ ] Documentation
- [ ] Integration testing
- [ ] Production deployment preparation

---

## 💡 Next Steps

1. **Generate Prisma Client**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

2. **Install Dependencies**
   ```bash
   npm install @nestjs/axios axios date-fns
   ```

3. **Follow Module Implementation**
   - Start with Common Services
   - Then Cart Module
   - Then Orders Module
   - Finally Coupons & Returns

4. **Test Thoroughly**
   - Unit tests for each service
   - Integration tests between services
   - E2E tests for complete flows

---

## 📝 Estimated Effort

| Component | Lines of Code | Time Estimate |
|-----------|---------------|---------------|
| Database Schema | 542 | DONE ✅ |
| Common Services | 400 | 2 days |
| Cart Module | 600 | 3 days |
| Orders Module | 1,200 | 5 days |
| Coupons Module | 400 | 2 days |
| Returns Module | 500 | 3 days |
| Tests | 800 | 3 days |
| **TOTAL** | **~4,442 lines** | **18-20 days** |

---

## 🌟 World-Class Features

✅ Multi-vendor order splitting with commission tracking  
✅ Sophisticated coupon engine with complex rules  
✅ Complete returns & refunds workflow  
✅ Inventory reservation system  
✅ Guest cart support with session merging  
✅ 15-state order status machine  
✅ Comprehensive timeline/audit trails  
✅ Tax calculations with regional support  
✅ Cashback system  
✅ Gift orders with messages  
✅ Multiple payment methods  
✅ Multiple delivery types  
✅ Real-time tracking integration  
✅ Vendor payout calculations  
✅ 41+ REST endpoints  
✅ 27+ database indexes  
✅ Full validation & error handling  
✅ Production-ready architecture  

---

**Status**: Schema Complete ✅ | Implementation Guide Complete ✅  
**Next**: Follow this guide to build the complete Order Service  
**Effort**: 18-20 development days for experienced team

---

🤖 Generated with world-class expertise for AromaSouQ Platform 🌟
