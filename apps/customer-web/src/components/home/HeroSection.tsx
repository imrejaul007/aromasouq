'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Sparkles } from 'lucide-react';

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-300 rounded-full blur-3xl"></div>
      </div>

      <div className="container relative mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium">AI-Powered Fragrance Discovery</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Discover Your
            <span className="block bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              Signature Scent
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl mb-8 text-purple-100 max-w-2xl mx-auto">
            Explore thousands of fragrances with intelligent recommendations.
            Find your perfect match using our AI-powered scent DNA technology.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for perfumes, brands, or scent notes..."
                className="w-full px-6 py-5 pr-16 rounded-2xl text-gray-900 text-lg placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-300 shadow-2xl"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Quick filters */}
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/products?mood=romantic"
              className="px-5 py-2.5 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all text-sm font-medium"
            >
              💕 Romantic
            </Link>
            <Link
              href="/products?mood=confident"
              className="px-5 py-2.5 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all text-sm font-medium"
            >
              💼 Confident
            </Link>
            <Link
              href="/products?scentFamily=oud"
              className="px-5 py-2.5 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all text-sm font-medium"
            >
              🌲 Oud
            </Link>
            <Link
              href="/products?type=clone"
              className="px-5 py-2.5 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all text-sm font-medium"
            >
              💎 Luxury Clones
            </Link>
            <Link
              href="/products?scentFamily=fresh"
              className="px-5 py-2.5 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all text-sm font-medium"
            >
              🌊 Fresh
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto">
            <div>
              <div className="text-3xl font-bold mb-1">10K+</div>
              <div className="text-purple-200 text-sm">Products</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">500+</div>
              <div className="text-purple-200 text-sm">Brands</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">50K+</div>
              <div className="text-purple-200 text-sm">Happy Customers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
