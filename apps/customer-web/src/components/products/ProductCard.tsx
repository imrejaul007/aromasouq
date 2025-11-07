import Link from 'next/link';
import { Heart, ShoppingCart, Star } from 'lucide-react';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    brand?: { name: string };
    pricing: {
      basePrice: number;
      salePrice?: number;
      currency: string;
    };
    media?: {
      images?: string[];
    };
    taxonomy?: {
      scentFamily?: string[];
    };
    stats?: {
      ratingAvg?: number;
      ratingCount?: number;
    };
    flags?: {
      featured?: boolean;
      new?: boolean;
    };
    similarityScore?: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.pricing.salePrice && product.pricing.salePrice < product.pricing.basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.pricing.basePrice - product.pricing.salePrice!) / product.pricing.basePrice) * 100)
    : 0;

  return (
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Image Container */}
      <Link href={`/products/${product._id}`} className="block relative">
        <div className="relative h-72 bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden">
          {product.media?.images?.[0] ? (
            <img
              src={product.media.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.flags?.featured && (
              <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full shadow-lg">
                ⭐ Featured
              </span>
            )}
            {product.flags?.new && (
              <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                🆕 New
              </span>
            )}
            {hasDiscount && (
              <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Similarity Score (if available) */}
          {product.similarityScore && (
            <div className="absolute top-3 right-3">
              <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full shadow-lg">
                {product.similarityScore}% Match
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50">
            <Heart className="w-5 h-5 text-gray-700 hover:text-red-500" />
          </button>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5">
        {/* Brand */}
        {product.brand?.name && (
          <p className="text-sm text-gray-500 mb-1 font-medium">{product.brand.name}</p>
        )}

        {/* Product Name */}
        <Link href={`/products/${product._id}`}>
          <h3 className="font-bold text-lg mb-2 hover:text-purple-600 transition-colors line-clamp-2 min-h-[56px]">
            {product.name}
          </h3>
        </Link>

        {/* Scent Family Tags */}
        {product.taxonomy?.scentFamily && product.taxonomy.scentFamily.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {product.taxonomy.scentFamily.slice(0, 3).map((scent) => (
              <span
                key={scent}
                className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium"
              >
                {scent}
              </span>
            ))}
          </div>
        )}

        {/* Rating */}
        {product.stats?.ratingAvg && product.stats.ratingAvg > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.stats!.ratingAvg!)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 font-medium">
              {product.stats.ratingAvg.toFixed(1)}
            </span>
            <span className="text-sm text-gray-400">
              ({product.stats.ratingCount || 0})
            </span>
          </div>
        )}

        {/* Price & Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-600">
                ${product.pricing.salePrice || product.pricing.basePrice}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
                  ${product.pricing.basePrice}
                </span>
              )}
            </div>
          </div>

          <button className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
