# AromaSouQ Platform - Complete Build Guide

## 🎯 Project Status

### ✅ Completed (Foundation Ready)

1. **Project Structure**
   - ✅ Monorepo setup with Turbo
   - ✅ Directory structure for all services
   - ✅ Package.json and build configuration

2. **TypeScript Type System** (Complete)
   - ✅ Common types (UUID, timestamps, enums)
   - ✅ User & authentication types
   - ✅ Product types (10 categories, all taxonomies)
   - ✅ Order types (multi-vendor, status tracking)
   - ✅ Vendor types (dashboard, earnings, payouts)
   - ✅ Payment types (gateways, refunds)
   - ✅ Delivery types (5 partners, tracking)
   - ✅ Chat types (AI bot, video calls)
   - ✅ Influencer types (affiliate, earnings)

### 🚧 Next Steps (What You Need to Build)

Based on your GitHub repo: `git@github.com:imrejaul007/aromasouq.git`

I'll create the complete foundation you can push to GitHub, then your team can build upon it.

---

## 📦 What's Included in This Foundation

### 1. Shared Packages

#### `packages/types/` - TypeScript Definitions
All entities with complete type safety:
- **9 type definition files** covering entire platform
- Ready to import in all services
- Zero runtime overhead
- Comprehensive JSDoc comments

**Usage:**
```typescript
import { User, Product, Order } from '@aromasouq/types';
```

#### `packages/database/` - Database Schemas
- PostgreSQL migrations (Prisma)
- MongoDB schemas (Mongoose)
- Seed data scripts
- Utility functions

#### `packages/utils/` - Shared Utilities
- Date formatting
- Price calculations
- Validation helpers
- API response builders

#### `packages/ui/` - UI Component Library
- Luxury design system
- Reusable React components
- Tailwind CSS configuration
- Design tokens

#### `packages/config/` - Shared Configuration
- ESLint config
- TypeScript config
- Prettier config
- Jest config

---

### 2. Backend Services (Microservices)

Each service is a standalone NestJS application:

#### `services/user-service/` - User & Authentication
**Features:**
- User registration/login
- JWT authentication
- Email/phone verification
- Password reset
- User profile management
- Wallet management
- Social auth (Google, Apple, Facebook)

**Tech Stack:**
- NestJS
- Passport.js
- bcrypt
- JWT
- PostgreSQL (Prisma ORM)
- Redis (sessions)

#### `services/product-service/` - Product Catalog
**Features:**
- Product CRUD
- Multi-category taxonomy (10 categories)
- Advanced search & filters
- Product variants
- Reviews & ratings
- Brand management
- Category management

**Tech Stack:**
- NestJS
- MongoDB (Mongoose)
- Elasticsearch (search)
- Redis (cache)
- AWS S3 (images)

#### `services/order-service/` - Order Management
**Features:**
- Order creation
- Multi-vendor cart splitting
- Order status tracking
- Order history
- Returns & refunds

**Tech Stack:**
- NestJS
- PostgreSQL (Prisma)
- Redis (cache)
- Kafka (events)

#### `services/payment-service/` - Payment Processing
**Features:**
- Stripe integration
- Telr integration (GCC)
- PayTabs integration
- Wallet payments
- Refund processing
- Saved cards

**Tech Stack:**
- NestJS
- PostgreSQL (Prisma)
- Stripe SDK
- Telr SDK

#### `services/vendor-service/` - Vendor Management
**Features:**
- Vendor onboarding
- Product management
- Order fulfillment
- Earnings tracking
- Payout management
- Vendor dashboard

**Tech Stack:**
- NestJS
- PostgreSQL + MongoDB
- Stripe Connect (payouts)

#### `services/delivery-service/` - Delivery Integration
**Features:**
- 5 partner integrations (Fetchr, Aramex, SMSA, DHL, custom)
- Rate shopping
- Label generation
- Real-time tracking
- Webhook handling
- Same-day delivery logic

**Tech Stack:**
- NestJS
- PostgreSQL
- Partner APIs

#### `services/chat-service/` - Live Chat & AI Bot
**Features:**
- Real-time chat (Socket.io)
- AI chatbot (GPT-4)
- Video calls (Agora)
- Chat history
- Human handoff

**Tech Stack:**
- NestJS
- Socket.io
- MongoDB (chat logs)
- OpenAI API
- Agora SDK

#### `services/notification-service/` - Notifications
**Features:**
- Push notifications (FCM, APNs)
- SMS (Twilio)
- Email (SendGrid)
- WhatsApp (Twilio)
- In-app notifications

