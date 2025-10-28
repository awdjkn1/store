import React, { useState, useEffect } from 'react';
import UserAuthModal from './UserAuthModal';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X, Grid, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSocketConnection } from '../../hooks/useSocketConnection';
import { usePaymentUpdates } from '../../hooks/usePaymentUpdates';
import { useAuth } from '../../context/AuthContext';

const Header = () => {

  const { cartItemCount, searchQuery, setSearchQuery, toggleCart } = useApp();
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  const socketConnected = useSocketConnection();
  const latestPaymentUpdate = usePaymentUpdates();

  // ephemeral UI state for showing the small payment update message
  const [showPaymentMsg, setShowPaymentMsg] = useState(false);

  useEffect(() => {
    if (latestPaymentUpdate) {
      setShowPaymentMsg(true);
      const t = setTimeout(() => setShowPaymentMsg(false), 8000);
      return () => clearTimeout(t);
    }
  }, [latestPaymentUpdate]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const headerStyle = {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    padding: '1rem 2rem',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    borderBottom: '2px solid #ff6b35',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
  };

  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const logoStyle = {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#ff6b35',
    textDecoration: 'none',
    transition: 'color 0.3s ease'
  };

  const searchFormStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: '25px',
    padding: '0.5rem 1rem',
    flex: 1,
    maxWidth: '400px',
    margin: '0 2rem',
    border: '2px solid transparent',
    transition: 'border-color 0.3s ease'
  };

  const searchInputStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    marginLeft: '0.5rem',
    flex: 1,
    fontSize: '1rem'
  };

  const searchButtonStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ff6b35',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center'
  };

  const navLinksStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    listStyle: 'none',
    margin: 0,
    padding: 0
  };

  const navLinkStyle = {
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'color 0.3s ease',
    padding: '0.5rem 0'
  };

  const iconButtonStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '8px',
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'background-color 0.3s ease'
  };

  const badgeStyle = {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: '#ff6b35',
    color: '#ffffff',
    borderRadius: '50%',
    width: '22px',
    height: '22px',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    border: '2px solid #1a1a1a'
  };

  const mobileMenuStyle = {
    display: showMobileMenu ? 'block' : 'none',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTop: '1px solid #333',
    padding: '1rem 2rem',
    zIndex: 999
  };

  const mobileNavLinksStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    listStyle: 'none',
    margin: 0,
    padding: 0
  };

  return (
    <header style={headerStyle}>
      <nav style={navStyle}>
        {/* WebSocket status for testing */}
        <div style={{ position: 'absolute', top: 8, right: 16, textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: socketConnected ? '#28a745' : '#ff4444' }}>
            {socketConnected ? 'Live updates: Connected' : 'Live updates: Disconnected'}
          </div>
          {showPaymentMsg && latestPaymentUpdate && (
            <div style={{
              marginTop: 6,
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: 6,
              fontSize: 12,
              maxWidth: 280,
              textAlign: 'left'
            }}>
              <strong>Payment update</strong>
              <div style={{ marginTop: 4 }}>
                {latestPaymentUpdate.payload?.id ? (
                  <>
                    <div>ID: {latestPaymentUpdate.payload.id}</div>
                    <div>Status: {latestPaymentUpdate.payload.status || latestPaymentUpdate.payload.state || 'unknown'}</div>
                  </>
                ) : (
                  <div>{JSON.stringify(latestPaymentUpdate.payload).slice(0, 120)}{String(latestPaymentUpdate.payload).length > 120 ? '…' : ''}</div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Logo */}
        <Link 
          to="/" 
          style={logoStyle}
          onMouseEnter={(e) => e.target.style.color = '#e55a2b'}
          onMouseLeave={(e) => e.target.style.color = '#ff6b35'}
        >
          YourStore
        </Link>

        {/* Search Bar */}
        <form 
          onSubmit={handleSearch}
          style={searchFormStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = '#ff6b35'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <Search size={20} color="#999" />
          <input
            type="text"
            placeholder="Search products..."
            style={searchInputStyle}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" style={searchButtonStyle}>
            <Search size={16} />
          </button>
        </form>

        {/* Desktop Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <ul style={navLinksStyle}>
            <li>
              <Link 
                to="/" 
                style={navLinkStyle}
                onMouseEnter={(e) => e.target.style.color = '#ff6b35'}
                onMouseLeave={(e) => e.target.style.color = '#ffffff'}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/products" 
                style={navLinkStyle}
                onMouseEnter={(e) => e.target.style.color = '#ff6b35'}
                onMouseLeave={(e) => e.target.style.color = '#ffffff'}
              >
                Products
              </Link>
            </li>
            <li>
              <Link
                to="/products"
                style={{ ...navLinkStyle, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                onMouseEnter={(e) => e.target.style.color = '#ff6b35'}
                onMouseLeave={(e) => e.target.style.color = '#ffffff'}
                aria-label="Collections"
              >
                <Grid size={16} />
                Collections
              </Link>
            </li>
            {!user && (
              <>
                <li>
                  {/* Login link removed for home page cleanup */}
                </li>
                {/* Register link removed. Will use modal for registration/login. */}
              </>
            )}
            {user && (
              <li>
                <Link 
                  to="/user" 
                  style={navLinkStyle}
                  onMouseEnter={e => e.target.style.color = '#ff6b35'}
                  onMouseLeave={e => e.target.style.color = '#ffffff'}
                >
                  Account
                </Link>
              </li>
            )}
          </ul>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* nav links + icon group arranged with divider and admin at far right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ul style={navLinksStyle}>
                {/* kept links rendered earlier */}
              </ul>
            </div>

            <div style={{ width: 1, height: 28, background: '#444', margin: '0 8px' }} />

            {/* icon group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                style={iconButtonStyle}
                onClick={() => user ? navigate('/user') : setShowAuthModal(true)}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2d2d2d'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                aria-label="Account"
              >
                <User size={18} />
              </button>
              <UserAuthModal show={showAuthModal} onClose={() => setShowAuthModal(false)} />

              <button
                style={iconButtonStyle}
                onClick={toggleCart}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2d2d2d'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                aria-label="Cart"
              >
                <ShoppingCart size={18} />
                {cartItemCount > 0 && (
                  <span style={badgeStyle}>{cartItemCount}</span>
                )}
              </button>
            </div>

            {/* admin at far right */}
            <div style={{ marginLeft: 6 }}>
              <button
                style={iconButtonStyle}
                onClick={() => navigate('/admin')}
                title="Admin"
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2d2d2d'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                aria-label="Admin"
              >
                <Shield size={18} />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              style={{ ...iconButtonStyle, display: 'none' }}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div style={mobileMenuStyle}>
        <ul style={mobileNavLinksStyle}>
          <li>
            <Link 
              to="/" 
              style={navLinkStyle}
              onClick={() => setShowMobileMenu(false)}
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              to="/products" 
              style={navLinkStyle}
              onClick={() => setShowMobileMenu(false)}
            >
              Products
            </Link>
          </li>
          <li>
            <Link 
              to="/admin" 
              style={navLinkStyle}
              onClick={() => setShowMobileMenu(false)}
            >
              Admin
            </Link>
          </li>
  </ul>
      </div>
    </header>
  );
};

export default Header;