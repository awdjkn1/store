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
      backgroundColor: 'var(--sb-surface)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      border: '1px solid var(--sb-border)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--sb-text)' }}>{review.username || review.user || 'Anonymous'}</div>
          <div style={{ color: 'var(--sb-muted)', fontSize: '12px' }}>{review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</div>
        </div>
        <div>
          <StarRating rating={review.rating || 0} size={18} />
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;