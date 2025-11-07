# AromaSouQ - Frontend Architecture & Implementation Guide

**Document Version**: 1.0
**Date**: November 7, 2025
**Status**: Backend 100% Complete | Frontend Architecture Ready
**Target Timeline**: Weeks 8-12 (5 weeks)

---

## 🎯 Executive Summary

This document provides a complete architecture and implementation guide for the AromaSouQ frontend applications. With the backend 100% complete (176+ API endpoints), the frontend can be built with confidence knowing all data and business logic is production-ready.

### Frontend Applications:
1. **Customer Website** (Next.js 14 + TypeScript + Tailwind CSS)
2. **Vendor Dashboard** (React + React Admin + TypeScript)
3. **Admin Dashboard** (React + React Admin + TypeScript)

### Key Metrics:
- **Backend APIs Available**: 176+ endpoints
- **Estimated Development Time**: 5 weeks (Weeks 8-12)
- **Estimated Value**: $60,000
- **Technology Stack**: Modern, Production-Ready, SEO-Optimized

---

## 📊 Three-App Architecture

```
aromasouq-platform/
├── apps/
│   ├── web/              # Customer Website (Next.js 14)
│   ├── admin/            # Admin Dashboard (React Admin)
│   └── vendor/           # Vendor Dashboard (React Admin)
├── packages/
│   ├── ui/               # Shared UI Components
│   ├── api-client/       # API Client Library
│   ├── types/            # Shared TypeScript Types
│   └── utils/            # Shared Utilities
└── services/             # Backend (Already Complete ✅)
```

---

## 🌐 App 1: Customer Website (Week 8-9)

### Technology Stack:
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Headless UI
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod
- **Authentication**: NextAuth.js
- **SEO**: Next.js built-in (SSR/SSG)
- **Analytics**: Google Analytics 4
- **Payments**: Stripe Elements

### Key Features (Priority Order):

#### 🔥 Phase 1: Core Shopping (Week 8 - Days 1-3)
1. **Homepage**
   - Hero section with search
   - Featured products carousel
   - Trending products (from AI endpoint)
   - Category grid
   - New arrivals section
   - Promotional banners

2. **Product Listing Page (PLP)**
   - Grid/List view toggle
   - 30 smart filters (from backend)
   - Sort options (price, rating, popularity, newest)
   - Pagination
   - Quick view modal
   - Filter chips (active filters)

3. **Product Detail Page (PDP)**
   - Image gallery with zoom
   - Scent DNA visualization
   - Similar products (with match %)
   - Reviews and ratings
   - Add to cart
   - Add to wishlist
   - Stock status
   - Shipping calculator

4. **Search**
   - Smart search with autocomplete
   - Recent searches
   - Trending searches
   - Voice search support
   - Search suggestions

#### 🛒 Phase 2: Checkout Flow (Week 8 - Days 4-5)
5. **Cart**
   - Cart summary
   - Apply coins/cashback
   - Apply coupon
   - Recommended products
   - Shipping estimate

6. **Checkout**
   - Multi-step form (Address → Payment → Review)
   - Guest checkout option
   - Save address
   - Save card
   - Order summary
   - Stripe payment integration

7. **Order Confirmation**
   - Order details
   - Tracking information
   - Email confirmation
   - Download invoice

#### 👤 Phase 3: User Account (Week 9 - Days 1-2)
8. **Authentication**
   - Login/Register
   - Email verification
   - Forgot password
   - Social login (Google, Apple)
   - OTP verification

9. **User Profile**
   - Personal info
   - Address book
   - Saved cards
   - Email preferences
   - Password change

10. **Order History**
    - Order list with filters
    - Order details
    - Track order
    - Reorder
    - Return/Refund request

11. **Wishlist**
    - Saved products
    - Move to cart
    - Share wishlist
    - Notify when in stock

12. **Rewards**
    - Coin balance by type
    - Cashback balance
    - Transaction history
    - Redeem rewards
    - Rewards program info

#### 🤖 Phase 4: AI Features (Week 9 - Days 3-4)
13. **Personalized Recommendations**
    - "Recommended for You" section
    - "Complete Your Profile" widget
    - "Your Scent Twin" quiz
    - "You might also like" carousel

14. **Smart Features**
    - Scent DNA matcher
    - Clone finder
    - Collection builder
    - Fragrance personality quiz
    - Gift finder wizard

#### 📱 Phase 5: Additional Pages (Week 9 - Day 5)
15. **Static Pages**
    - About Us
    - Contact Us
    - FAQ
    - Shipping & Returns
    - Terms & Conditions
    - Privacy Policy
    - Blog/Articles

