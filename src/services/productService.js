import apiService from './api.js';

class ProductService {
  constructor() {
    // Use API prefix to match backend routes
    this.endpoints = {
      products: '/api/products',
      categories: '/api/categories',
      reviews: '/api/reviews',
      favorites: '/api/favorites'
    };
  }

  // Get all products with filtering and pagination
  async getProducts(params = {}) {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      rating,
      sortBy = 'created_at',
      sortOrder = 'desc',
      inStock
    } = params;

    const queryParams = {
      page,
      limit,
      sort_by: sortBy,
      sort_order: sortOrder
    };

    if (category) queryParams.category = category;
    if (search) queryParams.search = search;
    if (minPrice) queryParams.min_price = minPrice;
    if (maxPrice) queryParams.max_price = maxPrice;
    if (rating) queryParams.min_rating = rating;
    if (inStock !== undefined) queryParams.in_stock = inStock;

    try {
      const response = await apiService.get(this.endpoints.products, queryParams);
      return {
        products: response.data.products || [],
        pagination: response.data.pagination || {},
        filters: response.data.filters || {}
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  // Get single product by ID
  async getProduct(id) {
    try {
      const response = await apiService.get(`${this.endpoints.products}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw new Error('Product not found');
    }
  }

  // Get featured products
  async getFeaturedProducts(limit = 8) {
    try {
      const response = await apiService.get(`${this.endpoints.products}/featured`, { limit });
      return response.data.products || [];
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }
  }

  // Get related products
  async getRelatedProducts(productId, limit = 4) {
    try {
      const response = await apiService.get(
        `${this.endpoints.products}/${productId}/related`, 
        { limit }
      );
      return response.data.products || [];
    } catch (error) {
      console.error('Error fetching related products:', error);
      return [];
    }
  }

  // Search products
  async searchProducts(query, params = {}) {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      sortBy = 'relevance'
    } = params;

    try {
      const response = await apiService.get(`${this.endpoints.products}/search`, {
        q: query,
        page,
        limit,
        category,
        min_price: minPrice,
        max_price: maxPrice,
        sort_by: sortBy
      });

      return {
        products: response.data.products || [],
        suggestions: response.data.suggestions || [],
        totalResults: response.data.total || 0,
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      console.error('Error searching products:', error);
      return { products: [], suggestions: [], totalResults: 0 };
    }
  }

  // Get product categories
  async getCategories() {
    try {
      const response = await apiService.getCached(this.endpoints.categories);
      return response.data.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Get category by ID
  async getCategory(id) {
    try {
      const response = await apiService.get(`${this.endpoints.categories}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      throw new Error('Category not found');
    }
  }

  // Create new product (admin only)
  async createProduct(productData) {
    try {
      const response = await apiService.post(this.endpoints.products, productData);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }

  // Update product (admin only)
  async updateProduct(id, productData) {
    try {
      const response = await apiService.put(`${this.endpoints.products}/${id}`, productData);
      return response.data;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw new Error('Failed to update product');
    }
  }

  // Delete product (admin only)
  async deleteProduct(id) {
    try {
      await apiService.delete(`${this.endpoints.products}/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw new Error('Failed to delete product');
    }
  }

  // Upload product images
  async uploadProductImages(productId, images, onProgress = null) {
    try {
      const uploadPromises = images.map((image, index) => 
        apiService.upload(
          `${this.endpoints.products}/${productId}/images`,
          image,
          { order: index },
          onProgress ? (progress) => onProgress(index, progress) : null
        )
      );

      const results = await Promise.all(uploadPromises);
      return results.map(result => result.data);
    } catch (error) {
      console.error('Error uploading product images:', error);
      throw new Error('Failed to upload images');
    }
  }

  // Get product reviews
  async getProductReviews(productId, params = {}) {
    const {
      page = 1,
      limit = 10,
      rating,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params;

    try {
      const response = await apiService.get(
        `${this.endpoints.products}/${productId}/reviews`,
        {
          page,
          limit,
          rating,
          sort_by: sortBy,
          sort_order: sortOrder
        }
      );

      return {
        reviews: response.data.reviews || [],
        pagination: response.data.pagination || {},
        summary: response.data.summary || {}
      };
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      return { reviews: [], pagination: {}, summary: {} };
    }
  }

  // Add product to favorites
  async addToFavorites(productId) {
    try {
      const response = await apiService.post(this.endpoints.favorites, { product_id: productId });
      return response.data;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw new Error('Failed to add to favorites');
    }
  }

  // Remove product from favorites
  async removeFromFavorites(productId) {
    try {
      await apiService.delete(`${this.endpoints.favorites}/${productId}`);
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw new Error('Failed to remove from favorites');
    }
  }

  // Get user favorites
  async getFavorites(params = {}) {
    const { page = 1, limit = 12 } = params;

    try {
      const response = await apiService.get(this.endpoints.favorites, { page, limit });
      return {
        products: response.data.products || [],
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return { products: [], pagination: {} };
    }
  }

  // Check product availability
  async checkAvailability(productId, quantity = 1) {
    try {
      const response = await apiService.get(
        `${this.endpoints.products}/${productId}/availability`,
        { quantity }
      );
      return response.data;
    } catch (error) {
      console.error('Error checking availability:', error);
      return { available: false, stock: 0 };
    }
  }

  // Get product inventory
  async getProductInventory(productId) {
    try {
      const response = await apiService.get(`${this.endpoints.products}/${productId}/inventory`);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw new Error('Failed to fetch inventory');
    }
  }

  // Update product inventory (admin only)
  async updateInventory(productId, inventoryData) {
    try {
      const response = await apiService.put(
        `${this.endpoints.products}/${productId}/inventory`,
        inventoryData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw new Error('Failed to update inventory');
    }
  }

  // Get product analytics (admin only)
  async getProductAnalytics(productId, dateRange = {}) {
    const { startDate, endDate } = dateRange;
    
    try {
      const response = await apiService.get(
        `${this.endpoints.products}/${productId}/analytics`,
        {
          start_date: startDate,
          end_date: endDate
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching product analytics:', error);
      return {};
    }
  }

  // Get price history
  async getPriceHistory(productId, days = 30) {
    try {
      const response = await apiService.get(
        `${this.endpoints.products}/${productId}/price-history`,
        { days }
      );
      return response.data.history || [];
    } catch (error) {
      console.error('Error fetching price history:', error);
      return [];
    }
  }

  // Compare products
  async compareProducts(productIds) {
    try {
      const response = await apiService.post(`${this.endpoints.products}/compare`, {
        product_ids: productIds
      });
      return response.data.products || [];
    } catch (error) {
      console.error('Error comparing products:', error);
      throw new Error('Failed to compare products');
    }
  }

  // Get product recommendations
  async getRecommendations(params = {}) {
    const {
      userId,
      productId,
      category,
      limit = 6,
      type = 'similar'
    } = params;

    try {
      const response = await apiService.get(`${this.endpoints.products}/recommendations`, {
        user_id: userId,
        product_id: productId,
        category,
        limit,
        type
      });
      return response.data.products || [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }

  // Batch operations
  async batchUpdateProducts(updates) {
    try {
      const response = await apiService.post(`${this.endpoints.products}/batch-update`, {
        updates
      });
      return response.data;
    } catch (error) {
      console.error('Error in batch update:', error);
      throw new Error('Failed to update products');
    }
  }

  // Import products from CSV/Excel
  async importProducts(file, options = {}) {
    try {
      const response = await apiService.upload(
        `${this.endpoints.products}/import`,
        file,
        options,
        (progress) => {
          console.log(`Import progress: ${progress}%`);
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error importing products:', error);
      throw new Error('Failed to import products');
    }
  }

  // Export products to CSV/Excel
  async exportProducts(filters = {}, format = 'csv') {
    try {
      const response = await apiService.get(`${this.endpoints.products}/export`, {
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
      link.download = `products_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error exporting products:', error);
      throw new Error('Failed to export products');
    }
  }
}

// Create singleton instance
const productService = new ProductService();

export default productService;