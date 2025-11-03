# AromaSouQ - Master Implementation Plan

**Date**: January 2025
**Strategy**: Option 2 → 1 → 3 (11 weeks to complete MVP with AI)
**Requirement**: ZERO ERRORS - All code must compile and run successfully

---

## 🎯 IMPLEMENTATION SEQUENCE (DO NOT FORGET)

### ✅ PHASE 0: Current Status (Already Done)
- User Service: 100% ✅
- Product Service: 100% ✅
- Notification Service: 100% ✅
- Order Service: 85% ⚠️ (Schema alignment needed)
- Payment Service: 95% ⚠️ (Enum fixes needed)
- Delivery Service: 10% 📋 (Schema only, needs implementation)

---

## 🚀 OPTION 2: Fix Existing Services (Week 1) - IN PROGRESS

**Goal**: Achieve 100% completion on all 6 core services with ZERO errors

### Task 1.1: Order Service Schema Alignment (Day 1-2)
**Issues to Fix**:
1. ✅ Timeline fields: `message` (not `description`), auto `createdAt` (not `timestamp`)
2. ❌ OrderItem fields: Add `productSlug`, `unitPrice`, `subtotal`, `tax`
3. ❌ Coupon field mapping:
   - `validFrom` (not `startDate`)
   - `validUntil` (not `endDate`)
   - `currentUses` (not `usedCount`)
   - `maxUses` (not `usageLimit`)
   - `type` (not `discountType`)
   - `value` (not `discountValue`)
4. ❌ Address handling: Update create/include structure
5. ❌ PaymentMethod enum: Match schema exactly

**Files to Fix**:
- `services/order-service/src/orders/orders.service.ts` (485 lines)
- `services/order-service/src/orders/dto/create-order.dto.ts`
- `services/order-service/src/sub-orders/sub-orders.service.ts` (211 lines)

**Build Command**: `cd services/order-service && npm run build`
**Success Criteria**: 0 TypeScript errors

---

### Task 1.2: Payment Service Enum Fixes (Day 2)
**Issues to Fix**:
1. ❌ Replace `PaymentStatus.COMPLETED` → `PaymentStatus.SUCCEEDED`
2. ❌ Remove `refundId` field usage or verify schema
3. ❌ Remove `confirmedAt` field or add to schema
4. ❌ Fix `RefundReason` enum type
5. ❌ Update Stripe API version to `'2025-10-29.clover'`

**Files to Fix**:
- `services/payment-service/src/payments/payments.service.ts` (355 lines)
- `services/payment-service/src/stripe/stripe.service.ts` (165 lines)

**Build Command**: `cd services/payment-service && npm run build`
**Success Criteria**: 0 TypeScript errors

---

### Task 1.3: Delivery Service Implementation (Day 3-5)
**What to Build**:
1. ❌ Implement all services from DELIVERY_SERVICE_GUIDE.md
2. ❌ Create ShipmentsService (create, track, update, cancel)
3. ❌ Create CouriersService (manage carriers, get rates)
4. ❌ Create TrackingService (real-time updates)
5. ❌ Create DeliveryZonesService (geo-based rates)
6. ❌ Build 28 REST API endpoints
7. ❌ Integrate with Order Service

**Files to Create**:
- `services/delivery-service/src/shipments/shipments.service.ts`
- `services/delivery-service/src/shipments/shipments.controller.ts`
- `services/delivery-service/src/couriers/couriers.service.ts`
- `services/delivery-service/src/couriers/couriers.controller.ts`
- `services/delivery-service/src/tracking/tracking.service.ts`
- `services/delivery-service/src/zones/zones.service.ts`
- `services/delivery-service/src/prisma/prisma.service.ts`
- `services/delivery-service/src/app.module.ts`
- `services/delivery-service/src/main.ts`

**Build Command**: `cd services/delivery-service && npm run build`
**Success Criteria**: 0 TypeScript errors, all endpoints working

---

### Task 1.4: Integration Testing (Day 5)
**Tests to Run**:
1. ❌ Build all 6 services successfully
2. ❌ Start all services with Docker Compose
3. ❌ Test critical API flows:
   - User registration → Login → Get profile
   - Create product → Search → Get product
   - Create order → Process payment → Track delivery
   - Send notification → Check status
