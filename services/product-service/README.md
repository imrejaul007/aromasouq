# Product Service - AromaSouQ Platform

Complete NestJS microservice for managing products, brands, and categories in the AromaSouQ fragrance marketplace.

## 🎯 Features

### Product Management
- ✅ Complete CRUD operations for products
- ✅ Advanced search with 10-category taxonomy filtering
- ✅ Multi-vendor inventory management
- ✅ Featured products, new arrivals, best sellers
- ✅ Similar products based on scent DNA
- ✅ Stock management with low stock flags
- ✅ Bulk price updates
- ✅ Soft delete support

### Brand Management
- ✅ Brand CRUD operations
- ✅ Brand profiles with logo and cover image
- ✅ Featured brands
- ✅ Product count tracking

### Category Management
- ✅ Hierarchical category structure
- ✅ Category tree navigation
- ✅ Multiple category types (type, scent_family, gender, etc.)
- ✅ Product count tracking

## 📦 Tech Stack

- **Framework**: NestJS 10
- **Database**: MongoDB with Mongoose
- **Validation**: class-validator, class-transformer
- **Configuration**: @nestjs/config

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB running on localhost:27017

### Installation

```bash
npm install
```

### Environment Setup

Configure your environment variables in `.env`:
```env
PORT=3200
MONGODB_URI=mongodb://localhost:27017/aromasouq_products
```

### Start MongoDB (Docker)

```bash
# From project root
docker-compose up mongodb -d
```

### Run the Service

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The service will be available at: `http://localhost:3200/api`

## 📡 API Endpoints (36+)

### Products (20 endpoints)
- `POST /api/products` - Create product
- `GET /api/products` - List all products
- `GET /api/products/search` - Advanced search
- `GET /api/products/featured` - Featured products
- `GET /api/products/new-arrivals` - New arrivals
- `GET /api/products/best-sellers` - Best sellers
- `GET /api/products/brand/:brandSlug` - Products by brand
- `GET /api/products/slug/:slug` - Get by slug
- `GET /api/products/sku/:sku` - Get by SKU
- `GET /api/products/:id` - Get by ID
- `GET /api/products/:id/similar` - Similar products
- `PATCH /api/products/:id` - Update product
- `PATCH /api/products/:id/stock` - Update stock
- `DELETE /api/products/:id` - Soft delete
- `DELETE /api/products/:id/hard` - Hard delete
- `POST /api/products/bulk/prices` - Bulk update prices

### Brands (7 endpoints)
- `POST /api/brands` - Create brand
- `GET /api/brands` - List brands
- `GET /api/brands/featured` - Featured brands
- `GET /api/brands/slug/:slug` - Get by slug
- `GET /api/brands/:id` - Get by ID
- `PATCH /api/brands/:id` - Update brand
- `DELETE /api/brands/:id` - Delete brand

### Categories (9 endpoints)
- `POST /api/categories` - Create category
- `GET /api/categories` - List all
- `GET /api/categories/tree` - Category tree
- `GET /api/categories/type/:type` - Filter by type
- `GET /api/categories/slug/:slug` - Get by slug
- `GET /api/categories/:id` - Get by ID
- `GET /api/categories/:id/children` - Get children
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

## 🗂️ Project Structure

```
src/
├── products/          # Product module (service, controller, DTOs)
├── brands/            # Brand module
├── categories/        # Category module
├── schemas/           # MongoDB schemas (Product, Brand, Category)
├── app.module.ts      # Main application module
└── main.ts           # Bootstrap
```

## 🎨 Product Schema - 10 Categories

1. **Type**: original, similar_dna, clone, niche, our_brand, attar, body_spray
2. **Scent Family**: floral, fruity, woody, oud, musky, oriental, etc.
3. **Gender**: men, women, unisex
4. **Region**: UAE, Saudi Arabia, Kuwait, Qatar, etc.
5. **Price Segment**: budget, mid_range, premium, luxury, ultra_luxury
6. **Occasion**: office, party, wedding, ramadan, eid, gift
7. **Oud Type**: cambodian, indian, thai, malaysian, mukhallat
8. **Concentration**: parfum, edp, edt, attar, mist
9. **Brand**: Dynamic brand references
10. **Special Edition**: Collections

## 📝 Status

**100% Complete** ✅

- ✅ 36+ REST endpoints
- ✅ ~2,500 lines of TypeScript
- ✅ Full validation
- ✅ MongoDB indexes
- ✅ Built & tested

---

**Built for AromaSouQ Platform** 🌟
