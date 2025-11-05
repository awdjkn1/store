import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import StarRating from '../../common/StarRating';
import reviewService from '../../services/reviewService';
import { useApp } from '../../context/AppContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useApp();
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // wishlist removed per request

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };


  const cardStyle = {
    backgroundColor: 'var(--sb-surface)',
    borderRadius: '16px',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isHovered ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
    boxShadow: isHovered 
      ? '0 25px 50px rgba(0,77,64,0.14), 0 0 0 1px rgba(0,77,64,0.06)' 
      : '0 8px 25px rgba(0, 0, 0, 0.4)',
    cursor: 'pointer',
    position: 'relative',
    border: isHovered ? '1px solid rgba(0,77,64,0.18)' : '1px solid transparent'
  };

  // Use images array from backend (product_images table)
  const [imgError, setImgError] = useState(false);
  const [localRating, setLocalRating] = useState(Number(product.rating) || 0);
  const [localReviewCount, setLocalReviewCount] = useState(Number(product.reviewCount) || 0);
  
  // Keep local copies in sync if parent updates the product prop
  React.useEffect(() => {
    setLocalRating(Number(product.rating) || 0);
    setLocalReviewCount(Number(product.reviewCount) || 0);
  }, [product.rating, product.reviewCount]);
  const images = Array.isArray(product.images)
    ? product.images.filter(img => img && img !== 'NaN').map(img => String(img))
    : [];

  // Use backend-served placeholder to avoid issues where the CRA dev server
  // may not expose /placeholder.svg in certain containerized environments.
  const placeholder = 'http://localhost:5000/placeholder.svg';
  const imageUrl = images.length > 0 ? images[currentImageIndex % images.length] : placeholder;
  // eslint-disable-next-line no-unused-vars
  const imageSrc = imgError ? placeholder : encodeURI(imageUrl);

  const imageContainerStyle = {
    position: 'relative',
    width: '100%',
    height: '280px',
    overflow: 'hidden',
    backgroundColor: 'var(--sb-bg)'
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.6s ease',
    transform: isHovered ? 'scale(1.1)' : 'scale(1)'
  };

  // normalize images array for the render
  const imagesForRender = images.length > 0 ? images : [placeholder];
  const activeImageSrc = imgError ? placeholder : encodeURI(imagesForRender[currentImageIndex % imagesForRender.length]);

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: isHovered ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    opacity: isHovered ? 1 : 0,
    transition: 'opacity 0.3s ease'
  };

  const overlayButtonStyle = {
    backgroundColor: 'var(--sb-accent)',
    color: 'var(--sb-accent-on)',
    border: 'none',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0,77,64,0.25)'
  };

  // wishlist styles removed

  const contentStyle = {
    padding: '1.5rem'
  };

  const categoryStyle = {
    fontSize: '0.8rem',
    color: 'var(--sb-accent)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '0.5rem'
  };

  const nameStyle = {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--sb-text)',
    marginBottom: '0.75rem',
    lineHeight: '1.4',
    height: '2.8rem',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  };

  const priceContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem'
  };

  const currentPriceStyle = {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    color: 'var(--sb-accent)'
  };

  const originalPriceStyle = {
    fontSize: '1rem',
    color: 'var(--sb-muted)',
    textDecoration: 'line-through'
  };

  const ratingContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.25rem'
  };

  const starsStyle = {
    display: 'flex',
    gap: '2px'
  };

  const reviewCountStyle = {
    color: 'var(--sb-muted)',
    fontSize: '0.85rem',
    marginLeft: '0.25rem'
  };

  const addToCartButtonStyle = {
    backgroundColor: 'var(--sb-accent)',
    color: 'var(--sb-accent-on)',
    border: 'none',
    borderRadius: '12px',
    padding: '0.875rem 1.5rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const discountBadgeStyle = {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
  backgroundColor: 'var(--sb-accent)',
  color: 'var(--sb-accent-on)',
    padding: '0.375rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    zIndex: 2,
    boxShadow: '0 2px 8px rgba(0,77,64,0.18)'
  };

  const newBadgeStyle = {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    backgroundColor: 'var(--sb-success)',
    color: 'var(--sb-accent-on)',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    zIndex: 2
  };

  const imageIndicatorsStyle = {
    position: 'absolute',
    bottom: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '0.5rem',
    zIndex: 2
  };

  const indicatorStyle = (index) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: index === currentImageIndex ? 'var(--sb-accent)' : 'rgba(255, 255, 255, 0.5)',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  });

  // Safe price parsing: product.price may be missing; fallback to price_shipping_included (string like "50$")
  const parsePrice = (p) => {
    if (p === undefined || p === null) return NaN;
    if (typeof p === 'number') return p;
    try {
      const num = parseFloat(String(p).replace(/[^0-9.-]+/g, ''));
      return isNaN(num) ? NaN : num;
    } catch (e) {
      return NaN;
    }
  };

  const priceNum = parsePrice(product.price ?? product.price_shipping_included);
  const originalPriceNum = parsePrice(product.originalPrice);
  const displayPrice = !isNaN(priceNum) ? `$${priceNum.toFixed(2)}` : (product.price_shipping_included || product.price || '—');
  const displayOriginal = !isNaN(originalPriceNum) ? `$${originalPriceNum.toFixed(2)}` : null;

  const discount = (!isNaN(originalPriceNum) && !isNaN(priceNum) && originalPriceNum > 0)
    ? Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100)
    : 0;

  const isNew = product.isNew || false; // You can add this field to your product data

  return (
    <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
      <div 
        style={cardStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={imageContainerStyle}>
          <img
            src={activeImageSrc}
            alt={product.name}
            style={imageStyle}
            loading="lazy"
            onError={() => setImgError(true)}
          />
          
          {/* Badges */}
          {discount > 0 && (
            <div style={discountBadgeStyle}>
              -{discount}%
            </div>
          )}
          
          {isNew && (
            <div style={newBadgeStyle}>
              NEW
            </div>
          )}

          {/* Image Indicators */}
          {imagesForRender.length > 1 && (
            <div style={imageIndicatorsStyle}>
              {imagesForRender.map((_, index) => (
                <div 
                  key={index}
                  style={indicatorStyle(index)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                />
              ))}
            </div>
          )}

          {/* Hover Overlay */}
          <div style={overlayStyle}>
            <button 
              style={overlayButtonStyle}
              onClick={handleAddToCart}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.backgroundColor = 'var(--sb-accent-700)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'var(--sb-accent)';
              }}
              title="Add to Cart"
            >
              <ShoppingCart size={20} />
            </button>
            
            <Link to={`/product/${product.id}`}>
              <button 
                style={overlayButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.backgroundColor = 'var(--sb-accent-700)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = 'var(--sb-accent)';
                }}
                title="Quick View"
              >
                <Eye size={20} />
              </button>
            </Link>
            
            {/* Wishlist removed */}
          </div>
        </div>

        <div style={contentStyle}>
          <h3 style={nameStyle}>{product.name}</h3>
          
          <div style={priceContainerStyle}>
            <span style={currentPriceStyle}>{displayPrice}</span>
            {displayOriginal && originalPriceNum > priceNum && (
              <span style={originalPriceStyle}>{displayOriginal}</span>
            )}
          </div>

          <div style={ratingContainerStyle}>
            <div style={starsStyle}>
              <StarRating
                rating={localRating}
                size={16}
                interactive={true}
                onRatingChange={async (newRating) => {
                  try {
                    await reviewService.submitReview({ productId: product.id, rating: newRating });
                    // Fetch updated stats (avg & count) and update local display
                    const stats = await reviewService.getReviewStats(product.id);
                    const newAvg = Number(stats.rating) || newRating;
                    const newCount = Number(stats.reviewCount) || (localReviewCount + 1);
                    setLocalRating(newAvg);
                    setLocalReviewCount(newCount);
                    // Notify other parts of the app (Products page) so lists can update
                    try {
                      window.dispatchEvent(new CustomEvent('product:rating-updated', {
                        detail: { productId: product.id, rating: newAvg, reviewCount: newCount }
                      }));
                    } catch (e) {}
                  } catch (e) {
                    console.error('Failed to submit rating:', e);
                  }
                }}
              />
            </div>
            <span style={reviewCountStyle}>({localReviewCount ?? 0})</span>
          </div>

          <button 
            style={addToCartButtonStyle}
            onClick={handleAddToCart}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sb-accent-700)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,77,64,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sb-accent)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <ShoppingCart size={18} />
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;