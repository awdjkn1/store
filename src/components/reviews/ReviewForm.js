import React, { useState } from 'react';
import StarRating from '../common/StarRating';

const ReviewForm = ({ productId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    comment: '',
    customerName: '',
    customerEmail: '',
    recommend: true,
    images: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 5;
    
    if (files.length > maxFiles) {
      setErrors(prev => ({ ...prev, images: `Maximum ${maxFiles} images allowed` }));
      return;
    }

    // Create preview URLs (in a real app, you'd upload to a server)
    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(imageUrls => {
      setFormData(prev => ({ ...prev, images: imageUrls }));
      setErrors(prev => ({ ...prev, images: '' }));
    });
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Please enter a review title';
    }
    if (!formData.comment.trim()) {
      newErrors.comment = 'Please enter your review';
    }
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Please enter your name';
    }
    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'Please enter your email';
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const reviewData = {
        ...formData,
        productId,
        date: new Date().toISOString(),
        verified: false, // Would be set based on purchase history
        helpfulCount: 0
      };

      await onSubmit(reviewData);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#2d2d2d',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #404040',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h3 style={{
        color: '#fff',
        marginBottom: '20px',
        fontSize: '20px',
        fontWeight: '600'
      }}>
        Write a Review
      </h3>

      <form onSubmit={handleSubmit}>
        {/* Rating Section */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            color: '#fff',
            marginBottom: '8px',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            Overall Rating *
          </label>
          <StarRating 
            rating={formData.rating} 
            onRatingChange={handleRatingChange}
            size={24}
            interactive={true}
          />
          {errors.rating && (
            <span style={{
              color: '#ff4444',
              fontSize: '14px',
              marginTop: '4px',
              display: 'block'
            }}>
              {errors.rating}
            </span>
          )}
        </div>

        {/* Review Title */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            color: '#fff',
            marginBottom: '8px',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            Review Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Summarize your experience"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${errors.title ? '#ff4444' : '#404040'}`,
              backgroundColor: '#1a1a1a',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
            onBlur={(e) => e.target.style.borderColor = errors.title ? '#ff4444' : '#404040'}
          />
          {errors.title && (
            <span style={{
              color: '#ff4444',
              fontSize: '14px',
              marginTop: '4px',
              display: 'block'
            }}>
              {errors.title}
            </span>
          )}
        </div>

        {/* Review Comment */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            color: '#fff',
            marginBottom: '8px',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            Your Review *
          </label>
          <textarea
            name="comment"
            value={formData.comment}
            onChange={handleInputChange}
            placeholder="Share your thoughts about this product..."
            rows={5}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${errors.comment ? '#ff4444' : '#404040'}`,
              backgroundColor: '#1a1a1a',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
              minHeight: '120px',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
            onBlur={(e) => e.target.style.borderColor = errors.comment ? '#ff4444' : '#404040'}
          />
          {errors.comment && (
            <span style={{
              color: '#ff4444',
              fontSize: '14px',
              marginTop: '4px',
              display: 'block'
            }}>
              {errors.comment}
            </span>
          )}
        </div>

        {/* Customer Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            color: '#fff',
            marginBottom: '8px',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            Your Name *
          </label>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            placeholder="Enter your name"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${errors.customerName ? '#ff4444' : '#404040'}`,
              backgroundColor: '#1a1a1a',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
            onBlur={(e) => e.target.style.borderColor = errors.customerName ? '#ff4444' : '#404040'}
          />
          {errors.customerName && (
            <span style={{
              color: '#ff4444',
              fontSize: '14px',
              marginTop: '4px',
              display: 'block'
            }}>
              {errors.customerName}
            </span>
          )}
        </div>

        {/* Customer Email */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            color: '#fff',
            marginBottom: '8px',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            Your Email *
          </label>
          <input
            type="email"
            name="customerEmail"
            value={formData.customerEmail}
            onChange={handleInputChange}
            placeholder="Enter your email"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${errors.customerEmail ? '#ff4444' : '#404040'}`,
              backgroundColor: '#1a1a1a',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
            onBlur={(e) => e.target.style.borderColor = errors.customerEmail ? '#ff4444' : '#404040'}
          />
          {errors.customerEmail && (
            <span style={{
              color: '#ff4444',
              fontSize: '14px',
              marginTop: '4px',
              display: 'block'
            }}>
              {errors.customerEmail}
            </span>
          )}
        </div>

        {/* Image Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            color: '#fff',
            marginBottom: '8px',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            Add Photos (Optional)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${errors.images ? '#ff4444' : '#404040'}`,
              backgroundColor: '#1a1a1a',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          {errors.images && (
            <span style={{
              color: '#ff4444',
              fontSize: '14px',
              marginTop: '4px',
              display: 'block'
            }}>
              {errors.images}
            </span>
          )}
          
          {/* Image Previews */}
          {formData.images.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '12px',
              flexWrap: 'wrap'
            }}>
              {formData.images.map((image, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <img
                    src={image}
                    alt={`Preview ${index + 1}`}
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #404040'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      backgroundColor: '#ff4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendation Checkbox */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              name="recommend"
              checked={formData.recommend}
              onChange={handleInputChange}
              style={{
                marginRight: '8px',
                accentColor: '#ff6b35'
              }}
            />
            I would recommend this product to others
          </label>
        </div>

        {/* Form Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid #404040',
              backgroundColor: 'transparent',
              color: '#ccc',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isSubmitting ? '#cc5429' : '#ff6b35',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;