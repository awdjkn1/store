import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, updateCartItem, removeFromCart, cartTotal, cartItemCount } = useApp();

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close cart on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 2000,
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? 'visible' : 'hidden',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(4px)'
  };

  const drawerStyle = {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '100%',
    maxWidth: '450px',
    height: '100vh',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 2001,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
    borderLeft: '1px solid #333'
  };

  const headerStyle = {
    padding: '2rem 1.5rem 1rem',
    borderBottom: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2d2d2d'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const closeButtonStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#cccccc',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const contentStyle = {
    flex: 1,
    overflow: 'auto',
    padding: '1rem',
    scrollbarWidth: 'thin',
    scrollbarColor: '#ff6b35 #2d2d2d'
  };

  const emptyCartStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    color: '#666',
    padding: '2rem'
  };

  const emptyIconStyle = {
    fontSize: '4rem',
    marginBottom: '1rem',
    opacity: 0.5
  };

  const cartItemStyle = {
    display: 'flex',
    gap: '1rem',
    padding: '1.5rem 0',
    borderBottom: '1px solid #333',
    position: 'relative'
  };

  const itemImageStyle = {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '12px',
    backgroundColor: '#2d2d2d',
    flexShrink: 0
  };

  const itemInfoStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  };

  const itemNameStyle = {
    fontWeight: '600',
    fontSize: '1rem',
    color: '#ffffff',
    lineHeight: '1.4',
    marginBottom: '0.25rem'
  };

  const itemPriceStyle = {
    color: '#ff6b35',
    fontWeight: 'bold',
    fontSize: '1.1rem'
  };

  const quantityControlStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.75rem'
  };

  const quantityButtonStyle = {
    backgroundColor: '#ff6b35',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1rem',
    fontWeight: 'bold'
  };

  const quantityDisplayStyle = {
    minWidth: '50px',
    textAlign: 'center',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#ffffff',
    padding: '0.5rem',
    backgroundColor: '#2d2d2d',
    borderRadius: '8px'
  };

  const removeButtonStyle = {
    position: 'absolute',
    top: '1rem',
    right: '0',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ff4444',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '6px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const footerStyle = {
    padding: '1.5rem',
    backgroundColor: '#2d2d2d',
    borderTop: '1px solid #333'
  };

  const subtotalStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    fontSize: '1.1rem'
  };

  const totalStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '1.4rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #444'
  };

  const checkoutButtonStyle = {
    backgroundColor: '#ff6b35',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  };

  const continueShoppingStyle = {
    backgroundColor: 'transparent',
    color: '#cccccc',
    border: '1px solid #444',
    borderRadius: '12px',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.3s ease',
    marginTop: '0.75rem',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'block'
  };

  const shipping = 0; // Free shipping
  const tax = cartTotal * 0.1; // 10% tax
  const finalTotal = cartTotal + shipping + tax;

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={drawerStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            <ShoppingBag size={24} />
            Cart ({cartItemCount})
          </h2>
          <button 
            onClick={onClose}
            style={closeButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#444';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#cccccc';
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={contentStyle}>
          {cart.length === 0 ? (
            <div style={emptyCartStyle}>
              <div style={emptyIconStyle}>🛒</div>
              <h3 style={{ marginBottom: '0.5rem', color: '#cccccc' }}>Your cart is empty</h3>
              <p style={{ marginBottom: '2rem', opacity: 0.7 }}>
                Add some products to get started
              </p>
              <Link 
                to="/products" 
                style={continueShoppingStyle}
                onClick={onClose}
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={cartItemStyle}>
                <img 
                  src={item.images?.[0] || 'https://via.placeholder.com/80x80/2d2d2d/cccccc?text=No+Image'} 
                  alt={item.name}
                  style={itemImageStyle}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/80x80/2d2d2d/cccccc?text=No+Image';
                  }}
                />
                
                <div style={itemInfoStyle}>
                  <h4 style={itemNameStyle}>{item.name}</h4>
                  <div style={itemPriceStyle}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                  
                  <div style={quantityControlStyle}>
                    <button 
                      style={quantityButtonStyle}
                      onClick={() => updateCartItem(item.id, item.quantity - 1)}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#e55a2b'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ff6b35'}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    
                    <span style={quantityDisplayStyle}>{item.quantity}</span>
                    
                    <button 
                      style={quantityButtonStyle}
                      onClick={() => updateCartItem(item.id, item.quantity + 1)}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#e55a2b'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ff6b35'}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => removeFromCart(item.id)}
                  style={removeButtonStyle}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
                    e.target.style.color = '#ff6b6b';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#ff4444';
                  }}
                  title="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div style={footerStyle}>
            <div style={subtotalStyle}>
              <span>Subtotal:</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            
            <div style={subtotalStyle}>
              <span>Shipping:</span>
              <span style={{ color: '#28a745' }}>
                {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            
            <div style={subtotalStyle}>
              <span>Tax:</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            
            <div style={totalStyle}>
              <span>Total:</span>
              <span style={{ color: '#ff6b35' }}>${finalTotal.toFixed(2)}</span>
            </div>
            
            <Link to="/checkout" onClick={onClose}>
              <button 
                style={checkoutButtonStyle}
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
                <ShoppingBag size={20} />
                Proceed to Checkout
              </button>
            </Link>
            
            <Link 
              to="/products" 
              style={continueShoppingStyle}
              onClick={onClose}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#333';
                e.target.style.borderColor = '#ff6b35';
                e.target.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.borderColor = '#444';
                e.target.style.color = '#cccccc';
              }}
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;