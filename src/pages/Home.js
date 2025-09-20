import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductGrid from '../components/product/ProductGrid';
import StarRating from '../components/common/StarRating';
import CartDrawer from '../components/cart/CartDrawer';
import { useApp } from '../context/AppContext';
import { ArrowRight, ShoppingBag, Star, Users, Shield, Truck, Award } from 'lucide-react';

// Sample data - replace with your actual data
const featuredProducts = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    price: 299.99,
    originalPrice: 399.99,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop"
    ],
    category: "Electronics",
    rating: 4.5,
    reviewCount: 128,
    isNew: true
  },
  {
    id: 2,
    name: "Smart Fitness Watch",
    price: 199.99,
    originalPrice: 249.99,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop"
    ],
    category: "Wearables",
    rating: 4.2,
    reviewCount: 89
  },
  {
    id: 3,
    name: "Professional Camera Lens",
    price: 899.99,
    originalPrice: 1099.99,
    images: [
      "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=600&h=600&fit=crop"
    ],
    category: "Photography",
    rating: 4.8,
    reviewCount: 245
  }
];

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    rating: 5,
    comment: "Amazing quality products and fast shipping. Highly recommend!",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b547?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 2,
    name: "Mike Chen",
    rating: 5,
    comment: "Best online shopping experience I've had. Great customer service!",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 3,
    name: "Emily Davis",
    rating: 4,
    comment: "Love the product quality and the website is so easy to use.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
  }
];

const Home = () => {
  const { showCart, toggleCart } = useApp();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
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
            Premium Products, Exceptional Quality
          </h1>
          <p style={heroSubtitleStyle}>
            Discover our curated collection of high-quality products with unbeatable prices and fast shipping worldwide
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

          <div 
            style={featureCardStyle}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div style={featureIconStyle}>
              <Award size={24} />
            </div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Quality Guarantee</h3>
            <p style={{ color: '#cccccc', lineHeight: '1.6' }}>
              30-day money back guarantee on all products
            </p>
          </div>

          <div 
            style={featureCardStyle}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div style={featureIconStyle}>
              <Users size={24} />
            </div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>24/7 Support</h3>
            <p style={{ color: '#cccccc', lineHeight: '1.6' }}>
              Dedicated customer support team ready to help
            </p>
          </div>
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

      {/* Testimonials */}
      <section style={testimonialsSectionStyle}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={sectionTitleStyle}>What Our Customers Say</h2>
          
          <div style={testimonialCardStyle}>
            <img 
              src={testimonials[currentTestimonial].image} 
              alt={testimonials[currentTestimonial].name}
              style={testimonialImageStyle}
            />
            <div style={{ marginBottom: '1rem' }}>
              <StarRating rating={testimonials[currentTestimonial].rating} size={24} />
            </div>
            <p style={{ 
              fontSize: '1.1rem', 
              lineHeight: '1.6', 
              marginBottom: '1.5rem',
              fontStyle: 'italic',
              color: '#cccccc'
            }}>
              "{testimonials[currentTestimonial].comment}"
            </p>
            <h4 style={{ color: '#ff6b35', fontSize: '1.1rem', fontWeight: 'bold' }}>
              {testimonials[currentTestimonial].name}
            </h4>
          </div>

          <div style={testimonialDotsStyle}>
            {testimonials.map((_, index) => (
              <button
                key={index}
                style={dotStyle(index === currentTestimonial)}
                onClick={() => setCurrentTestimonial(index)}
              />
            ))}
          </div>

          {/* Stats */}
          <div style={statsStyle}>
            <div style={statStyle}>
              <span style={statNumberStyle}>10K+</span>
              <span style={statLabelStyle}>Happy Customers</span>
            </div>
            <div style={statStyle}>
              <span style={statNumberStyle}>50K+</span>
              <span style={statLabelStyle}>Products Sold</span>
            </div>
            <div style={statStyle}>
              <span style={statNumberStyle}>4.8</span>
              <span style={statLabelStyle}>Average Rating</span>
            </div>
            <div style={statStyle}>
              <span style={statNumberStyle}>24/7</span>
              <span style={statLabelStyle}>Customer Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Cart Drawer */}
      <CartDrawer isOpen={showCart} onClose={toggleCart} />
    </div>
  );
};

export default Home;