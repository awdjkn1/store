import apiService from './api.js';

class ReviewService {
  constructor() {
    this.endpoints = {
      reviews: '/reviews',
      products: '/products'
    };
  }

  // Submit a new review
  async submitReview(reviewData) {
    const {
      productId,
      rating,
      title,
      comment,
      images = [],
      pros = [],
      cons = [],
      wouldRecommend = true,
      verifiedPurchase = false
    } = reviewData;

    try {
      // First, submit the review data
      const response = await apiService.post(this.endpoints.reviews, {
        product_id: productId,
        rating,
        title,
        comment,
        pros,
        cons,
        would_recommend: wouldRecommend,
        verified_purchase: verifiedPurchase
      });

      const reviewId = response.data.id;

      // If there are images, upload them
      if (images.length > 0) {
        await this.uploadReviewImages(reviewId, images);
      }

      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw new Error('Failed to submit review');
    }
  }

  // Upload review images
  async uploadReviewImages(reviewId, images) {
    try {
      const uploadPromises = images.map((image, index) =>
        apiService.upload(
          `${this.endpoints.reviews}/${reviewId}/images`,
          image,
          { order: index }
        )
      );

      const results = await Promise.all(uploadPromises);
      return results.map(result => result.data);
    } catch (error) {
      console.error('Error uploading review images:', error);
      throw new Error('Failed to upload review images');
    }
  }

