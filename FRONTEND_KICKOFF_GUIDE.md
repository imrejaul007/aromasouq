# Frontend Development - Kickoff Guide

**When to Start**: After backend is deployed to staging (recommended) or immediately
**Duration**: 4-5 weeks for MVP
**Team Size**: 1-3 developers
**Tech Stack**: Next.js 14 + React Admin + TypeScript

---

## 🎯 **Before You Start Frontend Development**

### **Prerequisites Checklist**

#### **1. Backend Deployment (Highly Recommended)**
- [ ] Backend deployed to staging environment
- [ ] All 6 services accessible via URLs
- [ ] Database migrations run successfully
- [ ] API endpoints tested and working
- [ ] CORS configured for frontend domains

**Why Important**: You'll need API URLs to integrate during development.

**Options**:
- **Best**: Deploy to DigitalOcean/Railway (2-3 hours setup)
- **Alternative**: Run backend locally (6 terminal windows)
- **Quick Test**: Deploy to Railway with one command

#### **2. Third-Party Accounts Created**
- [ ] Stripe account (for payments)
  - Get publishable key
  - Get secret key
  - Setup webhook endpoints

- [ ] SendGrid/AWS SES (for emails)
  - API key
  - Verified sender email

- [ ] Cloudinary/AWS S3 (for image uploads)
  - API credentials
  - Bucket/cloud name

- [ ] Google Analytics (optional, for tracking)
- [ ] Facebook Pixel (optional, for ads)

#### **3. Design Assets Ready**
- [ ] Logo (SVG + PNG)
- [ ] Brand colors defined
- [ ] Favicon
- [ ] Sample product images
- [ ] Hero images for homepage
- [ ] Icons (or use Heroicons/Lucide)

#### **4. Domain & Hosting**
- [ ] Domain purchased (aromasouq.com)
- [ ] Vercel/Netlify account created
- [ ] DNS ready to configure

#### **5. Development Environment**
- [ ] Node.js 18+ installed
- [ ] Code editor (VS Code recommended)
- [ ] Git configured
- [ ] Figma/Design file access (if available)

---

## 📅 **Frontend Development Timeline (4 Weeks)**

### **Week 1: Customer Website Foundation** (Days 1-7)

#### **Day 1: Project Setup (4-6 hours)**

**Morning: Initialize Next.js Project**
```bash
# Navigate to your project root
cd /Users/rejaulkarim/Documents/AromaSouQ/aromasouq-platform

# Create apps directory if it doesn't exist
mkdir -p apps

# Create Next.js 14 customer website
cd apps
npx create-next-app@latest customer-web \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm

cd customer-web
```

**Afternoon: Install Dependencies**
```bash
# Core dependencies
npm install axios react-query @tanstack/react-query
npm install zustand
npm install next-auth
npm install stripe @stripe/stripe-js
npm install react-hook-form zod
npm install clsx tailwind-merge
npm install lucide-react

# Dev dependencies
npm install -D @types/node @types/react
```

**Evening: Project Structure Setup**
```bash
# Create directory structure
mkdir -p src/app/(customer)
mkdir -p src/app/(auth)
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/products
mkdir -p src/lib
mkdir -p src/hooks
mkdir -p src/store
mkdir -p src/types
mkdir -p public/images
```

**Configure Environment Variables**
Create `apps/customer-web/.env.local`:
```env
# API URLs
NEXT_PUBLIC_API_BASE_URL=http://localhost:3200
NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:3100
NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://localhost:3200
NEXT_PUBLIC_ORDER_SERVICE_URL=http://localhost:3300
NEXT_PUBLIC_PAYMENT_SERVICE_URL=http://localhost:3500

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx

# Image Upload (Cloudinary or S3)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Create API Client**
`src/lib/api.ts`:
```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Product API
export const productApi = {
  getAll: (params?: any) => api.get('/api/products', { params }),
  getById: (id: string) => api.get(`/api/products/${id}`),
  search: (query: string, filters?: any) =>
    api.post('/api/products/ai/smart-search', { query, filters }),
  getTrending: (limit = 10) => api.get(`/api/products/ai/trending?limit=${limit}`),
  getSimilar: (id: string, limit = 10) =>
    api.get(`/api/products/ai/similar-with-score/${id}?limit=${limit}`),
  getByFilter: (filterType: string, value: string) =>
    api.get(`/api/products/${filterType}/${value}`),
};

// User API
export const userApi = {
  register: (data: any) => api.post('/api/auth/register', data),
  login: (data: any) => api.post('/api/auth/login', data),
  getProfile: () => api.get('/api/users/me'),
  updateProfile: (data: any) => api.patch('/api/users/me', data),
};

