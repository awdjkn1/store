import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductGrid from '../components/product/ProductGrid';
import StarRating from '../components/common/StarRating';
import CartDrawer from '../components/cart/CartDrawer';
import { useApp } from '../context/AppContext';
import { ArrowRight, ShoppingBag, Star, Users, Shield, Truck, Award } from 'lucide-react';
import productService from '../services/productService';

// Featured products will be fetched from the backend

const Home = () => {
  const { showCart, toggleCart } = useApp();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Fetch featured products from backend
  useEffect(() => {
    let mounted = true;
    async function loadFeatured() {
      try {
        setLoadingFeatured(true);
        const products = await productService.getFeaturedProducts(3);
        if (mounted) setFeaturedProducts(products || []);
      } catch (err) {
        console.error('Failed to load featured products', err);
        if (mounted) setFeaturedProducts([]);
      } finally {
        if (mounted) setLoadingFeatured(false);
      }
    }

    loadFeatured();
    return () => { mounted = false; };
  }, []);

  const pageStyle = {
    backgroundColor: '#1a1a1a',
    minHeight: '100vh',
    color: '#ffffff'
  };

  const heroStyle = {
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
    padding: '6rem 2rem',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden'
  };

  const heroContentStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 2
  };

  const heroTitleStyle = {
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    background: 'linear-gradient(45deg, #ffffff, #ff6b35, #ffffff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: '1.2'
  };

  const heroSubtitleStyle = {
    fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
    color: '#cccccc',
    maxWidth: '600px',
    margin: '0 auto 3rem',
    lineHeight: '1.6'
  };

  const ctaButtonStyle = {
    backgroundColor: '#ff6b35',
    color: '#ffffff',
    border: 'none',
    borderRadius: '50px',
    padding: '1rem 2.5rem',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.4s ease',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    boxShadow: '0 8px 25px rgba(255, 107, 53, 0.3)'
  };

  const sectionStyle = {
    padding: '4rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const sectionTitleStyle = {
    fontSize: 'clamp(2rem, 4vw, 2.5rem)',
    fontWeight: 'bold',
    marginBottom: '3rem',
    textAlign: 'center',
    color: '#ffffff'
  };

  const featuresGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    marginBottom: '4rem'
  };

  const featureCardStyle = {
    backgroundColor: '#2d2d2d',
    padding: '2rem',
    borderRadius: '16px',
    textAlign: 'center',
    transition: 'transform 0.3s ease',
    border: '1px solid #444'
  };

  const featureIconStyle = {
    backgroundColor: '#ff6b35',
    color: '#ffffff',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
    boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)'
  };

  const testimonialsSectionStyle = {
    backgroundColor: '#2d2d2d',
    padding: '4rem 2rem',
    textAlign: 'center'
  };

  const testimonialCardStyle = {
    backgroundColor: '#1a1a1a',
    padding: '2rem',
    borderRadius: '16px',
    maxWidth: '600px',
    margin: '0 auto',
    border: '1px solid #444'
  };

  const testimonialImageStyle = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    margin: '0 auto 1rem',
    objectFit: 'cover',
    border: '3px solid #ff6b35'
  };

  const testimonialDotsStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.75rem',
    marginTop: '2rem'
  };

  const dotStyle = (isActive) => ({
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: isActive ? '#ff6b35' : '#666',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    transform: isActive ? 'scale(1.2)' : 'scale(1)'
  });

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2rem',
    textAlign: 'center',
    marginTop: '4rem'
  };

  const statStyle = {
    padding: '1.5rem'
  };

  const statNumberStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#ff6b35',
    display: 'block'
  };

  const statLabelStyle = {
    fontSize: '1.1rem',
    color: '#cccccc',
    marginTop: '0.5rem'
  };

  return (
    <div style={pageStyle}>
      {/* Hero Section */}
      <section style={heroStyle}>
        <div style={heroContentStyle}>
          <h1 style={heroTitleStyle}>
            Shenzhen Bricks — Premium LEGO Sets & Collectible Bricks
          </h1>
          <p style={heroSubtitleStyle}>
            Shenzhen Bricks is your trusted LEGO store for rare sets, custom builds, and iconic bricks. Shop official LEGO-compatible sets, accessories, and minifigures with fast global shipping, verified product images, and a collector-first experience.
          </p>
          <Link 
            to="/products" 
            style={ctaButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e55a2b';
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 12px 35px rgba(255, 107, 53, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#ff6b35';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 25px rgba(255, 107, 53, 0.3)';
            }}
          >
            <ShoppingBag size={20} />
            Shop Now
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section style={sectionStyle}>
        <div style={featuresGridStyle}>
          <div 
            style={featureCardStyle}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div style={featureIconStyle}>
              <Truck size={24} />
            </div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Free Shipping</h3>
            <p style={{ color: '#cccccc', lineHeight: '1.6' }}>
              Free worldwide shipping on all orders over $50
            </p>
          </div>

          <div 
            style={featureCardStyle}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div style={featureIconStyle}>
              <Shield size={24} />
            </div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Secure Payment</h3>
            <p style={{ color: '#cccccc', lineHeight: '1.6' }}>
              Your payment information is processed securely
            </p>
          </div>

          {/* SEO About section: short rich content for search engines */}
        </div>
        <div style={{ marginTop: '2rem', color: '#cccccc', lineHeight: '1.8' }}>
          <h3 style={{ color: '#ffffff', fontSize: '1.4rem', marginBottom: '0.75rem' }}>About Shenzhen Bricks</h3>
          <p>
            Shenzhen Bricks specializes in high-quality LEGO sets, rare collectibles, and custom-compatible bricks for builders and collectors worldwide. Our catalogue features new releases, retired classics, and carefully inspected parts so you can build with confidence. Search, filter, and find sets by theme, year, or piece count — backed by secure payments and reliable global shipping.
          </p>
        </div>
      </section>

      {/* Featured Products */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Featured Products</h2>
        <ProductGrid products={featuredProducts} showFilters={false} />
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link 
            to="/products" 
            style={{
              ...ctaButtonStyle,
              backgroundColor: 'transparent',
              border: '2px solid #ff6b35',
              color: '#ff6b35'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#ff6b35';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#ff6b35';
            }}
          >
            View All Products
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      

      {/* Cart Drawer */}
      <CartDrawer isOpen={showCart} onClose={toggleCart} />
    </div>
  );
};

export default Home;