4. ❌ Verify database migrations work
5. ❌ Check all services communicate correctly

**Success Criteria**: All services running with 0 errors

---

## 🚀 OPTION 1: Phase 1 MVP Features (Weeks 2-7)

### Week 2: Product Enhancement Part 1
**Tasks**:
1. ❌ Add product type classification fields to schema
2. ❌ Add scent DNA structure to Product schema
3. ❌ Add longevity, projection, concentration fields
4. ❌ Add oud type classification
5. ❌ Add occasion/mood tagging
6. ❌ Add video content support
7. ❌ Update Product Service to handle new fields
8. ❌ Migration scripts for existing products

**New Schema Fields**:
```typescript
productType: 'ORIGINAL' | 'SIMILAR_DNA' | 'CLONE' | 'NICHE' | 'ATTAR' | 'BODYMIST' | 'OUD' | 'HOMEBAKHOOR'
scentDNA: {
  family: string[]
  notes: { top: string[], middle: string[], base: string[] }
  similarToBrand?: string
  dnaMatchScore?: number
}
oudType?: 'CAMBODIAN' | 'HINDI' | 'MALAYSIAN' | 'ARABIAN' | 'SYNTHETIC' | 'MIXED'
longevityHours: number (2-24)
projectionRating: number (1-10)
concentration: 'PARFUM' | 'EDP' | 'EDT' | 'EDC' | 'ATTAR' | 'OIL' | 'BODYMIST'
occasion: string[] // ['DAILY', 'EVENING', 'FORMAL', 'WEDDING', 'OFFICE']
mood: string[] // ['ROMANTIC', 'CONFIDENT', 'FRESH', 'MYSTERIOUS']
videoUrls: string[]
ugcVideos: { url: string, creatorId: string, views: number }[]
geoVisibility: string[] // ['AE', 'SA', 'KW', 'QA', 'OM', 'BH']
cashbackRate: number (0-100)
fulfillmentType: 'RETAIL' | 'WHOLESALE' | 'MANUFACTURING' | 'RAW_MATERIAL' | 'PACKAGING'
```

---

### Week 3: Product Enhancement Part 2 + Filters
**Tasks**:
1. ❌ Update Product Service APIs to accept new fields
2. ❌ Add "similar products" endpoint (by DNA)
3. ❌ Implement 15+ smart filters in search
4. ❌ Update Elasticsearch mappings
5. ❌ Add scent DNA filter
6. ❌ Add occasion/mood filter
7. ❌ Add longevity & projection filters
8. ❌ Add oud type filter
9. ❌ Add concentration filter
10. ❌ Add cashback % filter
11. ❌ Add geo visibility filter

**New Endpoints**:
- `GET /api/products/similar/:id` - Find similar products by DNA
- `GET /api/products/by-scent-family/:family` - Filter by scent family
- `GET /api/products/by-occasion/:occasion` - Filter by occasion
- `GET /api/products/clones/:brandName` - Find clones of brand

---

### Week 4: Rewards System (Coins + Cashback)
**Tasks**:
1. ❌ Create new Coin models in User Service schema:
   - BrandedCoin
   - UniversalCoin
   - PromoCoin
   - CashbackTransaction
2. ❌ Create CoinsService (earn, redeem, check balance)
3. ❌ Create CashbackService (auto-credit, rules engine)
4. ❌ Add coin earning triggers (on order completion)
5. ❌ Add coin redemption logic (during checkout)
6. ❌ Add expiry system for promo coins
7. ❌ Update Order Service to apply coins
8. ❌ Update Payment Service to apply cashback
9. ❌ Build 10+ coin/cashback endpoints

**New Endpoints**:
- `GET /api/coins/balance` - Get all coin balances
- `POST /api/coins/earn` - Earn coins (triggered by events)
- `POST /api/coins/redeem` - Redeem coins in order
- `GET /api/coins/history` - Coin transaction history
- `GET /api/cashback/balance` - Get cashback balance
- `GET /api/cashback/history` - Cashback history
- `POST /api/cashback/apply` - Apply cashback to order

---

### Week 5-6: Vendor Dashboard Service
**Tasks**:
1. ❌ Create new Vendor Dashboard Service (Port 3700)
2. ❌ Build Analytics Module:
   - Sales by period (daily, weekly, monthly)
   - Revenue tracking
   - Top products
   - Customer insights
   - Geo heatmaps