// Order API
export const orderApi = {
  create: (data: any) => api.post('/api/orders', data),
  getAll: () => api.get('/api/orders'),
  getById: (id: string) => api.get(`/api/orders/${id}`),
};
```

#### **Day 2-3: Homepage (12-16 hours)**

**Hero Section**
`src/components/home/HeroSection.tsx`:
```typescript
'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-r from-purple-900 to-indigo-800 text-white">
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold mb-6">
            Discover Your Signature Scent
          </h1>
          <p className="text-xl mb-8 text-purple-100">
            Explore thousands of fragrances from luxury brands and niche perfumers.
            AI-powered recommendations just for you.
          </p>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search for perfumes, brands, or scent notes..."
              className="w-full px-6 py-4 rounded-full text-gray-900 text-lg"
            />
            <button className="absolute right-2 top-2 bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700">
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Filters */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/products?mood=romantic"
              className="px-4 py-2 bg-white/20 rounded-full hover:bg-white/30">
              💕 Romantic
            </Link>
            <Link href="/products?mood=confident"
              className="px-4 py-2 bg-white/20 rounded-full hover:bg-white/30">
              💼 Confident
            </Link>
            <Link href="/products?scentFamily=oud"
              className="px-4 py-2 bg-white/20 rounded-full hover:bg-white/30">
              🌲 Oud
            </Link>
            <Link href="/products?type=clone"
              className="px-4 py-2 bg-white/20 rounded-full hover:bg-white/30">
              💎 Luxury Clones
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Trending Products Carousel**
`src/components/home/TrendingProducts.tsx`:
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';

export default function TrendingProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ['trending-products'],
    queryFn: () => productApi.getTrending(12),
  });

  if (isLoading) return <div>Loading trending products...</div>;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">🔥 Trending Now</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data?.data?.data?.map((product: any) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Product Card Component**
`src/components/products/ProductCard.tsx`:
```typescript
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      <Link href={`/products/${product._id}`}>
        <div className="relative h-64">
          <Image
            src={product.media?.images?.[0] || '/placeholder.png'}
            alt={product.name}
            fill
            className="object-cover"
          />
          {product.flags?.featured && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-xs px-2 py-1 rounded">
              ⭐ Featured
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product._id}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-purple-600">
            {product.name}
          </h3>
        </Link>

        <p className="text-gray-600 text-sm mb-2">{product.brand?.name}</p>

        {/* Scent Family Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.taxonomy?.scentFamily?.slice(0, 2).map((scent: string) => (
            <span key={scent} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              {scent}
            </span>
          ))}
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-purple-600">
              ${product.pricing?.salePrice || product.pricing?.basePrice}
            </span>
            {product.pricing?.salePrice && (
              <span className="text-sm text-gray-500 line-through ml-2">
                ${product.pricing?.basePrice}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button className="p-2 rounded-full hover:bg-gray-100">
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700">
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Rating */}
        {product.stats?.ratingAvg > 0 && (
          <div className="mt-2 flex items-center text-sm text-gray-600">
            <span className="text-yellow-500">⭐</span>
            <span className="ml-1">{product.stats.ratingAvg.toFixed(1)}</span>
            <span className="ml-1">({product.stats.ratingCount} reviews)</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Homepage Layout**
`src/app/page.tsx`:
```typescript
import HeroSection from '@/components/home/HeroSection';
import TrendingProducts from '@/components/home/TrendingProducts';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import TopBrands from '@/components/home/TopBrands';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <TrendingProducts />
      <FeaturedCategories />
      <TopBrands />

      {/* AI-Powered Section */}
      <section className="bg-gradient-to-r from-purple-50 to-indigo-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">🤖 AI-Powered Discovery</h2>
          <p className="text-lg text-gray-700 mb-8">
            Find your perfect scent with our intelligent recommendation engine
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-4">🧬</div>
              <h3 className="font-semibold mb-2">Scent DNA Matching</h3>
              <p className="text-gray-600">Match fragrances by notes and composition</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="font-semibold mb-2">Clone Finder</h3>
              <p className="text-gray-600">Find affordable alternatives to luxury brands</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-semibold mb-2">Smart Recommendations</h3>
              <p className="text-gray-600">Personalized picks based on your taste</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
```

#### **Day 4-5: Product Listing Page (12-16 hours)**

**Filter Sidebar**
`src/components/products/FilterSidebar.tsx`:
```typescript
'use client';

import { useState } from 'react';

const SCENT_FAMILIES = ['floral', 'woody', 'oriental', 'fresh', 'oud', 'fruity'];
const MOODS = ['romantic', 'confident', 'mysterious', 'elegant', 'playful'];
const OCCASIONS = ['date', 'office', 'party', 'wedding', 'daily'];