  // Get reviews for a product
  async getProductReviews(productId, params = {}) {
    const {
      page = 1,
      limit = 10,
      rating,
      sortBy = 'created_at',
      sortOrder = 'desc',
      verifiedOnly = false,
      withImages = false
    } = params;

    try {
      const response = await apiService.get(
        `${this.endpoints.products}/${productId}/reviews`,
        {
          page,
          limit,
          rating,
          sort_by: sortBy,
          sort_order: sortOrder,
          verified_only: verifiedOnly,
          with_images: withImages
        }
      );

      return {
        reviews: response.data.reviews || [],
        pagination: response.data.pagination || {},
        summary: response.data.summary || {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          verifiedCount: 0,
          recommendationRate: 0
        }
      };
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      return {
        reviews: [],
        pagination: {},
        summary: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          verifiedCount: 0,
          recommendationRate: 0
        }
      };
    }
  }

  // Get a single review
  async getReview(reviewId) {
    try {
      const response = await apiService.get(`${this.endpoints.reviews}/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching review ${reviewId}:`, error);
      throw new Error('Review not found');
    }
  }

  // Update a review
  async updateReview(reviewId, reviewData) {
    try {
      const response = await apiService.put(`${this.endpoints.reviews}/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw new Error('Failed to update review');
    }
  }

  // Delete a review
  async deleteReview(reviewId) {
    try {
      await apiService.delete(`${this.endpoints.reviews}/${reviewId}`);
      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw new Error('Failed to delete review');
    }
  }

  // Mark review as helpful
  async markHelpful(reviewId, helpful = true) {
    try {
      const response = await apiService.post(`${this.endpoints.reviews}/${reviewId}/helpful`, {
        helpful
      });
      return response.data;
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      throw new Error('Failed to update helpfulness');
    }
  }

  // Report a review
  async reportReview(reviewId, reason, details = '') {
    try {
      const response = await apiService.post(`${this.endpoints.reviews}/${reviewId}/report`, {
        reason,
        details
      });
      return response.data;
    } catch (error) {
      console.error('Error reporting review:', error);
      throw new Error('Failed to report review');
    }
  }

  // Get user's reviews
  async getUserReviews(params = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params;

    try {
      const response = await apiService.get('/user/reviews', {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      return {
        reviews: response.data.reviews || [],
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      return { reviews: [], pagination: {} };
    }
  }

  // Check if user can review a product
  async canReviewProduct(productId) {
    try {
      const response = await apiService.get(
        `${this.endpoints.products}/${productId}/can-review`
      );
      return response.data;
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return { canReview: false, reason: 'Unknown error' };
    }
  }

  // Get review statistics for a product
  async getReviewStats(productId) {
    try {
      const response = await apiService.get(
        `${this.endpoints.products}/${productId}/review-stats`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedCount: 0,
        recommendationRate: 0
      };
    }
  }

  // Get featured reviews
  async getFeaturedReviews(params = {}) {
    const {
      limit = 6,
      minRating = 4,
      verifiedOnly = true,
      withImages = true
    } = params;

    try {
      const response = await apiService.get(`${this.endpoints.reviews}/featured`, {
        limit,
        min_rating: minRating,
        verified_only: verifiedOnly,
        with_images: withImages
      });
      return response.data.reviews || [];
    } catch (error) {
      console.error('Error fetching featured reviews:', error);
      return [];
    }
  }

  // Get recent reviews
  async getRecentReviews(params = {}) {
    const {
      limit = 10,
      days = 7
    } = params;

    try {
      const response = await apiService.get(`${this.endpoints.reviews}/recent`, {
        limit,
        days
      });
      return response.data.reviews || [];
    } catch (error) {
      console.error('Error fetching recent reviews:', error);
      return [];
    }
  }

  // Moderate reviews (admin only)
  async moderateReview(reviewId, action, reason = '') {
    try {
      const response = await apiService.post(`${this.endpoints.reviews}/${reviewId}/moderate`, {
        action, // 'approve', 'reject', 'flag'
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error moderating review:', error);
      throw new Error('Failed to moderate review');
    }
  }

  // Get reviews pending moderation (admin only)
  async getPendingReviews(params = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params;

    try {
      const response = await apiService.get(`${this.endpoints.reviews}/pending`, {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      return {
        reviews: response.data.reviews || [],
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      return { reviews: [], pagination: {} };
    }
  }

  // Get reported reviews (admin only)
  async getReportedReviews(params = {}) {
    const {
      page = 1,
      limit = 20,
      reason
    } = params;

    try {
      const response = await apiService.get(`${this.endpoints.reviews}/reported`, {
        page,
        limit,
        reason
      });

      return {
        reviews: response.data.reviews || [],
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching reported reviews:', error);
      return { reviews: [], pagination: {} };
    }
  }

  // Bulk moderate reviews (admin only)
  async bulkModerateReviews(reviewIds, action, reason = '') {
    try {
      const response = await apiService.post(`${this.endpoints.reviews}/bulk-moderate`, {
        review_ids: reviewIds,
        action,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk moderating reviews:', error);
      throw new Error('Failed to bulk moderate reviews');
    }
  }

  // Get review analytics (admin only)
  async getReviewAnalytics(dateRange = {}) {
    const { startDate, endDate } = dateRange;

    try {
      const response = await apiService.get(`${this.endpoints.reviews}/analytics`, {
        start_date: startDate,
        end_date: endDate
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching review analytics:', error);
      return {};
    }
  }

  // Export reviews (admin only)
  async exportReviews(filters = {}, format = 'csv') {
    try {
      const response = await apiService.get(`${this.endpoints.reviews}/export`, {
        ...filters,
        format
      });

      // Create and trigger download
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reviews_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error exporting reviews:', error);
      throw new Error('Failed to export reviews');
    }
  }

  // Search reviews
  async searchReviews(query, params = {}) {
    const {
      page = 1,
      limit = 10,
      productId,
      minRating,
      maxRating,
      sortBy = 'relevance'
    } = params;

    try {
      const response = await apiService.get(`${this.endpoints.reviews}/search`, {
        q: query,
        page,
        limit,
        product_id: productId,
        min_rating: minRating,
        max_rating: maxRating,
        sort_by: sortBy
      });

      return {
        reviews: response.data.reviews || [],
        totalResults: response.data.total || 0,
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      console.error('Error searching reviews:', error);
      return { reviews: [], totalResults: 0, pagination: {} };
    }
  }

  // Get review insights for a product
  async getProductInsights(productId) {
    try {
      const response = await apiService.get(
        `${this.endpoints.products}/${productId}/review-insights`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching product insights:', error);
      return {
        sentimentAnalysis: { positive: 0, negative: 0, neutral: 0 },
        commonTopics: [],
        frequentWords: [],
        improvementAreas: []
      };
    }
  }

  // Reply to a review (business owner)
  async replyToReview(reviewId, replyText) {
    try {
      const response = await apiService.post(`${this.endpoints.reviews}/${reviewId}/reply`, {
        reply: replyText
      });
      return response.data;
    } catch (error) {
      console.error('Error replying to review:', error);
      throw new Error('Failed to reply to review');
    }
  }

  // Update review reply
  async updateReviewReply(reviewId, replyText) {
    try {
      const response = await apiService.put(`${this.endpoints.reviews}/${reviewId}/reply`, {
        reply: replyText
      });
      return response.data;
    } catch (error) {
      console.error('Error updating review reply:', error);
      throw new Error('Failed to update reply');
    }
  }

  // Delete review reply
  async deleteReviewReply(reviewId) {
    try {
      await apiService.delete(`${this.endpoints.reviews}/${reviewId}/reply`);
      return true;
    } catch (error) {
      console.error('Error deleting review reply:', error);
      throw new Error('Failed to delete reply');
    }
  }

  // Get review templates (for common responses)
  async getReviewTemplates() {
    try {
      const response = await apiService.getCached(`${this.endpoints.reviews}/templates`);
      return response.data.templates || [];
    } catch (error) {
      console.error('Error fetching review templates:', error);
      return [];
    }
  }

  // Validate review data before submission
  validateReview(reviewData) {
    const errors = [];
    const { rating, title, comment } = reviewData;

    if (!rating || rating < 1 || rating > 5) {
      errors.push('Rating must be between 1 and 5 stars');
    }

    if (!title || title.trim().length < 3) {
      errors.push('Review title must be at least 3 characters long');
    }

    if (title && title.length > 100) {
      errors.push('Review title must be less than 100 characters');
    }

    if (!comment || comment.trim().length < 10) {
      errors.push('Review comment must be at least 10 characters long');
    }

    if (comment && comment.length > 2000) {
      errors.push('Review comment must be less than 2000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generate review summary for a product
  generateReviewSummary(reviews) {
    if (!reviews.length) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedCount: 0,
        recommendationRate: 0,
        commonPros: [],
        commonCons: []
      };
    }

    const totalReviews = reviews.length;
    const verifiedCount = reviews.filter(r => r.verifiedPurchase).length;
    const recommendCount = reviews.filter(r => r.wouldRecommend).length;
    
    const ratingDistribution = reviews.reduce((dist, review) => {
      dist[review.rating] = (dist[review.rating] || 0) + 1;
      return dist;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

    // Extract common pros and cons
    const allPros = reviews.flatMap(r => r.pros || []);
    const allCons = reviews.flatMap(r => r.cons || []);
    
    const prosCount = allPros.reduce((count, pro) => {
      count[pro] = (count[pro] || 0) + 1;
      return count;
    }, {});
    
    const consCount = allCons.reduce((count, con) => {
      count[con] = (count[con] || 0) + 1;
      return count;
    }, {});

    const commonPros = Object.entries(prosCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([text, count]) => ({ text, count }));

    const commonCons = Object.entries(consCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([text, count]) => ({ text, count }));

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
      verifiedCount,
      recommendationRate: Math.round((recommendCount / totalReviews) * 100),
      commonPros,
      commonCons
    };
  }
}

// Create singleton instance
const reviewService = new ReviewService();

export default reviewService;