3. ❌ Build Marketing Tools Module:
   - Create offers/campaigns
   - Promo coin campaigns
   - Discount management
4. ❌ Build Performance Reports:
   - Product performance
   - Review analytics
   - Conversion rates
5. ❌ Build Inventory Management:
   - Stock alerts
   - Low inventory warnings
   - Reorder suggestions
6. ❌ Build 20+ vendor dashboard endpoints

**New Service Structure**:
```
services/vendor-dashboard/
├── src/
│   ├── analytics/
│   │   ├── analytics.service.ts
│   │   └── analytics.controller.ts
│   ├── marketing/
│   │   ├── marketing.service.ts
│   │   └── marketing.controller.ts
│   ├── reports/
│   │   ├── reports.service.ts
│   │   └── reports.controller.ts
│   └── inventory/
│       ├── inventory.service.ts
│       └── inventory.controller.ts
```

---

## 🚀 OPTION 3: AI Scent Match Engine (Weeks 8-11)

### Week 8: AI Service Foundation
**Tasks**:
1. ❌ Create new AI Service (Port 3800)
2. ❌ Setup Python/FastAPI backend (or Node.js ML)
3. ❌ Build scent DNA database
4. ❌ Implement vector similarity algorithm
5. ❌ Create scent matching logic
6. ❌ Connect to Product Service

**Technology Stack**:
- Python 3.11 + FastAPI (or Node.js + TensorFlow.js)
- Vector database (Qdrant or Pinecone)
- ML libraries (scikit-learn, pandas)

---

### Week 9: Scent Matching Algorithm
**Tasks**:
1. ❌ Build "Find Similar" algorithm
2. ❌ Implement DNA-based matching
3. ❌ Calculate match scores
4. ❌ Add brand similarity mapping
5. ❌ Build "Clone finder" feature
6. ❌ Test with real product data

**Algorithm Logic**:
```python
def find_similar_scents(target_product):
    # Extract DNA features
    dna_vector = extract_dna_features(target_product)

    # Calculate cosine similarity with all products
    similarities = calculate_similarity(dna_vector, all_products)

    # Filter by match threshold (>70%)
    matches = filter_by_threshold(similarities, 0.7)

    # Sort by score
    return sorted(matches, key='score', reverse=True)
```

---

### Week 10: Recommendation Engine
**Tasks**:
1. ❌ Build personalized recommendation engine
2. ❌ Implement user preference learning
3. ❌ Add browsing history analysis
4. ❌ Build "You might like" feature
5. ❌ Create personalized home feed
6. ❌ A/B testing framework

**Recommendation Types**:
- Collaborative filtering (users who bought X also bought Y)
- Content-based (similar DNA to what you liked)
- Hybrid (combine both)
- Trending in your region
- Personalized for your scent profile

---

### Week 11: AI Features Integration
**Tasks**:
1. ❌ Integrate AI endpoints with Product Service
2. ❌ Add "Find Similar" button on product pages
3. ❌ Build "Scent Twin" feature
4. ❌ Add AI chatbot for fragrance consultation
5. ❌ Create visual DNA chart
6. ❌ Build recommendation carousels
7. ❌ Performance optimization
8. ❌ Final testing

**New AI Endpoints**:
- `POST /api/ai/find-similar` - Find similar by product ID
- `POST /api/ai/match-scent` - Upload image → find matches
- `GET /api/ai/recommendations/:userId` - Personalized recommendations
- `POST /api/ai/scent-twin` - Find your scent profile twin
- `POST /api/ai/chat` - AI fragrance consultant chat

---

## 📋 CRITICAL REMINDERS (DO NOT FORGET)

### Build Standards
1. ✅ **ZERO ERRORS**: Every service must compile with 0 TypeScript errors
2. ✅ **Test After Each Change**: Run `npm run build` after every file change
3. ✅ **Schema First**: Always update Prisma schema before service code
4. ✅ **Migration Safety**: Test migrations on dev database first
5. ✅ **Type Safety**: Use strict TypeScript, no `any` types
6. ✅ **Error Handling**: Proper try-catch in all services
7. ✅ **Validation**: Use class-validator DTOs for all inputs
8. ✅ **Documentation**: Update API docs as we build

---

