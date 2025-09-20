import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProductImageGallery from '../components/product/ProductImageGallery';
import StarRating from '../components/common/StarRating';
import ReviewList from '../components/reviews/ReviewList';
import CartDrawer from '../components/cart/CartDrawer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { 
  ShoppingCart, 
  Heart, 
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
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, showCart, toggleCart } = useApp();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [addedToCart, setAddedToCart] = useState(false);

  // Sample product data - replace with API call
  const sampleProduct = {
    id: parseInt(id),
    name: "Premium Wireless Headphones",
    price: 299.99,
    originalPrice: 399.99,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop"
    ],
    category: "Electronics",
    rating: 4.5,
    reviewCount: 128,
    inStock: true,
    stockCount: 15,
    brand: "AudioTech",
    sku: "AT-WH-001",
    description: "Experience premium sound quality with our flagship wireless headphones. Featuring advanced noise-cancellation technology, premium materials, and up to 30 hours of battery life. Perfect for music lovers, professionals, and anyone who demands the best audio experience.",
    features: [
      "Active Noise Cancellation",
      "30-hour Battery Life",
      "Wireless Charging Case",
      "Premium Build Quality",
      "Hi-Fi Audio Quality",
      "Comfortable Fit",
      "Quick Charge Technology",
      "Multi-device Connectivity"
    ],
    specifications: {
      "Driver Size": "40mm",
      "Frequency Response": "20Hz - 20kHz",
      "Battery Life": "30 hours",
      "Charging Time": "2 hours",
      "Connectivity": "Bluetooth 5.0",
      "Weight": "250g",
      "Warranty": "2 years"
    },
    sizes: ["Small", "Medium", "Large"],
    colors: ["Black", "White", "Silver", "Blue"],
    shipping: {
      free: true,
      estimatedDays: "2-3 business days",
      expedited: "Next day delivery available"
    },
    returns: "30-day return policy"
  };

  useEffect(() => {
    // Simulate API call
    const loadProduct = async () => {
      setLoading(true);
      try {
        // Replace with actual API call
        setTimeout(() => {
          setProduct(sampleProduct);
          setSelectedSize(sampleProduct.sizes?.[0] || '');
          setSelectedColor(sampleProduct.colors?.[0] || '');
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading product:', error);
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    const cartItem = {
      ...product,
      quantity,
      selectedSize,
      selectedColor
    };
    
    addToCart(cartItem);
    setAddedToCart(true);
    
    // Reset the success state after 2 seconds
    setTimeout(() => setAddedToCart(false), 2000);
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
    backgroundColor: '#1a1a1a',
    minHeight: '100vh',
    color: '#ffffff',
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
    color: '#cccccc'
  };

  const breadcrumbLinkStyle = {
    color: '#ff6b35',
    textDecoration: 'none',
    cursor: 'pointer'
  };

  const backButtonStyle = {
    backgroundColor: 'transparent',
    border: '1px solid #444',
    color: '#cccccc',
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
    color: '#ffffff',
    lineHeight: '1.2'
  };

  const brandStyle = {
    fontSize: '1.1rem',
    color: '#ff6b35',
    fontWeight: '600',
    marginBottom: '1rem'
  };

  const priceContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem'
  };

  const currentPriceStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#ff6b35'
  };

  const originalPriceStyle = {
    fontSize: '1.5rem',
    color: '#999',
    textDecoration: 'line-through'
  };

  const discountBadgeStyle = {
    backgroundColor: '#28a745',
    color: '#ffffff',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: 'bold'
  };

  const ratingContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem'
  };

  const stockInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '2rem',
    color: product?.inStock ? '#28a745' : '#ff4444'
  };

  const optionsStyle = {
    marginBottom: '2rem'
  };

  const optionGroupStyle = {
    marginBottom: '1.5rem'
  };

  const optionLabelStyle = {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '0.75rem',
    display: 'block'
  };

  const optionButtonsStyle = {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap'
  };

  const optionButtonStyle = (isSelected) => ({
    backgroundColor: isSelected ? '#ff6b35' : 'transparent',
    color: isSelected ? '#ffffff' : '#cccccc',
    border: `1px solid ${isSelected ? '#ff6b35' : '#555'}`,
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
    backgroundColor: '#2d2d2d',
    color: '#ffffff',
    border: '1px solid #555',
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
    color: '#ffffff',
    minWidth: '60px',
    textAlign: 'center',
    padding: '0.5rem',
    backgroundColor: '#2d2d2d',
    borderRadius: '8px'
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem'
  };

  const addToCartButtonStyle = {
    backgroundColor: addedToCart ? '#28a745' : '#ff6b35',
    color: '#ffffff',
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
    backgroundColor: isWishlisted ? '#ff6b35' : 'transparent',
    color: isWishlisted ? '#ffffff' : '#ff6b35',
    border: '2px solid #ff6b35',
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
    color: '#cccccc',
    border: '1px solid #555',
    borderRadius: '12px',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const featuresStyle = {
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '2rem'
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
    color: '#cccccc'
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
    backgroundColor: '#2d2d2d',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #444'
  };

  const guaranteeIconStyle = {
    backgroundColor: '#ff6b35',
    color: '#ffffff',
    padding: '0.75rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const tabsStyle = {
    display: 'flex',
    borderBottom: '1px solid #444',
    marginBottom: '2rem'
  };

  const tabStyle = (isActive) => ({
    backgroundColor: 'transparent',
    color: isActive ? '#ff6b35' : '#cccccc',
    border: 'none',
    borderBottom: isActive ? '2px solid #ff6b35' : '2px solid transparent',
    padding: '1rem 2rem',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  });

  const tabContentStyle = {
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    padding: '2rem'
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
              <ArrowLeft size={20} />
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice ? 
    Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

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
          <span>{product.category}</span>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          style={backButtonStyle}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#2d2d2d';
            e.target.style.borderColor = '#ff6b35';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.borderColor = '#444';
          }}
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Product Layout */}
        <div style={productLayoutStyle}>
          {/* Product Images */}
          <div>
            <ProductImageGallery images={product.images} productName={product.name} />
          </div>

          {/* Product Info */}
          <div style={productInfoStyle}>
            <div style={brandStyle}>{product.brand}</div>
            <h1 style={titleStyle}>{product.name}</h1>

            {/* Rating */}
            <div style={ratingContainerStyle}>
              <StarRating rating={product.rating} size={20} />
              <span style={{ color: '#cccccc' }}>
                ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div style={priceContainerStyle}>
              <span style={currentPriceStyle}>${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <>
                  <span style={originalPriceStyle}>${product.originalPrice.toFixed(2)}</span>
                  <span style={discountBadgeStyle}>Save {discount}%</span>
                </>
              )}
            </div>

            {/* Stock Info */}
            <div style={stockInfoStyle}>
              <Check size={16} />
              <span>
                {product.inStock 
                  ? `In Stock (${product.stockCount} available)`
                  : 'Out of Stock'
                }
              </span>
            </div>

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
                            e.target.style.backgroundColor = '#2d2d2d';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedSize !== size) {
                            e.target.style.backgroundColor = 'transparent';
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
                            e.target.style.backgroundColor = '#2d2d2d';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedColor !== color) {
                            e.target.style.backgroundColor = 'transparent';
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

            {/* Quantity */}
            <div style={quantityControlStyle}>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: '#ffffff' }}>
                Quantity:
              </span>
              <button
                style={quantityButtonStyle}
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2d2d2d'}
              >
                <Minus size={16} />
              </button>
              <span style={quantityDisplayStyle}>{quantity}</span>
              <button
                style={quantityButtonStyle}
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= (product.stockCount || 10)}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2d2d2d'}
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Action Buttons */}
            <div style={actionButtonsStyle}>
              <button
                style={addToCartButtonStyle}
                onClick={handleAddToCart}
                disabled={!product.inStock}
                onMouseEnter={(e) => {
                  if (!addedToCart && product.inStock) {
                    e.target.style.backgroundColor = '#e55a2b';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!addedToCart && product.inStock) {
                    e.target.style.backgroundColor = '#ff6b35';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {addedToCart ? (
                  <>
                    <Check size={20} />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    Add to Cart
                  </>
                )}
              </button>

              <button
                style={wishlistButtonStyle}
                onClick={() => setIsWishlisted(!isWishlisted)}
                onMouseEnter={(e) => {
                  if (!isWishlisted) {
                    e.target.style.backgroundColor = '#ff6b35';
                    e.target.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isWishlisted) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#ff6b35';
                  }
                }}
              >
                <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>

              <button
                style={shareButtonStyle}
                onClick={handleShare}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2d2d2d';
                  e.target.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#cccccc';
                }}
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Guarantees */}
        <div style={guaranteesStyle}>
          <div style={guaranteeItemStyle}>
            <div style={guaranteeIconStyle}>
              <Truck size={24} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#ffffff' }}>Free Shipping</h4>
              <p style={{ margin: 0, color: '#cccccc', fontSize: '0.9rem' }}>
                {product.shipping?.estimatedDays || '2-3 business days'}
              </p>
            </div>
          </div>

          <div style={guaranteeItemStyle}>
            <div style={guaranteeIconStyle}>
              <RotateCcw size={24} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#ffffff' }}>Easy Returns</h4>
              <p style={{ margin: 0, color: '#cccccc', fontSize: '0.9rem' }}>
                {product.returns || '30-day return policy'}
              </p>
            </div>
          </div>

          <div style={guaranteeItemStyle}>
            <div style={guaranteeIconStyle}>
              <Shield size={24} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#ffffff' }}>Warranty</h4>
              <p style={{ margin: 0, color: '#cccccc', fontSize: '0.9rem' }}>
                {product.specifications?.Warranty || '2 year warranty'}
              </p>
            </div>
          </div>
        </div>

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
              style={tabStyle(activeTab === 'specifications')}
              onClick={() => setActiveTab('specifications')}
            >
              Specifications
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
                <p style={{ lineHeight: '1.8', marginBottom: '2rem', color: '#cccccc' }}>
                  {product.description}
                </p>
                
                <h4 style={{ marginBottom: '1rem', color: '#ffffff' }}>Key Features:</h4>
                <div style={featureGridStyle}>
                  {product.features.map((feature, index) => (
                    <div key={index} style={featureItemStyle}>
                      <Check size={16} color="#ff6b35" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {Object.entries(product.specifications || {}).map(([key, value]) => (
                    <div 
                      key={key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '1rem 0',
                        borderBottom: '1px solid #444'
                      }}
                    >
                      <span style={{ fontWeight: '600', color: '#ffffff' }}>{key}:</span>
                      <span style={{ color: '#cccccc' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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