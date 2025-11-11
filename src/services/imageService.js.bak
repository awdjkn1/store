// Image Service for handling high-quality image operations
class ImageService {
  constructor() {
    this.supportedFormats = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.compressionQuality = 0.85;
  }

  // Check if WebP is supported
  isWebPSupported() {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  // Generate responsive image sizes
  generateImageSizes(baseUrl, sizes = [150, 300, 600, 1200]) {
    const imageUrls = {};
    
    sizes.forEach(size => {
      imageUrls[`${size}w`] = `${baseUrl}?w=${size}&q=${this.compressionQuality * 100}`;
    });
    
    return imageUrls;
  }

  // Create optimized image URL
  optimizeImageUrl(url, options = {}) {
    const {
      width,
      height,
      quality = 85,
      format = 'auto',
      fit = 'cover'
    } = options;

    const params = new URLSearchParams();
    
    if (width) params.append('w', width);
    if (height) params.append('h', height);
    if (quality) params.append('q', quality);
    if (format !== 'auto') params.append('f', format);
    if (fit !== 'cover') params.append('fit', fit);

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }

  // Validate image file
  validateImage(file) {
    const errors = [];

    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!this.supportedFormats.includes(fileExtension)) {
      errors.push(`Unsupported format. Supported formats: ${this.supportedFormats.join(', ')}`);
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check if it's actually an image
    if (!file.type.startsWith('image/')) {
      errors.push('File is not a valid image');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Compress image
  compressImage(file, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = this.compressionQuality,
        outputFormat = 'image/jpeg'
      } = options;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: outputFormat }));
            } else {
              reject(new Error('Compression failed'));
            }
          },
          outputFormat,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Create image thumbnail
  createThumbnail(file, size = 150) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const { width, height } = img;
        const aspectRatio = width / height;
        
        let thumbWidth, thumbHeight;
        
        if (aspectRatio > 1) {
          thumbWidth = size;
          thumbHeight = size / aspectRatio;
        } else {
          thumbWidth = size * aspectRatio;
          thumbHeight = size;
        }

        canvas.width = size;
        canvas.height = size;

        // Fill background
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, size, size);

        // Center image
        const x = (size - thumbWidth) / 2;
        const y = (size - thumbHeight) / 2;
        
        ctx.drawImage(img, x, y, thumbWidth, thumbHeight);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], `thumb_${file.name}`, { type: 'image/jpeg' }));
            } else {
              reject(new Error('Thumbnail creation failed'));
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Upload image with progress
  async uploadImage(file, options = {}) {
    const {
      compress = true,
      createThumbnail = true,
      endpoint = '/api/upload',
      onProgress = () => {}
    } = options;

    try {
      // Validate image
      const validation = this.validateImage(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      let imageFile = file;
      let thumbnailFile = null;

      // Compress if needed
      if (compress) {
        onProgress({ stage: 'compressing', progress: 25 });
        imageFile = await this.compressImage(file);
      }

      // Create thumbnail if needed
      if (createThumbnail) {
        onProgress({ stage: 'thumbnail', progress: 50 });
        thumbnailFile = await this.createThumbnail(imageFile);
      }

      // Upload
      onProgress({ stage: 'uploading', progress: 75 });
      
      const formData = new FormData();
      formData.append('image', imageFile);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      onProgress({ stage: 'complete', progress: 100 });
      
      return result;

    } catch (error) {
      onProgress({ stage: 'error', progress: 0, error: error.message });
      throw error;
    }
  }

  // Batch upload images
  async uploadImages(files, options = {}) {
    const results = [];
    const {
      onProgress = () => {},
      maxConcurrent = 3
    } = options;

    const uploadPromises = [];
    
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (file, index) => {
        const globalIndex = i + index;
        
        try {
          const result = await this.uploadImage(file, {
            ...options,
            onProgress: (progress) => {
              onProgress({
                fileIndex: globalIndex,
                fileName: file.name,
                ...progress
              });
            }
          });
          
          results[globalIndex] = { success: true, data: result };
          return result;
          
        } catch (error) {
          results[globalIndex] = { success: false, error: error.message };
          throw error;
        }
      });

      await Promise.allSettled(batchPromises);
    }

    return results;
  }

  // Generate srcset for responsive images
  generateSrcSet(baseUrl, sizes = [300, 600, 900, 1200]) {
    return sizes
      .map(size => `${this.optimizeImageUrl(baseUrl, { width: size })} ${size}w`)
      .join(', ');
  }

  // Lazy load image with intersection observer
  lazyLoadImage(imgElement, src, options = {}) {
    const {
      rootMargin = '50px',
      threshold = 0.1,
      placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+'
    } = options;

    // Set placeholder
    imgElement.src = placeholder;

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin,
        threshold
      });

      imgElement.classList.add('lazy');
      imageObserver.observe(imgElement);
    } else {
      // Fallback for older browsers
      imgElement.src = src;
    }
  }

  // Create image zoom functionality
  createImageZoom(containerElement, imageUrl, options = {}) {
    const {
      zoomFactor = 2,
      cursor = 'zoom-in'
    } = options;

    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.cursor = cursor;
    img.style.transition = 'transform 0.3s ease';

    let isZoomed = false;

    img.addEventListener('click', (e) => {
      if (!isZoomed) {
        const rect = img.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        img.style.transform = `scale(${zoomFactor})`;
        img.style.transformOrigin = `${x * 100}% ${y * 100}%`;
        img.style.cursor = 'zoom-out';
        isZoomed = true;
      } else {
        img.style.transform = 'scale(1)';
        img.style.transformOrigin = 'center';
        img.style.cursor = cursor;
        isZoomed = false;
      }
    });

    containerElement.appendChild(img);
    return img;
  }

  // Get image metadata
  getImageMetadata(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const metadata = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
          size: file.size,
          type: file.type,
          name: file.name,
          lastModified: file.lastModified
        };
        
        URL.revokeObjectURL(img.src);
        resolve(metadata);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image metadata'));
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// Create singleton instance
const imageService = new ImageService();

// Export service methods
export const {
  validateImage,
  compressImage,
  createThumbnail,
  uploadImage,
  uploadImages,
  optimizeImageUrl,
  generateImageSizes,
  generateSrcSet,
  lazyLoadImage,
  createImageZoom,
  getImageMetadata,
  isWebPSupported
} = imageService;

export default imageService;