16. **Brand Pages**
    - Brand listing
    - Brand detail
    - Products by brand

17. **Category Pages**
    - Category hierarchy
    - Category detail with filters
    - Subcategory navigation

### Directory Structure:

```
apps/web/
├── app/                      # Next.js 14 App Router
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (shop)/
│   │   ├── page.tsx          # Homepage
│   │   ├── products/
│   │   │   ├── page.tsx      # Product listing
│   │   │   └── [slug]/       # Product detail
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── brands/
│   ├── (account)/
│   │   ├── profile/
│   │   ├── orders/
│   │   ├── wishlist/
│   │   └── rewards/
│   ├── (ai)/
│   │   ├── recommendations/
│   │   ├── quiz/
│   │   └── scent-twin/
│   └── api/                  # API routes
│       └── auth/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductFilters.tsx
│   │   └── ScentDNA.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── ApplyCoupon.tsx
│   ├── checkout/
│   │   ├── CheckoutSteps.tsx
│   │   ├── AddressForm.tsx
│   │   └── PaymentForm.tsx
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── api/                  # API client functions
│   ├── hooks/                # Custom React hooks
│   ├── utils/                # Utility functions
│   └── validations/          # Zod schemas
├── store/                    # Zustand stores
│   ├── cartStore.ts
│   ├── authStore.ts
│   └── wishlistStore.ts
├── styles/
│   └── globals.css
├── public/
│   └── images/
└── next.config.js
```

### State Management Strategy:

```typescript
// Example: Cart Store (Zustand)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  // ... other fields
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => ({
        items: [...state.items, item]
      })),
      removeItem: (productId) => set((state) => ({
        items: state.items.filter((i) => i.productId !== productId)
      })),
      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        )
      })),
      clearCart: () => set({ items: [] }),
      get total() {
        return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      }
    }),
    { name: 'cart-storage' }
  )
);
```

### API Integration Example:

```typescript
// lib/api/products.ts
import { apiClient } from './client';
import { Product, ProductFilters } from '@/types';

export const productsApi = {
  getAll: async (filters?: ProductFilters) => {
    const { data } = await apiClient.get<{ data: Product[] }>('/products', {
      params: filters
    });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<Product>(`/products/${id}`);
    return data;
  },

  getSimilar: async (id: string, limit = 10) => {
    const { data } = await apiClient.get<Array<Product & { similarityScore: number }>>(
      `/products/ai/similar-with-score/${id}`,
      { params: { limit } }
    );
    return data;
  },

  getTrending: async (limit = 20) => {
    const { data } = await apiClient.get<Product[]>('/products/ai/trending', {
      params: { limit }
    });
    return data;
  },

  search: async (query: string, filters?: any) => {
    const { data } = await apiClient.post('/products/ai/smart-search', {
      query,
      filters
    });
    return data;
  }
};
```

### React Query Integration:

```typescript
// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';

export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });
};

export const useSimilarProducts = (id: string) => {
  return useQuery({
    queryKey: ['similar-products', id],
    queryFn: () => productsApi.getSimilar(id),
    enabled: !!id,
  });
};
```

### SEO Strategy:

```typescript
// app/products/[slug]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);

  return {
    title: `${product.name} | AromaSouQ`,
    description: product.seo.en.description,
    keywords: product.seo.en.keywords,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: [product.media.images[0].url],
      type: 'product',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.shortDescription,
      images: [product.media.images[0].url],
    },
  };
}
```

---

## 🏢 App 2: Vendor Dashboard (Week 10)

### Technology Stack:
- **Framework**: React 18 + Vite
- **UI Library**: React Admin 4
- **Language**: TypeScript
- **Styling**: Material-UI (MUI)
- **Charts**: Recharts
- **State**: React Admin built-in
- **API**: React Admin Data Provider

### Key Features:

#### 📊 Dashboard (Home)
- Sales overview (today, week, month)
- Revenue charts
- Top products
- Recent orders
- Pending payouts
- Low stock alerts
- Performance metrics

#### 📦 Products Management
- Product list (CRUD)
- Bulk upload (CSV/Excel)
- Product create/edit form
- Image upload (multiple)
- Video upload
- Inventory management
- Product approval status
- Product analytics

#### 🛍️ Orders Management
- Order list with filters
- Order details view
- Update order status
- Print packing slip
- Export orders
- Order timeline
- Commission breakdown

#### 💰 Payouts & Finance
- Payout requests
- Payout history
- Transaction details
- Revenue analytics
- Commission rates
- Bank account management
- Invoice generation