export default function FilterSidebar({ onFilterChange }: any) {
  const [filters, setFilters] = useState({
    scentFamily: [],
    mood: [],
    occasion: [],
    priceRange: { min: 0, max: 1000 },
  });

  const handleScentFamilyToggle = (scent: string) => {
    const updated = filters.scentFamily.includes(scent)
      ? filters.scentFamily.filter(s => s !== scent)
      : [...filters.scentFamily, scent];

    const newFilters = { ...filters, scentFamily: updated };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="font-bold text-lg mb-4">Filters</h3>

      {/* Scent Family */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3">Scent Family</h4>
        {SCENT_FAMILIES.map(scent => (
          <label key={scent} className="flex items-center mb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.scentFamily.includes(scent)}
              onChange={() => handleScentFamilyToggle(scent)}
              className="mr-2"
            />
            <span className="capitalize">{scent}</span>
          </label>
        ))}
      </div>

      {/* Mood */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3">Mood</h4>
        {MOODS.map(mood => (
          <label key={mood} className="flex items-center mb-2 cursor-pointer">
            <input
              type="checkbox"
              className="mr-2"
            />
            <span className="capitalize">{mood}</span>
          </label>
        ))}
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3">Price Range</h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="number"
            placeholder="Max"
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
        Apply Filters
      </button>
    </div>
  );
}
```

**Product Listing Page**
`src/app/products/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import FilterSidebar from '@/components/products/FilterSidebar';

export default function ProductsPage() {
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState('popular');

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters, sort],
    queryFn: () => productApi.getAll({ ...filters, sort }),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <FilterSidebar onFilterChange={setFilters} />
        </aside>

        {/* Products Grid */}
        <main className="flex-1">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              All Perfumes ({data?.data?.pagination?.total || 0})
            </h1>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border rounded px-4 py-2"
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {/* Products */}
          {isLoading ? (
            <div>Loading products...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.data?.data?.map((product: any) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-8 flex justify-center gap-2">
            <button className="px-4 py-2 border rounded hover:bg-gray-50">Previous</button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded">1</button>
            <button className="px-4 py-2 border rounded hover:bg-gray-50">2</button>
            <button className="px-4 py-2 border rounded hover:bg-gray-50">3</button>
            <button className="px-4 py-2 border rounded hover:bg-gray-50">Next</button>
          </div>
        </main>
      </div>
    </div>
  );
}
```

#### **Day 6-7: Product Detail Page (12-16 hours)**

Create comprehensive PDP with:
- Image gallery
- Product details
- Scent DNA visualization
- Similar products (AI-powered)
- Reviews
- Add to cart
- Add to wishlist

**Continue in next message for Days 8-28...**

---

## 🚀 **Quick Start Command (Day 1)**

When you're ready to start frontend:

```bash
# 1. Navigate to project
cd /Users/rejaulkarim/Documents/AromaSouQ/aromasouq-platform

# 2. Create Next.js app
mkdir -p apps && cd apps
npx create-next-app@latest customer-web --typescript --tailwind --app

# 3. Install dependencies
cd customer-web
npm install axios @tanstack/react-query zustand next-auth

# 4. Start development
npm run dev

# 5. Open browser
# http://localhost:3000
```

---

## 📚 **Resources You'll Need**

### **Documentation to Reference**
1. **FRONTEND_ARCHITECTURE_GUIDE.md** - Complete architecture
2. **WEEK7_AI_FEATURES_COMPLETE.md** - AI endpoints to integrate
3. **WEEK2-3_PRODUCT_ENHANCEMENT_COMPLETE.md** - Filter endpoints
4. **API Documentation** - All 176+ endpoints

### **Design Inspiration**
- Fragrantica.com - Filters and product pages
- Sephora.com - E-commerce UX
- Notino.com - Product discovery
- FragranceX.com - Product details

### **Component Libraries (Optional)**
- **shadcn/ui** - Beautiful components
- **Headless UI** - Accessible components
- **Radix UI** - Primitive components
- **Heroicons/Lucide** - Icons

---

## ⏰ **Time Estimates**

**Week 1**: Homepage + PLP + PDP = ~40 hours
**Week 2**: Cart + Checkout + Auth = ~40 hours
**Week 3**: Profile + Orders + Wishlist = ~40 hours
**Week 4**: AI Features + Polish = ~40 hours

**Total**: ~160 hours (4 weeks at 40 hours/week)

---

## 🎯 **Success Criteria**

**End of Week 1**:
- [ ] Homepage live with trending products
- [ ] Product listing page with filters working
- [ ] Product detail page complete
- [ ] Navigation and layout functional

**End of Week 2**:
- [ ] User can register and login
- [ ] Add to cart working
- [ ] Checkout flow complete
- [ ] Payment integration (Stripe)

**End of Week 3**:
- [ ] User profile management
- [ ] Order history
- [ ] Wishlist functionality
- [ ] Rewards balance display

**End of Week 4**:
- [ ] AI features integrated (recommendations, smart search)
- [ ] Mobile responsive
- [ ] SEO optimized
- [ ] Ready for deployment

---

## 💡 **Pro Tips**

1. **Start Simple**: Build basic functionality first, then enhance
2. **Use AI Endpoints**: Leverage the 6 AI features you built
3. **Mobile First**: Design for mobile, scale up to desktop
4. **Test as You Go**: Don't wait until the end to test
5. **Reuse Components**: Build reusable components from day 1
6. **Use TypeScript**: Catch errors early with strong typing
7. **Performance**: Use Next.js Image, lazy loading, code splitting

---

**Ready to start?** Just say "start frontend" and I'll help you with Day 1 setup! 🚀