**Tech Stack:**
- NestJS
- Bull (queue)
- Redis
- Twilio
- SendGrid

#### `services/ai-service/` - AI/ML Features
**Features:**
- Scent Match AI (image → similar products)
- Recommendation engine
- Dynamic pricing
- Fraud detection

**Tech Stack:**
- Python (FastAPI)
- PyTorch/TensorFlow
- Qdrant (vector DB)
- scikit-learn

---

### 3. Frontend Applications

#### `apps/web/` - Next.js Web App
**Features:**
- Homepage
- Product listing & detail pages
- Search & filters
- Shopping cart
- Checkout flow
- User dashboard
- Vendor dashboard
- Admin dashboard
- 100+ geo-optimized SEO pages

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state)
- React Query
- Framer Motion

**Design System:**
- Luxury theme (gold, black, ivory)
- Playfair Display + Inter fonts
- Premium animations
- Mobile-first responsive
- RTL (Arabic) support

#### `apps/mobile/` - React Native App
**Features:**
- Full e-commerce flow
- AI Scent Match (camera)
- Push notifications
- Video calls
- Offline mode
- Deep linking

**Tech Stack:**
- React Native (Expo)
- TypeScript
- React Navigation
- Zustand
- React Query
- Agora (video)

#### `apps/admin/` - Admin Dashboard
**Features:**
- User management
- Product management
- Order management
- Vendor approval
- Analytics
- Reports
- Settings

**Tech Stack:**
- Next.js
- shadcn/ui
- Recharts (analytics)

---

### 4. Infrastructure

#### `infrastructure/docker/` - Docker Setup
- docker-compose.yml (all services)
- Dockerfiles for each service
- Development environment
- Production-ready configs

#### `infrastructure/kubernetes/` - K8s Manifests
- Deployments
- Services
- Ingress
- ConfigMaps
- Secrets

#### `infrastructure/terraform/` - Infrastructure as Code
- AWS resources
- Database provisioning
- CDN setup
- Auto-scaling

---

## 🚀 Quick Start Guide

### Prerequisites
```bash
# Install Node.js 18+
node --version

# Install Docker
docker --version

# Install PostgreSQL 15+
psql --version

# Install MongoDB 6+
mongod --version
```

### Installation Steps

```bash
# 1. Clone repository
git clone git@github.com:imrejaul007/aromasouq.git
cd aromasouq

# 2. Install dependencies (all workspaces)
npm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Start databases (Docker)
npm run docker:up

# 5. Run migrations
npm run db:migrate

# 6. Seed database
npm run db:seed

# 7. Start all services
npm run dev
```

### Access Points
- Web App: http://localhost:3000
- Admin: http://localhost:3001
- API Gateway: http://localhost:8000
- User Service: http://localhost:3100
- Product Service: http://localhost:3101

---

## 📝 Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/aromasouq
MONGODB_URI=mongodb://localhost:27017/aromasouq
REDIS_URL=redis://localhost:6379
ELASTICSEARCH_URL=http://localhost:9200

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

TELR_STORE_ID=your-store-id
TELR_AUTH_KEY=your-auth-key

PAYTABS_PROFILE_ID=your-profile-id
PAYTABS_SERVER_KEY=your-server-key

# Delivery Partners
FETCHR_API_KEY=your-api-key
FETCHR_API_URL=https://api.fetchr.us/v1

ARAMEX_USERNAME=your-username
ARAMEX_PASSWORD=your-password
ARAMEX_ACCOUNT=your-account
ARAMEX_PIN=your-pin
ARAMEX_API_URL=https://ws.aramex.net/ShippingAPI.V2

SMSA_API_KEY=your-api-key
SMSA_API_URL=https://track.smsaexpress.com/

DHL_API_KEY=your-api-key
DHL_API_SECRET=your-secret
DHL_ACCOUNT=your-account

# Twilio (SMS, WhatsApp)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890

# SendGrid (Email)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@aromasouq.com
SENDGRID_FROM_NAME=AromaSouQ

# Agora (Video Calls)
AGORA_APP_ID=your-app-id
AGORA_APP_CERTIFICATE=your-certificate

# OpenAI (AI Chatbot)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# AWS (S3, CloudFront)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=aromasouq-media
AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net

# URLs
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WEB_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001

# Feature Flags
FEATURE_AI_SCENT_MATCH=true
FEATURE_VIDEO_CALLS=true
FEATURE_SAME_DAY_DELIVERY=true
FEATURE_INFLUENCER_PROGRAM=true
```

---

## 🏗️ Development Workflow

### Running Services Individually

```bash
# User Service only
cd services/user-service
npm run dev

