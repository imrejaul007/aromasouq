# Week 5: Vendor Management System - Complete Design

## Overview

Comprehensive multi-vendor marketplace system enabling vendors to register, manage products, track orders, receive payouts, and access analytics.

**Estimated Time**: 5-7 days
**Business Value**: $15,000 (Critical for marketplace model)
**Status**: ✅ Schema Designed, Ready for Implementation

---

## Database Schema

### Models Created (5 new tables + 5 enums)

#### 1. **VendorProfile** - Core vendor information
```prisma
- Business info (name, brand, description in EN/AR)
- Legal docs (trade license, tax registration)
- Contact details (email, phone, WhatsApp)
- Addresses (business + warehouse)
- Bank details (for payouts)
- Media (logo, banner, galleries)
- Verification status & history
- Commission settings (default 10%, custom rates)
- Stats (products, orders, revenue, ratings)
- Fulfillment settings (shipping, processing time)
- Policies (return, shipping)
```

#### 2. **VendorDocument** - Document management
```prisma
- Document types (trade license, tax cert, ID, bank statement, brand auth)
- Document URLs (S3/CDN storage)
- Verification status (pending/approved/rejected)
- Expiry tracking
- Admin verification history
```

#### 3. **VendorPayout** - Payment tracking
```prisma
- Period coverage (start/end dates)
- Financial breakdown (sales, commission, adjustments, net)
- Status (pending/processing/completed/failed/cancelled)
- Payment method & transaction reference
- Order IDs included in payout
- Invoice generation
```

#### 4. **VendorReview** - Customer feedback
```prisma
- Overall rating (1-5 stars)
- Aspect ratings (product quality, communication, shipping speed)
- Comment & vendor response
- Approval & publish status
- One review per order per user
```

#### 5. **VendorAnalytics** - Daily metrics
```prisma
- Order metrics (count, value)
- Product metrics (views, cart adds, sales)
- Financial (revenue, commission, refunds)
- Customer metrics (unique, returning)
- Daily aggregation for performance
```

### Enums
- `VendorBusinessType`: INDIVIDUAL, COMPANY, DISTRIBUTOR, MANUFACTURER
- `VendorVerificationStatus`: PENDING, UNDER_REVIEW, VERIFIED, REJECTED, RESUBMISSION_REQUIRED
- `VendorDocumentType`: TRADE_LICENSE, TAX_REGISTRATION, ID_CARD, BANK_STATEMENT, BRAND_AUTHORIZATION, OTHER
- `DocumentVerificationStatus`: PENDING, APPROVED, REJECTED
- `PayoutStatus`: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED

---

## System Architecture

### Service Structure

```
user-service/
├── src/
│   ├── vendors/
│   │   ├── vendors.controller.ts        (Vendor CRUD, registration)
│   │   ├── vendors.service.ts           (Business logic)
│   │   ├── vendor-documents.service.ts  (Document management)
│   │   ├── vendor-payouts.service.ts    (Payout calculations)
│   │   ├── vendor-reviews.service.ts    (Review management)
│   │   ├── vendor-analytics.service.ts  (Stats & analytics)
│   │   ├── vendors.module.ts
│   │   └── dto/
│   │       ├── create-vendor.dto.ts
│   │       ├── update-vendor.dto.ts
│   │       ├── upload-document.dto.ts
│   │       ├── payout-request.dto.ts
│   │       └── vendor-query.dto.ts
│   └── ...
```

---

## Feature Implementation Plan

### Phase 1: Vendor Registration & Verification (Day 1-2)

#### A. Registration Flow
1. **User signs up** with role=VENDOR
2. **Fill business information**:
   - Business name (EN + AR)
   - Brand name & slug
   - Description (EN + AR)
   - Category selection
3. **Add legal information**:
   - Trade license number & expiry
   - Tax registration number (VAT/TRN)
4. **Upload documents**:
   - Trade license copy
   - Tax certificate
   - Emirates ID / Passport
   - Bank statement
   - Brand authorization (if distributor)
5. **Add contact & address**:
   - Business email, phone, WhatsApp
   - Business address
   - Warehouse address (optional)
