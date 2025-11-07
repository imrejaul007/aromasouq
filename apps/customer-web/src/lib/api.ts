import axios from 'axios';

// API Client Configuration
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3200',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - Add auth token if available
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Product API
export const productApi = {
  // Get all products with filters
  getAll: (params?: any) =>
    api.get('/api/products', { params }),

  // Get product by ID
  getById: (id: string) =>
    api.get(`/api/products/${id}`),

  // Get trending products (AI-powered)
  getTrending: (limit = 12) =>
    api.get(`/api/products/ai/trending`, { params: { limit } }),

  // Smart search with AI
  smartSearch: (query: string, filters?: any, limit = 20) =>
    api.post('/api/products/ai/smart-search', { query, filters, limit }),

  // Get similar products with similarity score
  getSimilar: (id: string, limit = 10) =>
    api.get(`/api/products/ai/similar-with-score/${id}`, { params: { limit } }),

  // Get personalized recommendations
  getRecommendations: (userId: string, data: any) =>
    api.post(`/api/products/ai/recommendations/${userId}`, data),

  // Filter by scent family
  getByScentFamily: (scentFamily: string, page = 1, limit = 20) =>
    api.get(`/api/products/scent-family/${scentFamily}`, { params: { page, limit } }),

  // Filter by mood
  getByMood: (mood: string, limit = 20) =>
    api.get(`/api/products/mood/${mood}`, { params: { limit } }),

  // Filter by occasion
  getByOccasion: (occasion: string, page = 1, limit = 20) =>
    api.get(`/api/products/occasion/${occasion}`, { params: { page, limit } }),

  // Get featured products
  getFeatured: (limit = 12) =>
    api.get('/api/products/featured', { params: { limit } }),

  // Get new arrivals
  getNewArrivals: (limit = 12) =>
    api.get('/api/products/new-arrivals', { params: { limit } }),

  // Get best sellers
  getBestSellers: (limit = 12) =>
    api.get('/api/products/best-sellers', { params: { limit } }),

  // Find clones
  findClones: (brandName: string, limit = 20) =>
    api.get(`/api/products/clones/${brandName}`, { params: { limit } }),
};

// User API
export const userApi = {
  register: (data: any) =>
    api.post('/api/auth/register', data),

  login: (data: any) =>
    api.post('/api/auth/login', data),

  getProfile: () =>
    api.get('/api/users/me'),

  updateProfile: (data: any) =>
    api.patch('/api/users/me', data),
};

// Order API
export const orderApi = {
  create: (data: any) =>
    api.post('/api/orders', data),

  getAll: () =>
    api.get('/api/orders'),

  getById: (id: string) =>
    api.get(`/api/orders/${id}`),
};

export default api;
