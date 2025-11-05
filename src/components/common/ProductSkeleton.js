import React from 'react';

const ProductSkeleton = ({ style = {} }) => {
  const cardStyle = {
    backgroundColor: 'var(--sb-surface)',
    borderRadius: '12px',
    overflow: 'hidden',
    padding: '0',
    ...style
  };

  const imgStyle = {
    width: '100%',
    height: '200px',
    background: 'linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.06) 37%, rgba(0,0,0,0.04) 63%)',
    backgroundSize: '400% 100%',
    animation: 'skeleton-loading 1.2s linear infinite'
  };

  const contentStyle = { padding: '1rem' };
  const line = (w = '100%') => ({ height: '12px', width: w, background: 'var(--sb-border)', borderRadius: 6, marginBottom: '0.5rem' });

  return (
    <div style={cardStyle} className="product-skeleton">
      <div style={imgStyle} />
      <div style={contentStyle}>
        <div style={line('60%')} />
        <div style={line('40%')} />
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <div style={{ ...line('30%'), height: '10px' }} />
          <div style={{ ...line('20%'), height: '10px' }} />
        </div>
      </div>
    </div>
  );
};

export default ProductSkeleton;

/* Local skeleton animation */
/* Add global keyframes in index.css to avoid duplication */