6. **Add bank details** (for payouts):
   - Bank name
   - Account number & name
   - IBAN & SWIFT code
7. **Submit for verification**

#### B. Verification Workflow (Admin Side)
1. **Review submitted documents**
2. **Verify information**:
   - Trade license validity
   - Tax registration
   - Bank account ownership
3. **Actions**:
   - Approve → Status: VERIFIED, isActive: true
   - Reject → Status: REJECTED, provide reason
   - Request resubmission → Status: RESUBMISSION_REQUIRED
4. **Notify vendor** via email/SMS

**API Endpoints**:
```
POST   /api/vendors/register          - Register as vendor
GET    /api/vendors/profile           - Get own profile
PATCH  /api/vendors/profile           - Update profile
POST   /api/vendors/documents         - Upload document
GET    /api/vendors/documents         - Get all documents
DELETE /api/vendors/documents/:id     - Delete document

# Admin
GET    /api/admin/vendors             - List all vendors (with filters)
GET    /api/admin/vendors/:id         - Get vendor details
PATCH  /api/admin/vendors/:id/verify  - Approve vendor
PATCH  /api/admin/vendors/:id/reject  - Reject vendor
PATCH  /api/admin/vendors/:id/suspend - Suspend vendor
```

---

### Phase 2: Product Management Integration (Day 2-3)

#### A. Link Products to Vendors
```typescript
// In Product Service
product.vendors = [
  {
    vendorId: "vendor-uuid",
    vendorName: "Luxury Perfumes UAE"
  }
]
```

#### B. Vendor Product Dashboard
1. **List own products**
2. **Create new product** (requires verification)
3. **Update product** (price, stock, description)
4. **Bulk upload** (CSV import)
5. **Product analytics** (views, sales, revenue)

**Validations**:
- Only VERIFIED vendors can create products
- Products must match vendor's categories
- Stock management
- Price rules (minimum, maximum)

**API Endpoints** (Product Service):
```
GET    /api/vendor/products           - List own products
POST   /api/vendor/products           - Create product
PATCH  /api/vendor/products/:id       - Update product
DELETE /api/vendor/products/:id       - Delete product
POST   /api/vendor/products/bulk      - Bulk upload
GET    /api/vendor/products/:id/stats - Product analytics
```

---

### Phase 3: Order Management (Day 3-4)

#### A. Vendor Order Dashboard
Sub-orders already exist in Order Service, just need to expose to vendors:

1. **View orders** (from SubOrder table):
   - Pending orders (need processing)
   - Processing orders
   - Ready to ship
   - Shipped orders
   - Delivered orders
   - Cancelled orders

2. **Update order status**:
   - Mark as processing
   - Mark as ready to ship
   - Add tracking number
   - Mark as shipped

3. **Order details**:
   - Customer info
   - Products ordered
   - Shipping address
   - Payment status
   - Timeline

**API Endpoints** (Already exist in Order Service):
```
GET    /api/sub-orders/vendor/:vendorId         - List vendor orders
GET    /api/sub-orders/:id                      - Get order details
PATCH  /api/sub-orders/:id/status               - Update status
POST   /api/sub-orders/:id/ready-to-ship        - Mark ready
POST   /api/sub-orders/:id/ship                 - Mark shipped
GET    /api/sub-orders/vendor/:vendorId/stats   - Order stats
```

**Enhancements Needed**:
- Add filtering (status, date range)
- Add search (order number, customer)
- Add export (CSV, PDF)
- Add notifications (new order alerts)

---

### Phase 4: Commission & Payout System (Day 4-5)

#### A. Commission Calculation
```typescript
// Per order
platformCommission = orderTotal * (vendor.commissionRate / 100)
vendorEarnings = orderTotal - platformCommission

// Example: 100 AED order, 10% commission
// Platform gets: 10 AED
// Vendor gets: 90 AED
```

#### B. Payout Generation (Monthly)
```typescript
// At end of month (or configurable period)
1. Get all COMPLETED orders for vendor in period
2. Calculate:
   - Total sales
   - Platform commission
   - Adjustments (refunds, fees)
   - Net amount = sales - commission - adjustments
3. Create VendorPayout record (status: PENDING)
4. Generate invoice PDF
5. Notify vendor
```

