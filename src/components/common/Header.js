import React, { useState, useEffect } from 'react';
import UserAuthModal from './UserAuthModal';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSocketConnection } from '../../hooks/useSocketConnection';
import { usePaymentUpdates } from '../../hooks/usePaymentUpdates';
import { useAuth } from '../../context/AuthContext';

const Header = () => {

  const { cartItemCount, searchQuery, setSearchQuery } = useApp();
  const { user } = useAuth();
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
    backgroundColor: 'var(--sb-bg)',
    color: 'var(--sb-text)',
    padding: '1rem 2rem',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    borderBottom: '2px solid var(--sb-accent)',
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
    color: 'var(--sb-accent)',
    textDecoration: 'none',
    transition: 'color 0.3s ease'
  };

  const searchFormStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--sb-surface)',
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
    color: 'var(--sb-text)',
    marginLeft: '0.5rem',
    flex: 1,
    fontSize: '1rem'
  };

  const searchButtonStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--sb-accent)',
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
    color: 'var(--sb-text)',
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'color 0.3s ease',
    padding: '0.5rem 0'
  };

  const iconButtonStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--sb-text)',
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
    backgroundColor: 'var(--sb-accent)',
    color: 'var(--sb-accent-on)',
    borderRadius: '50%',
    width: '22px',
    height: '22px',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    border: '2px solid var(--sb-bg)'
  };

  // Mobile menu removed — header now shows icon group on mobile and desktop nav links on desktop

  return (
    <header style={headerStyle}>
      <nav style={navStyle}>
        {/* WebSocket status for testing */}
        <div style={{ position: 'absolute', top: 8, right: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: socketConnected ? 'var(--sb-success)' : 'var(--sb-error)' }}>
              {socketConnected ? 'Live updates: Connected' : 'Live updates: Disconnected'}
            </div>
            {showPaymentMsg && latestPaymentUpdate && (
              <div style={{
                marginTop: 6,
                background: 'rgba(0,0,0,0.6)',
                color: 'var(--sb-text)',
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
        </div>
        {/* Logo */}
        <Link 
          to="/" 
          style={logoStyle}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sb-accent-700)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sb-accent)'}
        >
          YourStore
        </Link>

        {/* Search Bar */}
        <form 
          onSubmit={handleSearch}
          style={searchFormStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--sb-accent)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <Search size={20} style={{ color: 'var(--sb-muted)' }} />
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
          <ul className="nav-links" style={navLinksStyle}>
            {/* Collections link removed as requested */}
                <li>
                  <Link 
                    to="/" 
                    style={navLinkStyle}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sb-accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sb-text)'}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/products" 
                    style={navLinkStyle}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sb-accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sb-text)'}
                  >
                    Products
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
            {/* Removed Account text link; user icon is now the only way to access account */}
          </ul>

          <div className="nav-icons" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* nav links + icon group arranged with divider and admin at far right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <nav aria-label="Primary navigation">
                    <button
                      style={{ ...navLinkStyle, background: 'transparent', border: 'none', cursor: 'pointer' }}
                      onClick={() => user ? navigate('/user') : setShowAuthModal(true)}
                      aria-label="Account"
                    >
                      Account
                    </button>
                <UserAuthModal show={showAuthModal} onClose={() => setShowAuthModal(false)} />

                    <button
                      style={{ ...navLinkStyle, background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative' }}
                      onClick={() => navigate('/cart')}
                      aria-label="Cart"
                    >
                      Cart
                      {cartItemCount > 0 && (
                        <span style={{ ...badgeStyle, top: '-8px', right: '-12px', width: '20px', height: '20px', fontSize: '0.7rem' }}>{cartItemCount}</span>
                      )}
                    </button>
              </nav>
              {/* Admin moved to footer (bottom-right) per layout change */}
            </div>

            {/* Mobile menu removed: desktop links are hidden on small screens via CSS, icons remain accessible */}
          </div>
        </div>
      </nav>
      
    </header>
  );
};

export default Header;