#### 📈 Analytics & Reports
- Sales reports
- Product performance
- Customer insights
- Geographic distribution
- Revenue trends
- Export reports (PDF/Excel)

#### ⚙️ Settings
- Business profile
- Bank details
- Notification preferences
- API keys
- Shipping settings
- Return policy

### Directory Structure:

```
apps/vendor/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── dataProvider.ts       # React Admin data provider
│   ├── authProvider.ts       # Authentication
│   ├── resources/
│   │   ├── products/
│   │   │   ├── ProductList.tsx
│   │   │   ├── ProductEdit.tsx
│   │   │   ├── ProductCreate.tsx
│   │   │   └── ProductShow.tsx
│   │   ├── orders/
│   │   ├── payouts/
│   │   └── analytics/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── SalesCard.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   └── TopProducts.tsx
│   │   └── common/
│   ├── layout/
│   │   ├── Layout.tsx
│   │   ├── Menu.tsx
│   │   └── AppBar.tsx
│   ├── lib/
│   │   └── api/
│   └── types/
├── public/
└── vite.config.ts
```

### React Admin Data Provider Example:

```typescript
// dataProvider.ts
import { DataProvider } from 'react-admin';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;

export const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const query = {
      ...params.filter,
      page,
      limit: perPage,
      sortBy: field,
      sortOrder: order,
    };

    const { data } = await axios.get(`${apiUrl}/${resource}`, { params: query });

    return {
      data: data.data,
      total: data.pagination.total,
    };
  },

  getOne: async (resource, params) => {
    const { data } = await axios.get(`${apiUrl}/${resource}/${params.id}`);
    return { data };
  },

  create: async (resource, params) => {
    const { data } = await axios.post(`${apiUrl}/${resource}`, params.data);
    return { data };
  },

  update: async (resource, params) => {
    const { data } = await axios.patch(`${apiUrl}/${resource}/${params.id}`, params.data);
    return { data };
  },

  delete: async (resource, params) => {
    await axios.delete(`${apiUrl}/${resource}/${params.id}`);
    return { data: params.previousData };
  },

  // ... other methods
};
```

---

## 👨‍💼 App 3: Admin Dashboard (Week 11)

### Technology Stack:
Same as Vendor Dashboard (React Admin)

### Key Features:

#### 📊 Dashboard (Home)
- Platform overview
- Total users/vendors/products/orders
- Revenue charts
- Growth metrics
- System health
- Recent activity

#### 👥 User Management
- User list (CRUD)
- User details with history
- Suspend/Reactivate users
- Role management
- User statistics
- Growth analytics

#### 🏢 Vendor Management
- Vendor approval queue
- Vendor list
- Vendor profile review
- Document verification
- Vendor performance
- Payout processing

#### 📦 Product Moderation
- Pending products queue
- Product review
- Bulk approve/reject
- Product flags management
- Product analytics
- Top products

#### 🛍️ Order Management
- All orders list
- Order details
- Update order status
- Cancel orders
- Revenue analytics
- Order growth metrics

#### 💰 Financial Management
- Revenue overview
- Commission analytics
- Payout queue
- Transaction history
- Refund management

#### 📈 Analytics & Reports
- Platform analytics
- User analytics
- Vendor analytics
- Product analytics
- Revenue reports
- Custom reports

#### ⚙️ System Settings
- Platform settings
- Commission rates
- Shipping zones
- Tax settings
- Email templates
- API configuration

### Directory Structure:

```
apps/admin/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── dataProvider.ts
│   ├── authProvider.ts
│   ├── resources/
│   │   ├── users/
│   │   ├── vendors/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── payouts/
│   │   └── analytics/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── PlatformOverview.tsx
│   │   │   ├── GrowthChart.tsx
│   │   │   └── RevenueBreakdown.tsx
│   │   └── moderation/
│   │       ├── ProductReview.tsx
│   │       └── VendorVerification.tsx
│   ├── layout/
│   ├── lib/
│   └── types/
├── public/
└── vite.config.ts
```

---

## 📦 Shared Packages

### Package 1: UI Components (`packages/ui`)

```typescript
// packages/ui/src/Button.tsx
export interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  children,
  ...props
}) => {
  // Shared button component
};

// Other shared components:
// - Input
// - Select
// - Modal
// - Card
// - Badge
// - Toast
// - Loading
```

### Package 2: API Client (`packages/api-client`)

