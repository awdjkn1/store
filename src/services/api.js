// API Service for handling HTTP requests
class ApiService {
  constructor() {
  // In development we want to use relative paths so the CRA dev server proxy works.
  // Default to empty string (same origin) unless an explicit API base is provided.
  this.baseURL = process.env.REACT_APP_API_BASE_URL !== undefined ? process.env.REACT_APP_API_BASE_URL : '';
    this.timeout = 30000; // 30 seconds
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Set authentication token
  setAuthToken(token) {
    this.defaultHeaders.Authorization = `Bearer ${token}`;
  }

  // Remove authentication token
  removeAuthToken() {
    delete this.defaultHeaders.Authorization;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
      ...otherOptions
    } = options;

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    const config = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...headers
      },
      ...otherOptions
    };

    // Add body if provided and method supports it
    if (body && !['GET', 'HEAD'].includes(method)) {
      if (body instanceof FormData) {
        // Remove Content-Type header for FormData (browser will set it)
        delete config.headers['Content-Type'];
        config.body = body;
      } else if (typeof body === 'object') {
        config.body = JSON.stringify(body);
      } else {
        config.body = body;
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    config.signal = controller.signal;

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType && contentType.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.blob();
      }

      if (!response.ok) {
        throw new ApiError(
          data.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        );
      }

      return {
        data,
        status: response.status,
        headers: response.headers,
        ok: response.ok
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        error.message || 'Network error occurred',
        0,
        error
      );
    }
  }

  // GET request
  async get(endpoint, params = {}, options = {}) {
    // Build URL safely in browser context — use window.location.origin as base when baseURL is empty
    const base = endpoint.startsWith('http') ? undefined : (this.baseURL || window.location.origin);
    const url = base ? new URL(`${base}${endpoint}`, window.location.origin) : new URL(endpoint);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    return this.request(url.toString(), {
      method: 'GET',
      ...options
    });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
      ...options
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
      ...options
    });
  }

  // PATCH request
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data,
      ...options
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    });
  }

  // Upload file
  async upload(endpoint, file, additionalData = {}, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);

    // Add additional data to form
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const config = {
      method: 'POST',
      body: formData
    };

    // Add progress tracking if supported
    if (onProgress && 'XMLHttpRequest' in window) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({ data: response, status: xhr.status });
            } catch (error) {
              resolve({ data: xhr.responseText, status: xhr.status });
            }
          } else {
            reject(new ApiError(`Upload failed: ${xhr.statusText}`, xhr.status));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new ApiError('Upload failed', 0));
        });

        xhr.open('POST', endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`);
        
        // Add auth header if available
        if (this.defaultHeaders.Authorization) {
          xhr.setRequestHeader('Authorization', this.defaultHeaders.Authorization);
        }
        
        xhr.send(formData);
      });
    }

    return this.request(endpoint, config);
  }

  // Retry mechanism
  async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === maxRetries || error.status < 500) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  // Batch requests
  async batch(requests) {
    const promises = requests.map(({ endpoint, options = {} }) => 
      this.request(endpoint, options).catch(error => ({ error }))
    );

    const results = await Promise.all(promises);
    
    return results.map((result, index) => ({
      request: requests[index],
      ...result
    }));
  }

  // Cache mechanism (simple in-memory cache)
  _cache = new Map();
  _cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getCached(endpoint, params = {}, options = {}) {
    const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;
    const cached = this._cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this._cacheTimeout) {
      return cached.data;
    }

    const response = await this.get(endpoint, params, options);
    
    this._cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    return response;
  }

  // Clear cache
  clearCache() {
    this._cache.clear();
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.get('/health', {}, { timeout: 5000 });
      return response.data;
    } catch (error) {
      throw new ApiError('Service unavailable', 503, error);
    }
  }
}

// Custom API Error class
class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  get isNetworkError() {
    return this.status === 0;
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError() {
    return this.status >= 500;
  }

  get isTimeout() {
    return this.status === 408;
  }
}

// Request interceptors
class RequestInterceptor {
  constructor() {
    this.interceptors = [];
  }

  add(interceptor) {
    this.interceptors.push(interceptor);
    return this.interceptors.length - 1; // Return index for removal
  }

  remove(index) {
    this.interceptors.splice(index, 1);
  }

  async execute(config) {
    let modifiedConfig = { ...config };
    
    for (const interceptor of this.interceptors) {
      modifiedConfig = await interceptor(modifiedConfig);
    }
    
    return modifiedConfig;
  }
}

// Response interceptors
class ResponseInterceptor {
  constructor() {
    this.interceptors = [];
  }

  add(onFulfilled, onRejected) {
    this.interceptors.push({ onFulfilled, onRejected });
    return this.interceptors.length - 1;
  }

  remove(index) {
    this.interceptors.splice(index, 1);
  }

  async execute(response, error = null) {
    for (const { onFulfilled, onRejected } of this.interceptors) {
      try {
        if (error && onRejected) {
          error = await onRejected(error);
        } else if (!error && onFulfilled) {
          response = await onFulfilled(response);
        }
      } catch (interceptorError) {
        error = interceptorError;
        response = null;
      }
    }
    
    if (error) throw error;
    return response;
  }
}

// Enhanced API service with interceptors
class EnhancedApiService extends ApiService {
  constructor() {
    super();
    this.requestInterceptors = new RequestInterceptor();
    this.responseInterceptors = new ResponseInterceptor();
  }

  async request(endpoint, options = {}) {
    try {
      // Apply request interceptors
      const config = await this.requestInterceptors.execute({ endpoint, ...options });
      
      // Make request
      const response = await super.request(config.endpoint, config);
      
      // Apply response interceptors
      return await this.responseInterceptors.execute(response);
      
    } catch (error) {
      // Apply error interceptors
      throw await this.responseInterceptors.execute(null, error);
    }
  }
}

// Create singleton instance
const apiService = new EnhancedApiService();

// Add common request interceptor for loading states
apiService.requestInterceptors.add(async (config) => {
  // You can dispatch loading actions here
  console.log(`Making ${config.method || 'GET'} request to ${config.endpoint}`);
  return config;
});

// Add common response interceptor for error handling
apiService.responseInterceptors.add(
  (response) => {
    console.log('Request successful:', response);
    return response;
  },
  (error) => {
    console.error('Request failed:', error);
    
    // Handle common errors
    if (error.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login';
    } else if (error.status === 403) {
      // Handle forbidden
      console.warn('Access forbidden');
    } else if (error.status >= 500) {
      // Handle server errors
      console.error('Server error occurred');
    }
    
    throw error;
  }
);

// Export instances and classes
export { ApiError, RequestInterceptor, ResponseInterceptor };
export default apiService;