# Product Service only
cd services/product-service
npm run dev

# Web App only
cd apps/web
npm run dev
```

### Running All Services

```bash
# From root directory
npm run dev
```

This uses Turbo to run all services in parallel with optimal caching.

### Testing

```bash
# Run all tests
npm run test

# Run tests for specific service
cd services/user-service
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

### Linting & Formatting

```bash
# Lint all code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format
```

---

## 📊 Database Setup

### PostgreSQL Schema

Tables:
- `users` - User accounts
- `addresses` - User addresses
- `orders` - Orders
- `order_items` - Order line items
- `payments` - Payment transactions
- `vendors` - Vendor accounts
- `vendor_documents` - KYC documents
- `vendor_earnings` - Commission tracking
- `influencers` - Influencer accounts
- `affiliate_links` - Tracking links
- `affiliate_clicks` - Click tracking
- `wallet_transactions` - Wallet history
- `shipments` - Delivery tracking
- `saved_cards` - Tokenized cards

### MongoDB Collections

- `products` - Product catalog
- `categories` - Category taxonomy
- `brands` - Brand information
- `reviews` - Product reviews
- `chat_conversations` - Chat history
- `chat_messages` - Messages
- `user_activity` - Analytics events

### Elasticsearch Indices

- `products` - Product search
- `vendors` - Vendor search

---

## 🎨 Design System

### Colors

```javascript
// tailwind.config.js
colors: {
  primary: {
    black: '#0A0A0A',
    gold: '#D4AF37',
    ivory: '#FAFAF8',
  },
  secondary: {
    emerald: '#00534C',
    royal: '#1E3A8A',
    burgundy: '#800020',
  }
}
```

### Typography

- **Headings**: Playfair Display (serif, luxury)
- **Body**: Inter (sans-serif, readable)
- **Arabic**: Tajawal

### Components

Located in `packages/ui/`:
- Button
- Card
- Input
- Select
- Modal
- ProductCard
- ProductDetail
- CartDrawer
- Checkout
- UserDashboard

---

## 🚢 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Docker
```bash
docker-compose up -d
```

### Kubernetes
```bash
kubectl apply -f infrastructure/kubernetes/
```

---

## 📈 Next Steps After Foundation

### Week 1-2: Complete User Service
1. Implement all auth endpoints
2. Add email/SMS verification
3. Setup JWT refresh tokens
4. Add social OAuth
5. Write unit tests
6. Setup API documentation (Swagger)

### Week 3-4: Complete Product Service
1. Implement product CRUD
2. Setup Elasticsearch indexing
3. Build advanced search
4. Add image upload (S3)
5. Implement review system

### Week 5-6: Build Web App Core
1. Homepage
2. Product listing pages
3. Product detail pages
4. Shopping cart
5. User authentication UI

### Week 7-8: Order & Payment
1. Complete order service
2. Stripe integration
3. Telr integration
4. Checkout flow
5. Order tracking

### Week 9-10: Delivery Integration
1. Fetchr API integration
2. Aramex API integration
3. SMSA integration
4. Webhook handling
5. Tracking page

### Week 11-12: Vendor & Admin
1. Vendor dashboard
2. Admin panel
3. Product management
4. Order management
5. Analytics

### Week 13-16: Mobile App
1. React Native setup
2. Core screens
3. Checkout flow
4. Push notifications
5. Deep linking

### Week 17-20: Advanced Features
1. AI Scent Match
2. Chat & Video calls
3. Influencer program
4. Wallet & cashback
5. Geo-SEO pages

---

## 🎓 Learning Resources

### NestJS
- Official Docs: https://docs.nestjs.com
- Microservices: https://docs.nestjs.com/microservices/basics

### Next.js
- Official Docs: https://nextjs.org/docs
- App Router: https://nextjs.org/docs/app

### React Native
- Official Docs: https://reactnative.dev
- Expo: https://docs.expo.dev

### Prisma
- Official Docs: https://www.prisma.io/docs

### MongoDB
- Mongoose: https://mongoosejs.com/docs

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues
```bash
# Restart databases
npm run docker:down
npm run docker:up
```

### Clear Cache
```bash
# Clear Turbo cache
npm run clean
rm -rf node_modules
npm install
```

---

## 📞 Support

- **Documentation**: `/docs` folder
- **API Docs**: http://localhost:8000/docs
- **GitHub Issues**: https://github.com/imrejaul007/aromasouq/issues

---

**Last Updated**: November 2025
**Version**: 1.0.0-foundation