```typescript
// packages/api-client/src/index.ts
import axios from 'axios';

export const createApiClient = (baseURL: string, token?: string) => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  // Interceptors for error handling, retry logic, etc.
  return client;
};

// Export all API modules
export * from './products';
export * from './orders';
export * from './users';
export * from './auth';
```

### Package 3: Types (`packages/types`)

```typescript
// packages/types/src/product.ts
export interface Product {
  _id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  brand: Brand;
  taxonomy: Taxonomy;
  attributes: Attributes;
  scent: Scent;
  pricing: Pricing;
  media: ProductMedia;
  stats: Stats;
  flags: Flags;
  createdAt: string;
  updatedAt: string;
}

// Export all types matching backend models
export * from './user';
export * from './order';
export * from './vendor';
```

---

## 🚀 Setup Instructions

### Prerequisites:
```bash
- Node.js 18+
- npm or yarn or pnpm
- Git
```

### 1. Setup Customer Website (Next.js):

```bash
cd apps/web
npx create-next-app@latest . --typescript --tailwind --app --eslint
npm install zustand @tanstack/react-query axios zod react-hook-form
npm install @headlessui/react @heroicons/react
npm install next-auth stripe @stripe/stripe-js
```

### 2. Setup Vendor Dashboard:

```bash
cd apps/vendor
npm create vite@latest . -- --template react-ts
npm install react-admin ra-data-simple-rest
npm install @mui/material @emotion/react @emotion/styled
npm install recharts date-fns
npm install axios
```

### 3. Setup Admin Dashboard:

```bash
cd apps/admin
npm create vite@latest . -- --template react-ts
npm install react-admin ra-data-simple-rest
npm install @mui/material @emotion/react @emotion/styled
npm install recharts date-fns
npm install axios
```

### 4. Setup Shared Packages:

```bash
# In root package.json, add workspaces:
{
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*"
  ]
}

# Install dependencies
npm install
```

---

## 🔐 Authentication Flow

