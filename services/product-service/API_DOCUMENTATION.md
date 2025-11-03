# Product Service API Documentation

**Version**: 2.0 (Week 2 Enhanced)
**Base URL**: `http://localhost:3001`
**Service**: Product Service

---

## Table of Contents

1. [New Endpoints (Week 2)](#new-endpoints-week-2)
2. [Enhanced Search Filters](#enhanced-search-filters)
3. [Mood-Based Endpoints](#mood-based-endpoints)
4. [Cashback Endpoints](#cashback-endpoints)
5. [Projection Endpoints](#projection-endpoints)
6. [Fulfillment Type Endpoints](#fulfillment-type-endpoints)
7. [Existing Endpoints](#existing-endpoints)

---

## New Endpoints (Week 2)

### Summary of New Features

Week 2 added **10 new API endpoints** supporting:
- Mood-based product discovery
- Cashback filtering and sorting
- Projection rating filters
- Fulfillment type filtering (retail, wholesale, manufacturing, raw materials)
- Enhanced similarity matching

---

## Enhanced Search Filters

### POST /products/search

Enhanced search with new filter parameters.

**New Query Parameters**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `mood` | string[] | Filter by mood tags | `?mood=romantic,confident` |
| `fulfillmentType` | string | Filter by fulfillment type | `?fulfillmentType=wholesale` |
| `minProjectionRating` | number | Minimum projection rating (1-10) | `?minProjectionRating=7` |
| `maxProjectionRating` | number | Maximum projection rating (1-10) | `?maxProjectionRating=9` |
| `minCashbackRate` | number | Minimum cashback percentage | `?minCashbackRate=5` |
| `sortBy` | string | Now includes 'cashback' option | `?sortBy=cashback` |

**Complete Search Example**:

```bash
GET /products/search?
  q=oud&
  type=original,niche&
  scentFamily=woody,oriental&
  gender=men,unisex&
  mood=confident,mysterious&
  minProjectionRating=7&
  minCashbackRate=5&
  fulfillmentType=retail&
  sortBy=cashback&
  page=1&
  limit=20
```

**Response**:
```json
{
  "data": [
    {
      "id": "...",
      "name": "Oud Royale",
      "slug": "oud-royale",
      "taxonomy": {
        "mood": ["confident", "mysterious", "powerful"],
        "fulfillmentType": "retail"
      },
      "attributes": {
        "projectionRating": 9
      },
      "pricing": {
        "retail": {
          "amount": 450,
          "currency": "AED"
        },
        "cashbackRate": 10
      }
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

## Mood-Based Endpoints

### GET /products/mood/:mood

Get products by single mood.

**Parameters**:
- `mood` (path): Mood tag (romantic, confident, fresh, mysterious, elegant, casual, powerful, seductive, playful)
- `limit` (query, optional): Results limit (default: 20)

**Example**:
```bash
GET /products/mood/romantic?limit=10
```

**Response**:
```json
[
  {
    "id": "...",
    "name": "Rose Elegance",
    "taxonomy": {
      "mood": ["romantic", "elegant", "seductive"]
    }
  }
]
```

**Use Cases**:
- "Show me romantic fragrances for a date night"
- Product landing pages per mood
- Marketing campaigns by emotional appeal

---

### GET /products/moods/multiple

Get products matching multiple moods (AND logic).

**Parameters**:
- `moods` (query): Comma-separated mood tags
- `limit` (query, optional): Results limit (default: 20)

**Example**:
```bash
GET /products/moods/multiple?moods=confident,elegant&limit=15
```

**Response**: Array of products that have BOTH confident AND elegant moods.

**Use Cases**:
- "Find fragrances that are both confident and elegant" (business meetings)
- "Show me fresh and playful scents" (daytime casual)
- Complex mood combinations for sophisticated shopping

---

## Cashback Endpoints

### GET /products/cashback/high

Get products with high cashback rates.

**Parameters**:
- `minRate` (query, optional): Minimum cashback percentage (default: 5)
- `limit` (query, optional): Results limit (default: 20)

**Example**:
```bash
GET /products/cashback/high?minRate=10&limit=20
```

**Response**:
```json
[
  {
    "id": "...",
    "name": "Premium Oud",
    "pricing": {
      "retail": {
        "amount": 500,
        "currency": "AED"
      },
      "cashbackRate": 15
    },
    "cashbackAmount": 75
  }
]
```

**Sorted By**: Cashback rate (highest first)

**Use Cases**:
- "Show me products with best cashback deals"
- Promotional banners for high-reward products
- Customer retention campaigns
- Integration with Rewards System (Week 4)

---

## Projection Endpoints

### GET /products/projection/strong

Get products with strong projection (sillage).

**Parameters**:
- `minRating` (query, optional): Minimum projection rating 1-10 (default: 7)
- `limit` (query, optional): Results limit (default: 20)

**Example**:
```bash
GET /products/projection/strong?minRating=8&limit=10
```

**Response**:
```json
[
  {
    "id": "...",
    "name": "Beast Mode Oud",
    "attributes": {
      "projectionRating": 10,
      "projection": "very_strong",
      "longevityHours": 16
    }
  }
]
```

**Sorted By**: Projection rating (highest first)

**Use Cases**:
- "Find fragrances that last all day with strong sillage"
- "Show me office-appropriate subtle scents" (minRating=1-4)
- Filter for special occasions requiring statement scents
- Educational content about projection

**Rating Scale**:
- 1-3: Soft, intimate (skin scents)
- 4-6: Moderate (arm's length)
- 7-8: Strong (noticeable in a room)
- 9-10: Very strong (beast mode, fills spaces)

---

## Fulfillment Type Endpoints

### GET /products/fulfillment/:type

Get products by fulfillment type.

**Parameters**:
- `type` (path): Fulfillment type (retail, wholesale, manufacturing, raw_material, packaging)
- `page` (query, optional): Page number (default: 1)
- `limit` (query, optional): Results per page (default: 20)

**Example**:
```bash
GET /products/fulfillment/wholesale?page=1&limit=50
```

**Response**:
```json
{
  "data": [
    {
      "id": "...",
      "name": "Amber Wholesale Pack",
      "taxonomy": {
        "fulfillmentType": "wholesale"
      },
      "pricing": {
        "retail": {
          "amount": 350,
          "currency": "AED"
        },
        "wholesale": {
          "amount": 200,
          "currency": "AED",
          "minQuantity": 12
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

**Use Cases**:
- B2B customer portals
- Wholesale catalogs
- Manufacturing partner interfaces
- Raw material suppliers

---

### GET /products/wholesale/products

Shortcut for wholesale products.

**Example**:
```bash
GET /products/wholesale/products?page=1&limit=20
```

Equivalent to: `GET /products/fulfillment/wholesale`

---

### GET /products/manufacturing/products

Shortcut for manufacturing products.

**Example**:
```bash
GET /products/manufacturing/products?page=1&limit=20
```

**Use Cases**:
- White-label production catalogs
- Custom formulation requests
- OEM/ODM partner portals

---

### GET /products/raw-materials/products

Shortcut for raw materials.

**Example**:
```bash
GET /products/raw-materials/products?page=1&limit=20
```

**Use Cases**:
- Ingredient sourcing
- DIY fragrance enthusiasts
- Perfumers and formulators
- Bulk ingredient orders

---

## Enhanced Similarity Endpoints

### GET /products/:id/similar-enhanced

Get similar products with enhanced matching (mood + projection + scent).

**Parameters**:
- `id` (path): Product ID
- `limit` (query, optional): Results limit (default: 5)

**Example**:
```bash
GET /products/64a8f2c1d3e4f5a6b7c8d9e0/similar-enhanced?limit=10
```

**Response**:
```json
[
  {
    "id": "...",
    "name": "Similar Fragrance",
    "taxonomy": {
      "scentFamily": ["woody", "oriental"],
      "mood": ["confident", "mysterious"]
    },
    "attributes": {
      "projectionRating": 8
    }
  }
]
```

**Matching Logic**:
1. Same scent families (required)
2. Overlapping mood tags (if source has moods)
3. Similar projection rating (±2 points)
4. Sorted by rating

**Improvements Over Basic Similar**:
- Basic: Only scent family + type
- Enhanced: Scent + mood + projection

**Use Cases**:
- "Customers who liked this also liked..."
- More accurate recommendations
- Cross-selling based on emotional appeal
- Better conversion rates

---

## Sort Options

Enhanced `sortBy` parameter now supports:

| Value | Description | Use Case |
|-------|-------------|----------|
| `newest` | Newest first (default) | New arrivals |
| `price_asc` | Price low to high | Budget shoppers |
| `price_desc` | Price high to low | Luxury browsers |
| `rating` | Highest rated first | Quality seekers |
| `sales` | Best sellers first | Popular products |
| `cashback` | **NEW** - Highest cashback first | Deal hunters |

**Example**:
```bash
GET /products/search?sortBy=cashback&minCashbackRate=5
```

Returns products with at least 5% cashback, sorted by highest cashback rate.

---

## Existing Endpoints

### POST /products
Create a new product.

**Body**: CreateProductDto (now includes mood, fulfillmentType, projectionRating, cashbackRate, ugcVideos)

**Example**:
```json
{
  "sku": "ASQ-OUD-001",
  "name": "Royal Oud Intense",
  "slug": "royal-oud-intense",
  "taxonomy": {
    "type": ["original"],
    "mood": ["confident", "powerful", "mysterious"],
    "fulfillmentType": "retail"
  },
  "attributes": {
    "volume": "100ml",
    "longevityHours": 12,
    "projection": "strong",
    "projectionRating": 9
  },
  "pricing": {
    "retail": {
      "amount": 450,
      "currency": "AED"
    },
    "cashbackRate": 10
  },
  "media": {
    "images": [...],
    "videos": [...],
    "ugcVideos": [
      {
        "url": "https://...",
        "creatorId": "influencer123",
        "creatorName": "Fragrance Reviewer",
        "views": 15000,
        "likes": 2300,
        "verified": true
      }
    ]
  }
}
```

---

### GET /products
Get all active products (paginated).

**Parameters**:
- `page` (query, optional): Page number (default: 1)
- `limit` (query, optional): Results per page (default: 20)

---

### GET /products/:id
Get product by ID.

---

### GET /products/slug/:slug
Get product by slug.

---

### GET /products/sku/:sku
Get product by SKU.

---

### GET /products/featured
Get featured products.

**Parameters**:
- `limit` (query, optional): Results limit (default: 10)

---

### GET /products/new-arrivals
Get new arrival products.

**Parameters**:
- `limit` (query, optional): Results limit (default: 10)

---

### GET /products/best-sellers
Get best-selling products.

**Parameters**:
- `limit` (query, optional): Results limit (default: 10)

---

### GET /products/brand/:brandSlug
Get products by brand.

**Parameters**:
- `brandSlug` (path): Brand slug
- `page` (query, optional): Page number
- `limit` (query, optional): Results per page

---

### GET /products/:id/similar
Get similar products (basic matching).

Uses scent family and type only.

---

### PATCH /products/:id
Update a product.

**Body**: UpdateProductDto (partial update)

---

### PATCH /products/:id/stock
Update product stock for a vendor.

**Body**:
```json
{
  "vendorId": "vendor123",
  "quantity": 50
}
```

---

### DELETE /products/:id
Soft delete a product (sets active flag to false).

---

### DELETE /products/:id/hard
Permanently delete a product.

---

### POST /products/bulk/prices
Bulk update product prices.

**Body**:
```json
[
  { "id": "product1", "price": 450 },
  { "id": "product2", "price": 350 }
]
```

---

## Filter Combinations

### Example 1: Perfect Date Night Fragrance

```bash
GET /products/search?
  mood=romantic,seductive&
  gender=men&
  concentration=edp&
  minProjectionRating=6&
  maxProjectionRating=8&
  occasion=date&
  sortBy=rating
```

Finds romantic, seductive fragrances with moderate-strong projection for dates.

---

### Example 2: High-Value Wholesale Deals

```bash
GET /products/search?
  fulfillmentType=wholesale&
  minCashbackRate=5&
  sortBy=cashback&
  limit=50
```

B2B customers finding wholesale products with best cashback rewards.

---

### Example 3: Office-Appropriate Fresh Scents

```bash
GET /products/search?
  mood=fresh,casual&
  occasion=office&
  minProjectionRating=1&
  maxProjectionRating=5&
  timesOfDay=morning,afternoon
```

Subtle, fresh fragrances appropriate for professional settings.

---

### Example 4: Premium Ouds for Special Occasions

```bash
GET /products/search?
  oudType=cambodian,hindi&
  mood=mysterious,powerful&
  minProjectionRating=8&
  priceSegment=luxury&
  occasion=wedding,eid
```

High-end oud fragrances for special cultural events.

---

## Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 409 | Conflict (duplicate SKU/slug) |
| 500 | Internal Server Error |

---

## Rate Limiting

- Default: 100 requests per minute per IP
- Authenticated: 1000 requests per minute
- Bulk operations: 10 requests per minute

---

## Pagination

All paginated endpoints return:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Next Steps (Week 3)

- Add Elasticsearch integration for advanced text search
- Add aggregation endpoints (faceted search)
- Add recommendation engine endpoints
- Add personalized search based on user preferences

---

**Last Updated**: January 3, 2025
**Version**: 2.0 (Week 2 Part 2)
