import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSocketConnection } from '../../hooks/useSocketConnection';
import { useAuth } from '../../context/AuthContext';

const Header = () => {

  const { cartItemCount, searchQuery, setSearchQuery, toggleCart } = useApp();
  const { user, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const socketConnected = useSocketConnection();

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
    gap: '2rem',
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
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
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
        <div style={{ position: 'absolute', top: 8, right: 16, fontSize: 12, color: socketConnected ? '#28a745' : '#ff4444' }}>
          {socketConnected ? 'Live updates: Connected' : 'Live updates: Disconnected'}
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
                to="/admin" 
                style={navLinkStyle}
                onMouseEnter={(e) => e.target.style.color = '#ff6b35'}
                onMouseLeave={(e) => e.target.style.color = '#ffffff'}
              >
                Admin
              </Link>
            </li>
            {!user && (
              <>
                <li>
                  <Link to="/login" style={navLinkStyle}>Login</Link>
                </li>
                <li>
                  <Link to="/register" style={navLinkStyle}>Register</Link>
                </li>
              </>
            )}
            {user && (
              <li>
                <button style={{ ...navLinkStyle, background: 'none', border: 'none', cursor: 'pointer' }} onClick={logout}>
                  Logout
                </button>
              </li>
            )}
          </ul>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

            {/* User Account */}
            <Link
              to="/login"
              style={iconButtonStyle}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2d2d2d'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <User size={20} />
            </Link>
            
            {/* Cart */}
            <button 
              style={iconButtonStyle}
              onClick={toggleCart}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2d2d2d'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <ShoppingCart size={20} />
              {cartItemCount > 0 && (
                <span style={badgeStyle}>{cartItemCount}</span>
              )}
            </button>

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