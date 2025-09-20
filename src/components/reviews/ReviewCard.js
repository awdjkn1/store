import React from 'react';
import StarRating from '../common/StarRating';

const ReviewCard = ({ review }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div style={{
      backgroundColor: '#2d2d2d',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px',
      border: '1px solid #404040',
      position: 'relative'
    }}>
      {/* Verified Badge */}
      {review.verified && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          backgroundColor: '#ff6b35',
          color: '#fff',
          fontSize: '12px',
          padding: '4px 8px',
          borderRadius: '12px',
          fontWeight: '600'
        }}>
          Verified Purchase
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        {/* Avatar */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#ff6b35',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '16px',
          marginRight: '12px'
        }}>
          {review.customerName.charAt(0).toUpperCase()}
        </div>

        <div>
          <h4 style={{
            color: '#fff',
            margin: '0',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            {review.customerName}
          </h4>
          <p style={{
            color: '#ccc',
            margin: '2px 0 0 0',
            fontSize: '14px'
          }}>
            {formatDate(review.date)}
          </p>
        </div>
      </div>

      {/* Rating */}
      <div style={{ marginBottom: '12px' }}>
        <StarRating rating={review.rating} size={16} />
      </div>

      {/* Review Title */}
      {review.title && (
        <h5 style={{
          color: '#fff',
          margin: '0 0 8px 0',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          {review.title}
        </h5>
      )}

      {/* Review Text */}
      <p style={{
        color: '#e0e0e0',
        lineHeight: '1.6',
        margin: '0 0 12px 0',
        fontSize: '14px'
      }}>
        {review.comment}
      </p>

      {/* Review Images */}
      {review.images && review.images.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}>
          {review.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Review image ${index + 1}`}
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '1px solid #404040',
                cursor: 'pointer'
              }}
            />
          ))}
        </div>
      )}

      {/* Helpful Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '12px',
        borderTop: '1px solid #404040'
      }}>
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <button style={{
            background: 'none',
            border: 'none',
            color: '#ccc',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'all 0.3s ease'
          }}>
            👍 Helpful ({review.helpfulCount || 0})
          </button>

          <button style={{
            background: 'none',
            border: 'none',
            color: '#ccc',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'all 0.3s ease'
          }}>
            Report
          </button>
        </div>

        {/* Product Variant Info */}
        {review.variant && (
          <span style={{
            fontSize: '12px',
            color: '#999',
            fontStyle: 'italic'
          }}>
            Size: {review.variant}
          </span>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;