### Blueprint Requirements (DO NOT FORGET)
1. **Product Types**: ORIGINAL, SIMILAR_DNA, CLONE, NICHE, ATTAR, OUD, BODYMIST, HOMEBAKHOOR
2. **Scent DNA**: Family, notes (top/middle/base), similar brands
3. **Oud Classification**: CAMBODIAN, HINDI, MALAYSIAN, ARABIAN, SYNTHETIC
4. **Fulfillment Types**: RETAIL, WHOLESALE, MANUFACTURING, RAW_MATERIAL, PACKAGING
5. **Coin Types**: BRANDED, UNIVERSAL, PROMO (with expiry)
6. **Cashback**: Auto-credit 2% default, configurable per product
7. **Filters**: 15+ smart filters (DNA, oud, longevity, mood, occasion)
8. **Geo Visibility**: Products visible only in specific countries
9. **Video Content**: Regular videos + UGC videos with creator tracking
10. **Multi-Vendor**: Commission tracking, vendor payout, sub-orders

---

### Architecture Decisions (DO NOT FORGET)
1. **Microservices**: Each service independent, own database
2. **Port Allocation**:
   - User: 3100
   - Product: 3200
   - Order: 3300
   - Notification: 3400
   - Payment: 3500
   - Delivery: 3600
   - Vendor Dashboard: 3700
   - AI Service: 3800
3. **Databases**:
   - PostgreSQL: User, Order, Payment, Delivery, Notification, Vendor Dashboard
   - MongoDB: Product Service (flexible schema for scent DNA)
   - Redis: Caching, sessions, queues
   - Elasticsearch: Product search
   - Qdrant/Pinecone: Vector database for AI
4. **Message Queue**: Kafka for event-driven communication
5. **File Storage**: AWS S3 for images/videos

---

### Testing Checklist (DO NOT FORGET)
After each phase, test:
1. ✅ All services build successfully (0 errors)
2. ✅ All services start with `npm run start:dev`
3. ✅ Docker Compose starts all infrastructure
4. ✅ Prisma migrations apply successfully
5. ✅ API endpoints return expected responses
6. ✅ Database constraints work (foreign keys, validations)
7. ✅ Error handling returns proper HTTP status codes
8. ✅ Authentication/authorization works
9. ✅ Cross-service communication works (if needed)
10. ✅ Performance is acceptable (<500ms response time)

---

## 📊 SUCCESS METRICS

### Week 1 (Option 2) - Success = 100% Services
- [ ] Order Service: 0 TypeScript errors ✅
- [ ] Payment Service: 0 TypeScript errors ✅
- [ ] Delivery Service: Fully implemented, 0 errors ✅
- [ ] All 6 services running simultaneously ✅
- [ ] Integration test: Place order → Pay → Track delivery ✅

### Weeks 2-7 (Option 1) - Success = MVP Launch Ready
- [ ] Products have scent DNA, types, oud classification ✅
- [ ] 15+ smart filters working ✅
- [ ] Coins & cashback system operational ✅
- [ ] Vendor dashboard with analytics ✅
- [ ] All features tested end-to-end ✅

### Weeks 8-11 (Option 3) - Success = AI Differentiation
- [ ] AI Service running ✅
- [ ] "Find Similar" returns accurate matches ✅
- [ ] Personalized recommendations working ✅
- [ ] Scent match accuracy >80% ✅
- [ ] AI features integrated in product pages ✅

---

## 💰 ESTIMATED DELIVERABLES VALUE

| Phase | Deliverables | Value |
|-------|--------------|-------|
| Week 1 | 6 services @ 100%, 0 errors | $15,000 |
| Weeks 2-7 | Enhanced products, rewards, filters, vendor dashboard | $80,000 |
| Weeks 8-11 | AI scent matching, recommendations | $60,000 |
| **TOTAL** | **Complete MVP with AI** | **$155,000** |

**Platform Total Value**: $130,000 (done) + $155,000 (to do) = **$285,000**

---

## 🚀 CURRENT STATUS: STARTING WEEK 1

**Next Immediate Task**: Fix Order Service schema alignment
**Estimated Time**: 2-3 hours
**Goal**: 0 TypeScript errors in Order Service

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Status**: ACTIVE IMPLEMENTATION
**Current Phase**: Week 1 - Option 2 (Fix Existing Services)