#### C. Payout Processing (Admin)
```typescript
1. Review payout request
2. Verify bank details
3. Process payment (bank transfer)
4. Update status: PROCESSING → COMPLETED
5. Add transaction reference
6. Notify vendor
```

**API Endpoints**:
```
GET    /api/vendor/payouts            - List payouts
GET    /api/vendor/payouts/:id        - Get payout details
GET    /api/vendor/earnings           - Current period earnings
POST   /api/vendor/payouts/request    - Request payout

# Admin
GET    /api/admin/payouts             - List all payouts
PATCH  /api/admin/payouts/:id/process - Process payout
PATCH  /api/admin/payouts/:id/complete- Mark as paid
GET    /api/admin/payouts/summary     - Payout summary
```

---

### Phase 5: Reviews & Ratings (Day 5)

#### A. Customer Reviews
After order delivery, customer can review vendor:
1. **Overall rating** (1-5 stars)
2. **Aspect ratings**:
   - Product quality
   - Communication
   - Shipping speed
3. **Written comment**

#### B. Vendor Response
Vendors can respond to reviews:
1. View all reviews
2. Add response to review
3. Flag inappropriate reviews

#### C. Rating Aggregation
```typescript
// Update vendor profile stats
averageRating = SUM(ratings) / COUNT(reviews)
totalReviews = COUNT(reviews)
```

**API Endpoints**:
```
POST   /api/vendor-reviews            - Create review (customer)
GET    /api/vendor-reviews/vendor/:id - Get vendor reviews
GET    /api/vendor/reviews            - Get own reviews
POST   /api/vendor/reviews/:id/respond- Respond to review
```

---

### Phase 6: Analytics Dashboard (Day 6-7)

#### A. Overview Dashboard
```
Today's Stats:
- Orders: 15 (+3 from yesterday)
- Revenue: 3,450 AED (+12%)
- Products Sold: 42 units
- Unique Customers: 12

This Month:
- Total Orders: 234
- Total Revenue: 48,320 AED
- Commission Paid: 4,832 AED
- Net Earnings: 43,488 AED
- Average Order Value: 206 AED
- Top Selling Products (5)
```

#### B. Charts & Graphs
1. **Sales over time** (line chart)
2. **Orders by status** (pie chart)
3. **Revenue vs Commission** (bar chart)
4. **Top products** (table)
5. **Customer insights** (new vs returning)

#### C. Reports
1. **Sales report** (daily/weekly/monthly)
2. **Product performance**
3. **Customer analysis**
4. **Payout history**
5. **Commission breakdown**

**API Endpoints**:
```
GET    /api/vendor/analytics/overview     - Dashboard overview
GET    /api/vendor/analytics/sales        - Sales data (chart)
GET    /api/vendor/analytics/products     - Product performance
GET    /api/vendor/analytics/customers    - Customer insights
POST   /api/vendor/analytics/export       - Export report
```

---

## Security & Permissions

