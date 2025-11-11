/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:08.492Z */
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
      borderRadius: '0.75rem',
      padding: '1rem',
      marginBottom: '0.75rem',
      border: '0.0625rem solid var(--sb-border)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--sb-text)' }}>{review.username || review.user || 'Anonymous'}</div>
          <div style={{ color: 'var(--sb-muted)', fontSize: '0.75rem' }}>{review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</div>
        </div>
        <div>
          <StarRating rating={review.rating || 0} size={18} />
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;