### Customer Website (NextAuth.js):

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.API_URL}/auth/login`, {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" }
        });

        const user = await res.json();

        if (res.ok && user) {
          return user;
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.id = token.id;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### Dashboards (React Admin):

```typescript
// authProvider.ts
import { AuthProvider } from 'react-admin';

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const request = new Request(`${apiUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: username, password }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });

    const response = await fetch(request);
    if (response.status < 200 || response.status >= 300) {
      throw new Error(response.statusText);
    }

    const { accessToken, user } = await response.json();
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve();
  },

  checkAuth: () => {
    return localStorage.getItem('token') ? Promise.resolve() : Promise.reject();
  },

  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getPermissions: () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return Promise.resolve(user.role);
  },
};
```

---

## 🎨 Design System

### Color Palette:

```css
/* tailwind.config.js / theme colors */
colors: {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    // ... (Luxury Purple/Gold theme)
    600: '#7c3aed',
    700: '#6d28d9',
  },
  secondary: {
    // Gold accent
  },
  neutral: {
    // Grays
  }
}
```

### Typography:
- **Headings**: Playfair Display / Cormorant Garamond
- **Body**: Inter / Open Sans
- **Arabic**: Cairo / Tajawal

### Components:
- **Buttons**: Rounded, with hover states
- **Cards**: Subtle shadows, rounded corners
- **Inputs**: Clean, with focus states
- **Modals**: Overlay with backdrop blur

---

## 📱 Responsive Strategy

### Breakpoints:
```typescript
sm: '640px',   // Mobile
md: '768px',   // Tablet
lg: '1024px',  // Desktop
xl: '1280px',  // Large Desktop
2xl: '1536px', // Ultra Wide
```

### Mobile-First Approach:
- Design for mobile first
- Progressive enhancement for larger screens
- Touch-friendly UI (44px minimum tap targets)
- Swipe gestures for carousels
- Bottom navigation for mobile

---

## 🧪 Testing Strategy

### Unit Tests:
- **Framework**: Vitest / Jest
- **Coverage**: Components, hooks, utilities
- **Target**: 70%+ coverage

### E2E Tests:
- **Framework**: Playwright / Cypress
- **Critical Flows**:
  - User registration → login
  - Product search → add to cart → checkout
  - Order placement → payment
  - Vendor: Product creation
  - Admin: User moderation

### Integration Tests:
- API client functions
- Authentication flows
- Form submissions

---

## 🚀 Deployment Strategy

### Customer Website (Vercel):
```bash
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url",
    "NEXTAUTH_SECRET": "@nextauth-secret"
  }
}
```

### Dashboards (Netlify/Vercel):
```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Environment Variables:
```env
# Customer Website
NEXT_PUBLIC_API_URL=https://api.aromasouq.com
NEXTAUTH_URL=https://aromasouq.com
NEXTAUTH_SECRET=your-secret
NEXT_PUBLIC_STRIPE_KEY=pk_live_...

# Vendor Dashboard
VITE_API_URL=https://api.aromasouq.com

# Admin Dashboard
VITE_API_URL=https://api.aromasouq.com
```

---

## 📊 Performance Targets

### Core Web Vitals:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Optimization Techniques:
- Image optimization (Next.js Image component)
- Code splitting (React.lazy)
- Route-based code splitting
- API response caching (React Query)
- Static generation for product pages
- Incremental Static Regeneration (ISR)
- CDN for static assets

---

## 🔄 CI/CD Pipeline

### GitHub Actions:

```yaml
# .github/workflows/deploy-web.yml
name: Deploy Customer Website

on:
  push:
    branches: [main]
    paths: ['apps/web/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build --workspace=apps/web
      - run: npm run test --workspace=apps/web
      - uses: vercel/actions@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 📚 Development Workflow

### Week 8: Customer Website - Core (Days 1-5)
**Day 1-2**: Setup + Homepage + Navigation
**Day 3**: Product Listing + Filters
**Day 4**: Product Detail + Similar Products
**Day 5**: Cart + Checkout Flow

### Week 9: Customer Website - Features (Days 1-5)
**Day 1**: Authentication + User Profile
**Day 2**: Order History + Tracking
**Day 3**: AI Features (Recommendations, Quiz)
**Day 4**: Wishlist + Rewards
**Day 5**: Static Pages + SEO

### Week 10: Vendor Dashboard (Days 1-5)
**Day 1**: Setup + Dashboard + Authentication
**Day 2**: Products Management (List, Create, Edit)
**Day 3**: Orders Management + Status Updates
**Day 4**: Payouts + Finance + Analytics
**Day 5**: Settings + Testing + Bug Fixes

### Week 11: Admin Dashboard (Days 1-5)
**Day 1**: Setup + Dashboard + Authentication
**Day 2**: User + Vendor Management
**Day 3**: Product Moderation + Approval Queue
**Day 4**: Order + Financial Management
**Day 5**: Analytics + Reports + Settings

### Week 12: Polish & Optimization (Days 1-5)
**Day 1**: Performance optimization across all apps
**Day 2**: Mobile responsiveness fixes
**Day 3**: Cross-browser testing + fixes
**Day 4**: Accessibility improvements (WCAG 2.1 AA)
**Day 5**: Final testing + Production deployment

---

## 🎯 Success Metrics

### Customer Website:
- [ ] All 17 pages implemented
- [ ] Mobile responsive (all breakpoints)
- [ ] Core Web Vitals passing
- [ ] SEO score > 90 (Lighthouse)
- [ ] Accessibility score > 90
- [ ] All API integrations working
- [ ] Payment flow functional
- [ ] Zero critical bugs

### Dashboards:
- [ ] All CRUD operations working
- [ ] Charts and analytics functional
- [ ] File uploads working
- [ ] Export features implemented
- [ ] Role-based access control
- [ ] Real-time updates (polling/websockets)
- [ ] Responsive design
- [ ] Zero critical bugs

---

## 💰 Cost Estimation

### Development Time:
- **Customer Website**: 10 days (Week 8-9)
- **Vendor Dashboard**: 5 days (Week 10)
- **Admin Dashboard**: 5 days (Week 11)
- **Polish & Testing**: 5 days (Week 12)
- **Total**: 25 days

### Development Cost:
- **Customer Website**: $25,000
- **Vendor Dashboard**: $15,000
- **Admin Dashboard**: $15,000
- **Polish & Testing**: $5,000
- **Total**: $60,000

---

## 📋 Next Steps

1. **Review & Approve Architecture** - Confirm technology choices
2. **Setup Projects** - Initialize all three apps
3. **Create Design System** - Finalize colors, typography, components
4. **Start Week 8** - Begin customer website development
5. **Iterate & Deploy** - Weekly deployments to staging

---

**Document Owner**: Technical Team
**Last Review**: November 7, 2025
**Next Review**: Start of Week 8

---

## 🎉 Ready to Build

With this comprehensive architecture guide and the backend 100% complete with 176+ API endpoints, you're fully equipped to build a world-class perfume e-commerce platform. The backend provides all the data and business logic needed - the frontend just needs to present it beautifully!

**Backend**: 100% Complete ✅
**Frontend**: Architecture Ready ✅
**Total Platform**: Ready for Development ✅
