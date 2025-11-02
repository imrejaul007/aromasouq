# AromaSouQ Platform

> Luxury Multi-Vendor Fragrance Marketplace - Web, iOS & Android

## 🏗️ Architecture

This is a **monorepo** containing all AromaSouQ platform code:

```
aromasouq-platform/
├── apps/
│   ├── web/                 # Next.js web application
│   ├── mobile/              # React Native mobile app (iOS & Android)
│   └── admin/               # Admin dashboard
├── services/
│   ├── api-gateway/         # Kong API Gateway config
│   ├── user-service/        # User & Authentication (NestJS)
│   ├── product-service/     # Product Catalog (NestJS)
│   ├── order-service/       # Order Management (NestJS)
│   ├── payment-service/     # Payment Processing (NestJS)
│   ├── vendor-service/      # Vendor Management (NestJS)
│   ├── delivery-service/    # Delivery Integration (NestJS)
│   ├── chat-service/        # Live Chat & AI Bot (NestJS)
│   ├── notification-service/# Push, SMS, Email (NestJS)
│   └── ai-service/          # AI Scent Match (Python FastAPI)
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── types/               # TypeScript types
│   ├── utils/               # Shared utilities
│   ├── config/              # Shared configs
│   └── database/            # Database schemas & migrations
└── infrastructure/
    ├── docker/              # Docker configs
    ├── kubernetes/          # K8s manifests
    └── terraform/           # Infrastructure as Code
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Docker & Docker Compose
- PostgreSQL 15+
- MongoDB 6+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd aromasouq-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start databases (Docker)
npm run docker:up

# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Start all services in development mode
npm run dev
```

### Access Points

- **Web App**: http://localhost:3000
- **Admin Panel**: http://localhost:3001
- **API Gateway**: http://localhost:8000
- **User Service**: http://localhost:3100
- **Product Service**: http://localhost:3101
- **Order Service**: http://localhost:3102

## 📱 Mobile Development

```bash
# iOS (requires macOS + Xcode)
cd apps/mobile
npm run ios

# Android (requires Android Studio)
cd apps/mobile
npm run android
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests for specific service
cd services/user-service
npm run test

# E2E tests
npm run test:e2e
```

## 🏗️ Tech Stack

### Frontend
- **Web**: Next.js 14 (React, TypeScript, Tailwind CSS)
- **Mobile**: React Native (TypeScript)
- **UI**: shadcn/ui + custom luxury components
- **State**: Zustand + React Query
- **Forms**: React Hook Form + Zod

### Backend
- **Framework**: NestJS (Node.js + TypeScript)
- **API**: REST + GraphQL
- **Auth**: JWT + Passport
- **Validation**: class-validator

### Databases
- **Primary**: PostgreSQL (users, orders, payments)
- **Catalog**: MongoDB (products, categories)
- **Cache**: Redis (sessions, cache)
- **Search**: Elasticsearch (product search)

### Infrastructure
- **Container**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry, Prometheus, Grafana

## 📦 Key Features

### Core E-Commerce
- ✅ Multi-vendor marketplace
- ✅ Product catalog with 10 categories
- ✅ Advanced search & filters
- ✅ Shopping cart & checkout
- ✅ Multiple payment gateways (Stripe, Telr)
- ✅ Order management
- ✅ Delivery tracking

### Fragrance-Specific
- ✅ Oud categorization (8+ types)
- ✅ Scent DNA matching
- ✅ Similar product recommendations
- ✅ Clone perfume database
- ✅ Sample ordering
- ✅ Custom perfume requests

### Advanced Features
- ✅ AI Scent Match (upload photo → find similar)
- ✅ Geo-optimized SEO (100+ location pages)
- ✅ Multi-language (English/Arabic)
- ✅ Real-time chat + AI bot
- ✅ Video calls
- ✅ Wallet & cashback system
- ✅ Influencer affiliate program
- ✅ Same-day delivery

### Delivery Integrations
- ✅ Fetchr (UAE)
- ✅ Aramex (GCC)
- ✅ SMSA (Saudi Arabia)
- ✅ DHL (International)
- ✅ Custom in-house couriers

## 🔐 Environment Variables

Create `.env.local` in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aromasouq
MONGODB_URI=mongodb://localhost:27017/aromasouq
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
TELR_STORE_ID=your-store-id
TELR_AUTH_KEY=your-auth-key

# Delivery Partners
FETCHR_API_KEY=your-api-key
ARAMEX_API_KEY=your-api-key
SMSA_API_KEY=your-api-key

# Third-Party Services
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
SENDGRID_API_KEY=your-api-key
AGORA_APP_ID=your-app-id
OPENAI_API_KEY=sk-...

# AWS
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=aromasouq-media
AWS_REGION=us-east-1

# URLs
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WEB_URL=http://localhost:3000
```

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

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## 📄 License

Proprietary - AromaSouQ © 2025

## 🔗 Links

- **Production**: https://aromasouq.com
- **Staging**: https://staging.aromasouq.com
- **Admin**: https://admin.aromasouq.com
- **API Docs**: https://api.aromasouq.com/docs

## 📞 Support

For support, email: dev@aromasouq.com