### Role-Based Access Control (RBAC)

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDOR')
export class VendorsController {
  // Only vendors can access
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminVendorsController {
  // Only admins can access
}
```

### Vendor-Specific Guards

```typescript
@UseGuards(VendorOwnershipGuard)
async updateProduct(
  @Param('id') productId: string,
  @CurrentUser() user: User
) {
  // Only owner vendor can update their products
}
```

---

## Business Rules

### 1. Verification Requirements
- ✅ Trade license must be valid and not expired
- ✅ Tax registration required for UAE businesses
- ✅ Bank account must match business name
- ✅ All required documents uploaded
- ✅ Manual admin approval required

### 2. Product Listing Rules
- ✅ Only VERIFIED vendors can list products
- ✅ Products must match vendor's registered categories
- ✅ Minimum product information required (name, price, stock, images)
- ✅ Admin can flag/remove inappropriate products

### 3. Commission Rules
- ✅ Default commission: 10%
- ✅ Negotiable for high-volume vendors
- ✅ Calculated on order total (excluding shipping)
- ✅ Applied when order is COMPLETED
- ✅ Deducted from payout

### 4. Payout Rules
- ✅ Minimum payout: 100 AED
- ✅ Frequency: Monthly (configurable)
- ✅ Method: Bank transfer only
- ✅ Processing time: 3-5 business days
- ✅ Invoice generated automatically

### 5. Review Rules
- ✅ One review per order per customer
- ✅ Only after order DELIVERED
- ✅ Reviews moderated (approved before publish)
- ✅ Vendor can respond once
- ✅ Rating affects vendor profile score

---

## UI/UX Considerations

### Vendor Dashboard Sections

1. **Overview** - Key metrics and charts
2. **Products** - Product management
3. **Orders** - Order processing
4. **Earnings** - Revenue and payouts
5. **Reviews** - Customer feedback
6. **Analytics** - Detailed reports
7. **Settings** - Profile and preferences

### Mobile Responsiveness
- All vendor features mobile-friendly
- Native app consideration for Phase 2

---

## Integration Points

### Product Service
```
- Create product with vendorId
- Update product stock
- Get vendor products
- Product analytics
```

### Order Service
```
- SubOrders already linked to vendorId
- Update sub-order status
- Get vendor orders
- Order stats
```

### Notification Service
```
- New order notification
- Payout notification
- Review notification
- Verification status change
```

### Payment Service
```
- Process vendor payouts
- Bank transfer integration
- Payment confirmation
```

---

## Testing Strategy

### Unit Tests
- Service methods (registration, verification, payouts)
- Calculations (commission, payout amounts)
- Validation logic

### Integration Tests
- Registration flow end-to-end
- Order processing workflow
- Payout generation and processing
- Review submission and response

### E2E Tests
- Vendor signs up → verified → lists product → receives order → gets paid

---

## Performance Considerations

### Database Optimization
```sql
-- Indexes for fast queries
CREATE INDEX idx_vendor_verification ON vendor_profiles(verificationStatus);
CREATE INDEX idx_vendor_active ON vendor_profiles(isActive);
CREATE INDEX idx_vendor_slug ON vendor_profiles(brandSlug);
CREATE INDEX idx_vendor_analytics_date ON vendor_analytics(vendorId, date);
CREATE INDEX idx_vendor_payouts_period ON vendor_payouts(vendorId, periodStart, periodEnd);
```

### Caching Strategy
```typescript
// Cache vendor profiles (15 min TTL)
@UseInterceptors(CacheInterceptor)
@CacheTTL(900)
getVendorProfile()

// Cache analytics (5 min TTL)
@CacheTTL(300)
getAnalytics()
```

### Pagination
```typescript
// All list endpoints paginated (default 20, max 100)
GET /api/vendors/products?page=1&limit=20
```

---

## Monitoring & Logging

### Key Metrics to Track
1. **Vendor Growth**:
   - New registrations per day
   - Verification time (avg)
   - Approval rate

2. **Platform Health**:
   - Active vendors
   - Products listed
   - Orders processed
   - Total GMV (Gross Merchandise Value)

3. **Financial**:
   - Commission earned
   - Payouts processed
   - Average payout amount
   - Payout processing time

4. **Quality**:
   - Average vendor rating
   - Review response rate
   - Customer satisfaction

### Logs to Monitor
```
Vendor registered: {vendorId, businessName}
Vendor verified: {vendorId, verifiedBy}
Vendor rejected: {vendorId, reason}
Product created: {productId, vendorId}
Order received: {orderId, vendorId}
Payout generated: {payoutId, amount}
Payout processed: {payoutId, transactionRef}
```

---

## Future Enhancements (Phase 2)

### 1. Advanced Features
- **Subscription tiers** (Basic, Pro, Enterprise)
- **Advertising platform** (featured listings, banners)
- **Inventory management** (low stock alerts, auto-reorder)
- **Multi-location** (multiple warehouses)
- **Staff accounts** (team members for large vendors)

### 2. Marketing Tools
- **Coupon creation** (vendor-specific discounts)
- **Flash sales** (time-limited offers)
- **Loyalty programs** (vendor-specific rewards)
- **Email campaigns** (to vendor's customers)

### 3. Analytics Enhancements
- **Predictive analytics** (sales forecasting)
- **Customer segmentation** (RFM analysis)
- **Competitor analysis** (market positioning)
- **ROI tracking** (marketing effectiveness)

### 4. Integrations
- **Accounting software** (QuickBooks, Xero)
- **Shipping carriers** (Aramex, DHL, FedEx)
- **Payment gateways** (PayTabs, Stripe)
- **ERP systems** (SAP, Oracle)

---

## API Documentation Structure

### Vendor APIs (Public - for vendors)
```
/api/vendors
  /register              POST    Register as vendor
  /profile               GET     Get profile
  /profile               PATCH   Update profile
  /documents             GET     List documents
  /documents             POST    Upload document
  /products              GET     List products
  /orders                GET     List orders
  /orders/:id            GET     Order details
  /orders/:id/status     PATCH   Update order
  /earnings              GET     Earnings summary
  /payouts               GET     Payout history
  /payouts/request       POST    Request payout
  /reviews               GET     Customer reviews
  /reviews/:id/respond   POST    Respond to review
  /analytics/*           GET     Analytics endpoints
```

### Admin APIs (Private - for admins)
```
/api/admin/vendors
  /                      GET     List all vendors
  /:id                   GET     Vendor details
  /:id/verify            PATCH   Approve vendor
  /:id/reject            PATCH   Reject vendor
  /:id/suspend           PATCH   Suspend vendor
  /:id/commission        PATCH   Update commission
  /payouts               GET     All payouts
  /payouts/:id/process   PATCH   Process payout
  /analytics             GET     Platform analytics
```

---

## Error Handling

### Common Error Scenarios

1. **Registration Errors**:
   - Trade license already registered
   - Invalid tax registration number
   - Incomplete information

2. **Verification Errors**:
   - Document expired
   - Document unclear/unreadable
   - Information mismatch

3. **Product Errors**:
   - Not verified (cannot create products)
   - Invalid category
   - Stock unavailable

4. **Order Errors**:
   - Order already processed
   - Cannot update cancelled order
   - Invalid status transition

5. **Payout Errors**:
   - Below minimum threshold
   - Bank details incomplete
   - No completed orders in period

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Vendor not verified. Please complete verification first.",
  "error": "Bad Request",
  "details": {
    "verificationStatus": "PENDING",
    "requiredDocuments": ["TRADE_LICENSE", "TAX_REGISTRATION"]
  }
}
```

---

## Success Criteria

✅ **MVP Complete When**:
1. Vendors can register and get verified
2. Vendors can list and manage products
3. Vendors can process orders
4. Commission calculated correctly
5. Payouts generated and processed
6. Reviews functional
7. Basic analytics available
8. Zero security vulnerabilities
9. All APIs documented
10. Tests passing (>80% coverage)

---

## Timeline Breakdown

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| 1 | Vendor registration & profile | vendors.service.ts, DTOs, APIs |
| 2 | Document upload & verification | vendor-documents.service.ts, Admin APIs |
| 3 | Product management integration | Link to Product Service, CRUD |
| 4 | Order management | Sub-order integration, status updates |
| 5 | Commission & payouts | vendor-payouts.service.ts, calculations |
| 6 | Reviews & ratings | vendor-reviews.service.ts, aggregation |
| 7 | Analytics & testing | vendor-analytics.service.ts, tests, docs |

---

## Summary

✅ **Database Schema**: 5 models + 5 enums designed
✅ **Architecture**: Modular service structure planned
✅ **Features**: 6 phases mapped out
✅ **APIs**: 30+ endpoints specified
✅ **Security**: RBAC and guards defined
✅ **Business Rules**: All rules documented
✅ **Testing**: Strategy defined
✅ **Monitoring**: Metrics identified

**Ready for Implementation**: All design complete, can start building immediately.

**Estimated LOC**: ~3,000 lines of production code + tests + docs

**Business Impact**: Enables multi-vendor marketplace, critical revenue driver

---

**Next Step**: Begin Phase 1 implementation (Vendor Registration & Verification)
