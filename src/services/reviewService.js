/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:09.367Z */
import apiService from './api.js';

class ReviewService {
  constructor() {
    // Ensure we point to the backend API paths
    this.endpoints = {
      reviews: '/api/reviews',
      products: '/api/products'
    };
  }

  // Submit a rating (ratings-only). Keeps the same method name to avoid breaking callers.
  // reviewData: { productId, rating }
  async submitReview(reviewData) {
    const { productId, rating } = reviewData || {};
    if (!productId) throw new Error('productId is required');
    const r = Number(rating);
    if (!r || r < 1 || r > 5) throw new Error('rating must be between 1 and 5');

    try {
      const response = await apiService.post(this.endpoints.reviews, {
        product_id: productId,
        rating: Math.max(1, Math.min(5, r))
      });
      // backend returns { reviews: [...] } with recent rows
      return response.data || {};
    } catch (err) {
      console.error('Error submitting rating:', err);
      throw new Error('Failed to submit rating');
    }
  }

  // Fetch ratings rows for a product (ratings-only)
  async getProductReviews(productId, params = {}) {
    if (!productId) return { reviews: [] };
    try {
      const response = await apiService.get(this.endpoints.reviews, { product_id: productId, ...params });
      return {
        reviews: response.data.reviews || []
      };
    } catch (err) {
      console.error('Error fetching product ratings:', err);
      return { reviews: [] };
    }
  }

  // Get aggregated stats for a product by asking the product endpoint (which attaches rating & reviewCount)
  async getReviewStats(productId) {
    if (!productId) return { averageRating: 0, totalReviews: 0 };
    try {
      const response = await apiService.get(`${this.endpoints.products}/${productId}`);
      const product = response.data.product || response.data || {};
      return {
        averageRating: product.ratings?.average ?? product.rating ?? 0,
        totalReviews: product.ratings?.count ?? product.reviewCount ?? 0
      };
    } catch (err) {
      console.error('Error fetching product stats:', err);
      return { averageRating: 0, totalReviews: 0 };
    }
  }

  // Minimal helpers kept as no-ops or thin wrappers so admin UIs that import this service don't break.
  async getRecentReviews(limit = 10) {
    try {
      const resp = await apiService.get(this.endpoints.reviews, { limit });
      return resp.data.reviews || [];
    } catch (e) {
      console.error('Error fetching recent ratings:', e);
      return [];
    }
  }
}

const reviewService = new ReviewService();
export default reviewService;