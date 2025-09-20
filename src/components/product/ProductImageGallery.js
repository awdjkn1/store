import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, X, Maximize2 } from 'lucide-react';

const ProductImageGallery = ({ images = [], productName = "Product" }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (images.length > 0) {
      // Preload images
      const imagePromises = images.map(src => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = src;
        });
      });

      Promise.all(imagePromises)
        .then(() => setIsLoading(false))
        .catch(() => setIsLoading(false));
    }
  }, [images]);

  const handlePrevious = () => {
    setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index) => {
    setCurrentImage(index);
  };

  const handleMouseMove = (e) => {
    if (!isZoomed) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomPosition({ x, y });
  };

  const handleKeyDown = (e) => {
    if (showLightbox) {
      switch (e.key) {
        case 'Escape':
          setShowLightbox(false);
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox]);

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  };

  const mainImageContainerStyle = {
    position: 'relative',
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    overflow: 'hidden',
    aspectRatio: '1',
    border: '1px solid #444'
  };

  const mainImageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    cursor: isZoomed ? 'zoom-out' : 'zoom-in',
    transition: 'transform 0.3s ease',
    transform: isZoomed ? 'scale(2)' : 'scale(1)',
    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
  };

  const loadingOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2d2d2d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666'
  };

  const navigationButtonStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    opacity: 0,
    zIndex: 2
  };

  const prevButtonStyle = {
    ...navigationButtonStyle,
    left: '1rem'
  };

  const nextButtonStyle = {
    ...navigationButtonStyle,
    right: '1rem'
  };

  const controlsStyle = {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    display: 'flex',
    gap: '0.5rem',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    zIndex: 2
  };

  const controlButtonStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const thumbnailsContainerStyle = {
    display: 'flex',
    gap: '0.75rem',
    overflowX: 'auto',
    paddingBottom: '0.5rem'
  };

  const thumbnailStyle = (index) => ({
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: index === currentImage ? '3px solid #ff6b35' : '3px solid transparent',
    opacity: index === currentImage ? 1 : 0.7,
    flexShrink: 0
  });

  const imageCounterStyle = {
    position: 'absolute',
    bottom: '1rem',
    right: '1rem',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: '500'
  };

  const lightboxStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    display: showLightbox ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)'
  };

  const lightboxImageStyle = {
    maxWidth: '90vw',
    maxHeight: '90vh',
    objectFit: 'contain',
    borderRadius: '8px'
  };

  const lightboxControlsStyle = {
    position: 'absolute',
    top: '2rem',
    right: '2rem',
    display: 'flex',
    gap: '1rem'
  };

  const lightboxNavStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)'
  };

  const lightboxPrevStyle = {
    ...lightboxNavStyle,
    left: '2rem'
  };

  const lightboxNextStyle = {
    ...lightboxNavStyle,
    right: '2rem'
  };

  const lightboxThumbnailsStyle = {
    position: 'absolute',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '0.5rem',
    maxWidth: '90vw',
    overflowX: 'auto',
    padding: '1rem',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)'
  };

  const lightboxThumbnailStyle = (index) => ({
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: index === currentImage ? '2px solid #ff6b35' : '2px solid transparent',
    opacity: index === currentImage ? 1 : 0.6,
    flexShrink: 0
  });

  if (!images || images.length === 0) {
    return (
      <div style={mainImageContainerStyle}>
        <div style={loadingOverlayStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
            <p>No images available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={containerStyle}>
        {/* Main Image */}
        <div 
          style={mainImageContainerStyle}
          onMouseEnter={(e) => {
            const navButtons = e.currentTarget.querySelectorAll('[data-nav-button]');
            const controls = e.currentTarget.querySelector('[data-controls]');
            navButtons.forEach(btn => btn.style.opacity = '1');
            if (controls) controls.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            const navButtons = e.currentTarget.querySelectorAll('[data-nav-button]');
            const controls = e.currentTarget.querySelector('[data-controls]');
            navButtons.forEach(btn => btn.style.opacity = '0');
            if (controls) controls.style.opacity = '0';
            setIsZoomed(false);
          }}
        >
          {isLoading && (
            <div style={loadingOverlayStyle}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #333',
                borderTop: '3px solid #ff6b35',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          )}
          
          <img
            src={images[currentImage]}
            alt={`${productName} - Image ${currentImage + 1}`}
            style={mainImageStyle}
            onClick={() => setIsZoomed(!isZoomed)}
            onMouseMove={handleMouseMove}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/600x600/2d2d2d/cccccc?text=Image+Not+Found';
            }}
          />

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                data-nav-button
                style={prevButtonStyle}
                onClick={handlePrevious}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                  e.target.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                  e.target.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <ChevronLeft size={24} />
              </button>

              <button
                data-nav-button
                style={nextButtonStyle}
                onClick={handleNext}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                  e.target.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                  e.target.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Controls */}
          <div data-controls style={controlsStyle}>
            <button
              style={controlButtonStyle}
              onClick={() => setIsZoomed(!isZoomed)}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
              title={isZoomed ? 'Zoom Out' : 'Zoom In'}
            >
              <ZoomIn size={18} />
            </button>

            <button
              style={controlButtonStyle}
              onClick={() => setShowLightbox(true)}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
              title="Full Screen"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          {/* Image Counter */}
          {images.length > 1 && (
            <div style={imageCounterStyle}>
              {currentImage + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div style={thumbnailsContainerStyle}>
            {images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${productName} - Thumbnail ${index + 1}`}
                style={thumbnailStyle(index)}
                onClick={() => handleThumbnailClick(index)}
                onMouseEnter={(e) => {
                  if (index !== currentImage) {
                    e.target.style.opacity = '0.9';
                    e.target.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (index !== currentImage) {
                    e.target.style.opacity = '0.7';
                    e.target.style.transform = 'scale(1)';
                  }
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/80x80/2d2d2d/cccccc?text=N/A';
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <div 
        style={lightboxStyle}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowLightbox(false);
          }
        }}
      >
        <img
          src={images[currentImage]}
          alt={`${productName} - Full size ${currentImage + 1}`}
          style={lightboxImageStyle}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/800x800/2d2d2d/cccccc?text=Image+Not+Found';
          }}
        />

        {/* Lightbox Controls */}
        <div style={lightboxControlsStyle}>
          <button
            style={{
              ...controlButtonStyle,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }}
            onClick={() => setShowLightbox(false)}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Lightbox Navigation */}
        {images.length > 1 && (
          <>
            <button
              style={lightboxPrevStyle}
              onClick={handlePrevious}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            >
              <ChevronLeft size={32} />
            </button>

            <button
              style={lightboxNextStyle}
              onClick={handleNext}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}

        {/* Lightbox Thumbnails */}
        {images.length > 1 && (
          <div style={lightboxThumbnailsStyle}>
            {images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${productName} - Lightbox thumbnail ${index + 1}`}
                style={lightboxThumbnailStyle(index)}
                onClick={() => setCurrentImage(index)}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/60x60/2d2d2d/cccccc?text=N/A';
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ProductImageGallery;