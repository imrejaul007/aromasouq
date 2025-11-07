'use client';

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import ProductCard from '../products/ProductCard';
import { productApi } from '@/lib/api';

export default function TrendingProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const response = await productApi.getTrending(12);
        setProducts(response.data?.data || response.data || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching trending products:', err);
        setError(err.message || 'Failed to load trending products');
        // Use mock data for demo
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-8 h-8 text-orange-500" />
            <h2 className="text-3xl font-bold">Trending Now</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-96 animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error && products.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-8 h-8 text-orange-500" />
            <h2 className="text-3xl font-bold">Trending Now</h2>
          </div>
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-gray-600 mb-4">
              Unable to load trending products. Make sure the Product Service is running.
            </p>
            <p className="text-sm text-gray-500">
              Run: <code className="bg-gray-200 px-2 py-1 rounded">cd services/product-service && npm run start:dev</code>
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-8 h-8 text-orange-500" />
            <h2 className="text-3xl font-bold">Trending Now</h2>
          </div>
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-gray-600">No trending products at the moment</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Trending Now</h2>
              <p className="text-gray-600">Most popular fragrances this week</p>
            </div>
          </div>
          <a
            href="/products?sort=trending"
            className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2"
          >
            View All
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
