import React from 'react';
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerStyle = {
    backgroundColor: 'var(--sb-bg)',
    borderTop: '1px solid var(--sb-border)',
    marginTop: '80px'
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '60px 20px 20px'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '40px',
    marginBottom: '40px'
  };

  const sectionStyle = {
    color: 'var(--sb-text)'
  };

  const headingStyle = {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '20px',
    color: 'var(--sb-accent)'
  };

  const linkStyle = {
    color: 'var(--sb-muted)',
    textDecoration: 'none',
    display: 'block',
    padding: '8px 0',
    transition: 'all 0.3s ease',
    fontSize: '14px'
  };

  const socialIconStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: 'var(--sb-surface)',
    borderRadius: '50%',
    color: 'var(--sb-text)',
    textDecoration: 'none',
    margin: '0 8px 8px 0',
    transition: 'all 0.3s ease'
  };

  const bottomBarStyle = {
    borderTop: '1px solid var(--sb-border)',
    paddingTop: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    color: 'var(--sb-muted)'
  };

  const paymentIconStyle = {
    display: 'inline-block',
    padding: '8px 12px',
    backgroundColor: 'var(--sb-surface)',
    borderRadius: '4px',
    margin: '0 8px 8px 0',
    fontSize: '12px',
    color: 'var(--sb-text)',
    fontWeight: '600'
  };

  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
        {/* Main Footer Content */}
        <div style={gridStyle}>
          {/* Company Info */}
          <div style={sectionStyle}>
            <h3 style={headingStyle}>Your Store</h3>
            <p style={{ color: 'var(--sb-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
              Premium quality products with exceptional customer service. 
              We're committed to providing the best shopping experience.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <MapPin size={16} style={{ color: 'var(--sb-accent)' }} />
              <span style={{ color: 'var(--sb-muted)', fontSize: '14px' }}>
                123 Business Street, City, State 12345
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Phone size={16} style={{ color: 'var(--sb-accent)' }} />
              <span style={{ color: 'var(--sb-muted)', fontSize: '14px' }}>
                +1 (555) 123-4567
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={16} style={{ color: 'var(--sb-accent)' }} />
              <span style={{ color: 'var(--sb-muted)', fontSize: '14px' }}>
                support@yourstore.com
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div style={sectionStyle}>
            <h3 style={headingStyle}>Quick Links</h3>
            <a href="/products" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sb-accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sb-muted)'}>
              All Products
            </a>
            <a href="/about" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sb-accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sb-muted)'}>
              About Us
            </a>
            <a href="/contact" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sb-accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sb-muted)'}>
              Contact
            </a>
            <a href="/cart" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sb-accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sb-muted)'}>
              Shopping Cart
            </a>
            <a href="/checkout" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sb-accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sb-muted)'}>
              Checkout
            </a>
          </div>

          {/* Customer Service */}
          <div style={sectionStyle}>
            <h3 style={headingStyle}>Customer Service</h3>
            <a href="/faq" style={linkStyle} onMouseEnter={(e) => e.target.style.color = 'var(--sb-accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--sb-muted)'}>
              FAQ
            </a>
            <a href="/shipping" style={linkStyle} onMouseEnter={(e) => e.target.style.color = 'var(--sb-accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--sb-muted)'}>
              Shipping Information
            </a>
            <a href="/returns" style={linkStyle} onMouseEnter={(e) => e.target.style.color = 'var(--sb-accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--sb-muted)'}>
              Returns & Exchanges
            </a>
            <a href="/privacy" style={linkStyle} onMouseEnter={(e) => e.target.style.color = 'var(--sb-accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--sb-muted)'}>
              Privacy Policy
            </a>
            <a href="/terms" style={linkStyle} onMouseEnter={(e) => e.target.style.color = 'var(--sb-accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--sb-muted)'}>
              Terms of Service
            </a>
          </div>

          {/* Newsletter */}
          <div style={sectionStyle}>
            <h3 style={headingStyle}>Stay Connected</h3>
            <p style={{ color: 'var(--sb-muted)', marginBottom: '20px', fontSize: '14px' }}>
              Subscribe to get special offers and updates
            </p>
            <div style={{ display: 'flex', marginBottom: '20px' }}>
              <input
                type="email"
                placeholder="Enter your email"
                style={{
                  flex: '1',
                  padding: '12px',
                  backgroundColor: 'var(--sb-surface)',
                  border: '1px solid var(--sb-border)',
                  borderRadius: '4px 0 0 4px',
                  color: 'var(--sb-text)',
                  fontSize: '14px'
                }}
              />
              <button
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'var(--sb-accent)',
                  color: 'var(--sb-accent-on)',
                  border: 'none',
                  borderRadius: '0 4px 4px 0',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Subscribe
              </button>
            </div>
            
            {/* Social Media */}
            <div>
              <a href="#" style={socialIconStyle} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-accent)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-surface)'}>
                <Facebook size={18} />
              </a>
                <a href="#" style={socialIconStyle} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-accent)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-surface)'}>
                <Twitter size={18} />
              </a>
                <a href="#" style={socialIconStyle} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-accent)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-surface)'}>
                <Instagram size={18} />
              </a>
                <a href="#" style={socialIconStyle} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-accent)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-surface)'}>
                <Youtube size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={bottomBarStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>© {currentYear} Your Store. Made with</span>
            <Heart size={16} style={{ color: 'var(--sb-accent)', fill: 'var(--sb-accent)' }} />
            <span>for our customers</span>
          </div>
          
          {/* Payment Methods */}
          <div>
            <span style={paymentIconStyle}>HoodPay</span>
            <span style={paymentIconStyle}>VISA</span>
            <span style={paymentIconStyle}>MASTER</span>
            <span style={paymentIconStyle}>PAYPAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;