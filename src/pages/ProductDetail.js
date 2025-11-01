import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import UserAuthModal from '../components/common/UserAuthModal';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import ProductImageGallery from '../components/product/ProductImageGallery';
import StarRating from '../components/common/StarRating';
import ReviewList from '../components/reviews/ReviewList';
import CartDrawer from '../components/cart/CartDrawer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import productService from '../services/productService';
import { 
  ShoppingCart, 
  Share2, 
  Truck, 
  Shield, 
  RotateCcw, 
  Plus, 
  Minus,
  Check,
  ArrowLeft
} from 'lucide-react';

const ProductDetail = () => {
  // Helper to get images array from product (prefer normalized images array)
  // Use images from product_images table
  const [productImages, setProductImages] = useState([]);
  const getProductImages = () => productImages;
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, showCart, toggleCart } = useApp();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  // wishlist removed per request
  // keep a local placeholder so styles referencing it don't break the build
  const isWishlisted = false;
  const [activeTab, setActiveTab] = useState('description');
  const [addedToCart, setAddedToCart] = useState(false);

  // Fetch product from API

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const data = await productService.getProduct(id);
        setProduct(data.product || data);
        setSelectedSize(data.product?.sizes?.[0] || data.sizes?.[0] || '');
        setSelectedColor(data.product?.colors?.[0] || data.colors?.[0] || '');
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  useEffect(() => {
    // Fetch images from the new endpoint using product name
    const fetchImages = async () => {
      if (!product?.name) return;
      try {
        const response = await fetch(`/api/products/${encodeURIComponent(product.name)}/images/all`);
        const data = await response.json();
        setProductImages(data.images || []);
      } catch (error) {
        console.error('Error fetching product images:', error);
        setProductImages([]);
      }
    };
    fetchImages();
  }, [product?.name]);

  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const handleAddToCart = async () => {
    if (!product) return;
    try {
      // Try to persist to server-side cart if user is authenticated. If the request
      // is unauthorized or fails, fall back to local in-memory cart so guests can add items.
      try {
        await axios.post('/api/cart', {
          product_id: product.id,
          quantity,
          shipping_address: '',
        }, { withCredentials: true });
      } catch (err) {
        if (!err.response || err.response.status !== 401) {
          // Only log non-auth errors; auth errors are expected for guests and will fall back.
          console.warn('Could not persist cart to server, using local cart instead:', err.message || err);
        }
      }

      addToCart({
        id: product.id,
        name: product.name,
        image: productImages[0] || (product.pictures || product.pictures_1 || ''),
        price_shipping_included: product.price_shipping_included || product.price,
        quantity
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      console.error('Error adding to cart (fallback):', err);
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stockCount || 10)) {
      setQuantity(newQuantity);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const pageStyle = {
    backgroundColor: 'var(--sb-bg)',
    minHeight: '100vh',
    color: 'var(--sb-text)',
    paddingTop: '2rem'
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem'
  };

  const breadcrumbStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '2rem',
    fontSize: '0.9rem',
    color: 'var(--sb-muted)'
  };

  const breadcrumbLinkStyle = {
    color: 'var(--sb-accent)',
    textDecoration: 'none',
    cursor: 'pointer'
  };

  const backButtonStyle = {
    backgroundColor: 'transparent',
    border: '1px solid var(--sb-border)',
    color: 'var(--sb-muted)',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '2rem',
    transition: 'all 0.3s ease'
  };

  const productLayoutStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4rem',
    marginBottom: '4rem'
  };

  const productInfoStyle = {
    padding: '1rem 0'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: 'var(--sb-text)',
    lineHeight: '1.2'
  };

  const brandStyle = {
  // Removed unused variables: originalPriceStyle, discountBadgeStyle, discount
    fontWeight: '600',
    color: 'var(--sb-text)',
    marginBottom: '0.75rem',
    display: 'block'
  };

  const optionButtonsStyle = {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap'
  };

  const optionButtonStyle = (isSelected) => ({
    backgroundColor: isSelected ? 'var(--sb-accent)' : 'transparent',
    color: isSelected ? 'var(--sb-accent-on)' : 'var(--sb-muted)',
    border: `1px solid ${isSelected ? 'var(--sb-accent)' : 'var(--sb-border)'}`,
    borderRadius: '8px',
    padding: '0.75rem 1.25rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '500'
  });

  const quantityControlStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem'
  };

  const quantityButtonStyle = {
    backgroundColor: 'var(--sb-surface)',
    color: 'var(--sb-text)',
    border: '1px solid var(--sb-border)',
    borderRadius: '8px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const quantityDisplayStyle = {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: 'var(--sb-text)',
    minWidth: '60px',
    textAlign: 'center',
    padding: '0.5rem',
    backgroundColor: 'var(--sb-surface)',
    borderRadius: '8px'
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem'
  };

  const addToCartButtonStyle = {
    backgroundColor: addedToCart ? 'var(--sb-success)' : 'var(--sb-accent)',
    color: 'var(--sb-text)',
    border: 'none',
    borderRadius: '12px',
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const wishlistButtonStyle = {
    backgroundColor: isWishlisted ? 'var(--sb-accent)' : 'transparent',
    color: isWishlisted ? 'var(--sb-accent-on)' : 'var(--sb-accent)',
    border: '2px solid var(--sb-accent)',
    borderRadius: '12px',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const shareButtonStyle = {
    backgroundColor: 'transparent',
    color: 'var(--sb-muted)',
    border: '1px solid var(--sb-border)',
    borderRadius: '12px',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };


  const featureGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '1rem'
  };

  const featureItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--sb-muted)'
  };

  const guaranteesStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem'
  };

  const guaranteeItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    backgroundColor: 'var(--sb-surface)',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid var(--sb-border)'
  };

  const guaranteeIconStyle = {
    backgroundColor: 'var(--sb-accent)',
    color: 'var(--sb-accent-on)',
    padding: '0.75rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const tabsStyle = {
    display: 'flex',
    borderBottom: '1px solid var(--sb-border)',
    marginBottom: '2rem'
  };

  const tabStyle = (isActive) => ({
    backgroundColor: 'transparent',
    color: isActive ? 'var(--sb-accent)' : 'var(--sb-muted)',
    border: 'none',
    borderBottom: isActive ? '2px solid var(--sb-accent)' : '2px solid transparent',
    padding: '1rem 2rem',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  });

  const tabContentStyle = {
    backgroundColor: 'var(--sb-surface)',
    borderRadius: '12px',
    padding: '2rem'
  };

  const ratingContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  };

  const priceContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
  };
  const currentPriceStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: 'var(--sb-accent)',
    marginRight: '1rem',
  };
  const stockInfoStyle = {
    fontSize: '1rem',
    color: 'var(--sb-muted)',
    marginBottom: '1rem',
  };
  const optionsStyle = {
    margin: '1.5rem 0',
  };
  const optionGroupStyle = {
    marginBottom: '1rem',
  };
  const optionLabelStyle = {
    fontWeight: '600',
    marginRight: '0.75rem',
    color: 'var(--sb-muted)',
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <LoadingSpinner fullScreen text="Loading product details..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h2>Product not found</h2>
            <button
              onClick={() => navigate('/products')}
              style={backButtonStyle}
            >
              <ArrowLeft size={20} style={{ color: 'currentColor' }} />
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Removed unused discount variable

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Breadcrumb */}
        <nav style={breadcrumbStyle}>
          <span 
            onClick={() => navigate('/')}
            style={breadcrumbLinkStyle}
          >
            Home
          </span>
          <span>/</span>
          <span 
            onClick={() => navigate('/products')}
            style={breadcrumbLinkStyle}
          >
            Products
          </span>
          <span>/</span>
          {/* categories removed from breadcrumb per request */}
          <span>{product.name}</span>
        </nav>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          style={backButtonStyle}
          onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sb-surface)';
              e.currentTarget.style.borderColor = 'var(--sb-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--sb-border)';
            }}
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Product Layout */}
        <div style={productLayoutStyle}>
          {/* Product Images */}
          <div>
            <ProductImageGallery images={getProductImages()} productName={product?.name} />
          </div>

          {/* Product Info */}
          <div style={productInfoStyle}>
            <div style={brandStyle}>{product.brand}</div>
            <h1 style={titleStyle}>{product.name}</h1>

            {/* Rating */}
            <div style={ratingContainerStyle}>
              <StarRating rating={product.rating} size={20} />
              <span style={{ color: 'var(--sb-muted)' }}>
                ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div style={priceContainerStyle}>
              <span style={currentPriceStyle}>
                {product.price_shipping_included ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(product.price_shipping_included)) : 'N/A'}
              </span>
            </div>

            {/* Stock Info */}
            {/* stock information removed per request */}

            {/* Options */}
            <div style={optionsStyle}>
              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div style={optionGroupStyle}>
                  <label style={optionLabelStyle}>Size:</label>
                  <div style={optionButtonsStyle}>
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        style={optionButtonStyle(selectedSize === size)}
                        onClick={() => setSelectedSize(size)}
                                onMouseEnter={(e) => {
                                  if (selectedSize !== size) {
                                    e.currentTarget.style.backgroundColor = 'var(--sb-surface)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (selectedSize !== size) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div style={optionGroupStyle}>
                  <label style={optionLabelStyle}>Color:</label>
                  <div style={optionButtonsStyle}>
                    {product.colors.map(color => (
                      <button
                        key={color}
                        style={optionButtonStyle(selectedColor === color)}
                        onClick={() => setSelectedColor(color)}
                        onMouseEnter={(e) => {
                          if (selectedColor !== color) {
                            e.currentTarget.style.backgroundColor = 'var(--sb-surface)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedColor !== color) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity, Total, Subtotal */}
            <div style={quantityControlStyle}>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--sb-text)' }}>
                Quantity:
              </span>
              <button
                style={quantityButtonStyle}
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-border)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-surface)'}
              >
                <Minus size={16} style={{ color: 'currentColor' }} />
              </button>
              <span style={quantityDisplayStyle}>{quantity}</span>
              <button
                style={quantityButtonStyle}
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= (product.stockCount || 10)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-border)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-surface)'}
              >
                <Plus size={16} style={{ color: 'currentColor' }} />
              </button>
              <span style={{ marginLeft: '2rem', color: 'var(--sb-accent)', fontWeight: 600, fontSize: '1.1rem' }}>
                Subtotal: {product.price_shipping_included ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(product.price_shipping_included) * quantity) : 'N/A'}
              </span>
            </div>

            {/* Action Buttons */}
            <div style={actionButtonsStyle}>
              <button
                style={addToCartButtonStyle}
                onClick={handleAddToCart}
                onMouseEnter={(e) => {
                  if (!addedToCart) {
                    e.currentTarget.style.backgroundColor = 'var(--sb-accent-700)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!addedToCart) {
                    e.currentTarget.style.backgroundColor = 'var(--sb-accent)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {addedToCart ? (
                    <>
                    <Check size={20} style={{ color: 'currentColor' }} />
                    Added to Cart!
                  </>
                ) : (
                    <>
                    <ShoppingCart size={20} style={{ color: 'currentColor' }} />
                    Add to Cart
                  </>
                )}
              </button>
              <UserAuthModal show={showAuthModal} onClose={() => setShowAuthModal(false)} />

              {/* wishlist removed per request */}

              <button
                style={shareButtonStyle}
                onClick={handleShare}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--sb-surface)';
                  e.currentTarget.style.color = 'var(--sb-text)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--sb-muted)';
                }}
              >
                <Share2 size={20} style={{ color: 'currentColor' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Guarantees removed per request */}

        {/* Product Details Tabs */}
        <div>
            <div style={tabsStyle}>
            <button
              style={tabStyle(activeTab === 'description')}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              style={tabStyle(activeTab === 'reviews')}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews ({product.reviewCount})
            </button>
          </div>

          <div style={tabContentStyle}>
            {activeTab === 'description' && (
              <div>
                <p style={{ lineHeight: '1.8', marginBottom: '2rem', color: 'var(--sb-muted)' }}>
                  {product.description}
                </p>
                {/* Key features removed per user request */}
              </div>
            )}

            {/* Specifications tab removed per user request */}

            {activeTab === 'reviews' && (
              <div>
                <ReviewList productId={product.id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={showCart} onClose={toggleCart} />
    </div>
  );
};

export default ProductDetail;