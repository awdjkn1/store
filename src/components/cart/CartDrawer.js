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
  backgroundColor: 'var(--sb-bg)',
  color: 'var(--sb-text)',
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 2001,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
    borderLeft: '1px solid var(--sb-border)'
  };

  const headerStyle = {
    padding: '2rem 1.5rem 1rem',
    borderBottom: '1px solid var(--sb-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--sb-surface)'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'var(--sb-text)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const closeButtonStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--sb-muted)',
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
    scrollbarColor: 'var(--sb-accent) var(--sb-surface)'
  };

  const emptyCartStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    color: 'var(--sb-muted)',
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
    borderBottom: '1px solid var(--sb-border)',
    position: 'relative'
  };

  const itemImageStyle = {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '12px',
    backgroundColor: 'var(--sb-surface)',
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
    color: 'var(--sb-text)',
    lineHeight: '1.4',
    marginBottom: '0.25rem'
  };

  const itemPriceStyle = {
    color: 'var(--sb-accent)',
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
    backgroundColor: 'var(--sb-accent)',
    color: 'var(--sb-accent-on)',
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
    color: 'var(--sb-text)',
    padding: '0.5rem',
    backgroundColor: 'var(--sb-surface)',
    borderRadius: '8px'
  };

  const removeButtonStyle = {
    position: 'absolute',
    top: '1rem',
    right: '0',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--sb-error)',
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
    backgroundColor: 'var(--sb-surface)',
    borderTop: '1px solid var(--sb-border)'
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
    borderTop: '1px solid var(--sb-border)'
  };

  const checkoutButtonStyle = {
    backgroundColor: 'var(--sb-accent)',
    color: 'var(--sb-accent-on)',
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
    color: 'var(--sb-muted)',
    border: '1px solid var(--sb-border)',
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
  // Tax removed per user request
  const finalTotal = cartTotal + shipping; // no tax

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
              e.currentTarget.style.backgroundColor = 'var(--sb-border)';
              e.currentTarget.style.color = 'var(--sb-text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--sb-muted)';
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={contentStyle}>
          {cart.length === 0 ? (
            <div style={emptyCartStyle}>
              <div style={emptyIconStyle}>🛒</div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--sb-muted)' }}>Your cart is empty</h3>
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
                  src={item.image || item.images?.[0] || 'https://via.placeholder.com/80x80/2d2d2d/cccccc?text=No+Image'} 
                  alt={item.name}
                  style={itemImageStyle}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/80x80/2d2d2d/cccccc?text=No+Image';
                  }}
                />
                
                <div style={itemInfoStyle}>
                  <h4 style={itemNameStyle}>{item.name}</h4>
                  <div style={itemPriceStyle}>
                    ${( (item.price ?? item.price_shipping_included ?? 0) * item.quantity ).toFixed(2)}
                  </div>
                  
                  <div style={quantityControlStyle}>
                    <button 
                      style={quantityButtonStyle}
                      onClick={() => updateCartItem(item.id, item.quantity - 1)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-accent-400)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-accent)'}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    
                    <span style={quantityDisplayStyle}>{item.quantity}</span>
                    
                    <button 
                      style={quantityButtonStyle}
                      onClick={() => updateCartItem(item.id, item.quantity + 1)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-accent-400)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-accent)'}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => removeFromCart(item.id)}
                  style={removeButtonStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(224,82,82,0.08)';
                    e.currentTarget.style.color = 'var(--sb-error)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--sb-error)';
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
              <span style={{ color: 'var(--sb-success)' }}>
                {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            
            {/* Tax removed per user request */}
            
            <div style={totalStyle}>
              <span>Total:</span>
              <span style={{ color: 'var(--sb-accent)' }}>${finalTotal.toFixed(2)}</span>
            </div>
            
            <Link to="/checkout" onClick={onClose}>
              <button 
                style={checkoutButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--sb-accent-400)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,77,64,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--sb-accent)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
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
                e.currentTarget.style.backgroundColor = 'var(--sb-border)';
                e.currentTarget.style.borderColor = 'var(--sb-accent)';
                e.currentTarget.style.color = 'var(--sb-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--sb-border)';
                e.currentTarget.style.color = 'var(--sb-muted)';
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