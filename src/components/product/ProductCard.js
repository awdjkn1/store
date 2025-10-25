import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, Heart, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useApp();
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const cardStyle = {
    backgroundColor: '#2d2d2d',
    borderRadius: '16px',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isHovered ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
    boxShadow: isHovered 
      ? '0 25px 50px rgba(255, 107, 53, 0.25), 0 0 0 1px rgba(255, 107, 53, 0.1)' 
      : '0 8px 25px rgba(0, 0, 0, 0.4)',
    cursor: 'pointer',
    position: 'relative',
    border: isHovered ? '1px solid rgba(255, 107, 53, 0.3)' : '1px solid transparent'
  };

  // Get the first valid image or use a placeholder
  const imageFields = [product.pictures, product.pictures_1, product.pictures_2, product.pictures_3, product.pictures_4];
  const [imgError, setImgError] = useState(false);

  // Build images array and pick first valid one
  const images = imageFields
    .filter(img => img && img !== 'NaN')
    .map(img => String(img));

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
    backgroundColor: '#1a1a1a'
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
    backgroundColor: '#ff6b35',
    color: '#ffffff',
    border: 'none',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(255, 107, 53, 0.4)'
  };

  const wishlistButtonStyle = {
    ...overlayButtonStyle,
    backgroundColor: isWishlisted ? '#ff6b35' : 'rgba(255, 255, 255, 0.2)',
    color: isWishlisted ? '#ffffff' : '#ffffff'
  };

  const contentStyle = {
    padding: '1.5rem'
  };

  const categoryStyle = {
    fontSize: '0.8rem',
    color: '#ff6b35',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '0.5rem'
  };

  const nameStyle = {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#ffffff',
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
    color: '#ff6b35'
  };

  const originalPriceStyle = {
    fontSize: '1rem',
    color: '#999',
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
    color: '#999',
    fontSize: '0.85rem',
    marginLeft: '0.25rem'
  };

  const addToCartButtonStyle = {
    backgroundColor: '#ff6b35',
    color: '#ffffff',
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
    backgroundColor: '#ff6b35',
    color: '#ffffff',
    padding: '0.375rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    zIndex: 2,
    boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)'
  };

  const newBadgeStyle = {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    backgroundColor: '#28a745',
    color: '#ffffff',
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
    backgroundColor: index === currentImageIndex ? '#ff6b35' : 'rgba(255, 255, 255, 0.5)',
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
                e.target.style.transform = 'scale(1.1)';
                e.target.style.backgroundColor = '#e55a2b';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.backgroundColor = '#ff6b35';
              }}
              title="Add to Cart"
            >
              <ShoppingCart size={20} />
            </button>
            
            <Link to={`/product/${product.id}`}>
              <button 
                style={overlayButtonStyle}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.1)';
                  e.target.style.backgroundColor = '#e55a2b';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.backgroundColor = '#ff6b35';
                }}
                title="Quick View"
              >
                <Eye size={20} />
              </button>
            </Link>
            
            <button 
              style={wishlistButtonStyle}
              onClick={handleWishlist}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
              title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        <div style={contentStyle}>
          <div style={categoryStyle}>{product.category}</div>
          
          <h3 style={nameStyle}>{product.name}</h3>
          
          <div style={priceContainerStyle}>
            <span style={currentPriceStyle}>{displayPrice}</span>
            {displayOriginal && originalPriceNum > priceNum && (
              <span style={originalPriceStyle}>{displayOriginal}</span>
            )}
          </div>

          <div style={ratingContainerStyle}>
            <div style={starsStyle}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  style={{
                    fill: star <= Math.floor(Number(product.rating) || 0) ? '#ff6b35' : 'none',
                    color: star <= Math.floor(Number(product.rating) || 0) ? '#ff6b35' : '#666'
                  }}
                />
              ))}
            </div>
            <span style={reviewCountStyle}>({product.reviewCount ?? 0})</span>
          </div>

          <button 
            style={addToCartButtonStyle}
            onClick={handleAddToCart}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e55a2b';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(255, 107, 53, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#ff6b35';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
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