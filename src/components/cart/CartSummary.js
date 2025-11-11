import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { ShoppingCart, Truck, CreditCard, ArrowRight, Gift } from 'lucide-react';

const CartSummary = ({ showCheckoutButton = true }) => {
  const { state } = useContext(AppContext);
  const { cart } = state;

  const containerStyle = {
    backgroundColor: 'var(--sb-surface)',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid var(--sb-border)',
    position: 'sticky',
    top: '100px'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--sb-border)'
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--sb-text)',
    margin: 0
  };

  const summaryRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    fontSize: '14px',
    borderBottom: '1px solid var(--sb-border)'
  };

  const totalRowStyle = {
    ...summaryRowStyle,
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--sb-accent)',
    borderBottom: 'none',
    borderTop: '2px solid var(--sb-border)',
    paddingTop: '16px',
    marginTop: '8px'
  };

  const promoSectionStyle = {
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: 'var(--sb-bg)',
    borderRadius: '8px',
    border: '1px solid var(--sb-border)'
  };
  

  const checkoutButtonStyle = {
    width: '100%',
    padding: '16px',
    backgroundColor: 'var(--sb-accent)',
    color: 'var(--sb-accent-on)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '20px'
  };

  const benefitStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: 'var(--sb-bg)',
    borderRadius: '6px',
    marginBottom: '8px',
    fontSize: '13px',
    color: 'var(--sb-muted)'
  };

  const errorStyle = {
    color: 'var(--sb-error)',
    fontSize: '12px',
    marginTop: '4px'
  };

  const successStyle = {
    color: 'var(--sb-success)',
    fontSize: '12px',
    marginTop: '4px'
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Shipping is permanently free for the storefront
  const shipping = 0;
  // Tax disabled per user request
  const taxRate = 0.0;
  const tax = 0;
  const total = subtotal + shipping;

  // promo handlers removed

  if (cart.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--sb-muted)'
        }}>
          <ShoppingCart size={48} style={{ marginBottom: '16px', color: 'var(--sb-border)' }} />
          <h3 style={{
            fontSize: '18px',
            color: 'var(--sb-text)',
            marginBottom: '8px'
          }}>
            Your cart is empty
          </h3>
          <p style={{ fontSize: '14px', marginBottom: '20px' }}>
            Add some items to get started
          </p>
          <a
            href="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: 'var(--sb-accent)',
              color: 'var(--sb-accent-on)',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            Continue Shopping
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <ShoppingCart size={20} style={{ color: 'var(--sb-accent)' }} />
        <h3 style={titleStyle}>
          Cart Summary ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </h3>
      </div>

      {/* Shipping is always Free — no progress UI shown */}

      {/* Promo code removed from cart UI to match checkout experience */}

      {/* Price Breakdown */}
      <div>
        <div style={summaryRowStyle}>
          <span style={{ color: 'var(--sb-muted)' }}>Subtotal</span>
          <span style={{ color: 'var(--sb-text)' }}>${subtotal.toFixed(2)}</span>
        </div>
        
        <div style={summaryRowStyle}>
          <span style={{ color: 'var(--sb-muted)' }}>
            Shipping {shipping === 0 && '(Free)'}
          </span>
          <span style={{ color: 'var(--sb-text)' }}>
            {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        
        {/* Tax removed per user request */}
        
        {/* No promo/discounts shown in simplified UI */}
        
        <div style={totalRowStyle}>
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Benefits */}
      <div style={{ margin: '20px 0' }}>
        <div style={benefitStyle}>
          <CreditCard size={16} style={{ color: 'var(--sb-success)' }} />
          <span>Secure checkout with Card2Crypto</span>
        </div>
        <div style={benefitStyle}>
          <Gift size={16} style={{ color: 'var(--sb-success)' }} />
          <span>30-day return guarantee</span>
        </div>
      </div>

      {/* Checkout Button */}
      {showCheckoutButton && (
        <button
          style={checkoutButtonStyle}
          onClick={() => window.location.href = '/checkout'}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--sb-accent-700)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,77,64,0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--sb-accent)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Proceed to Checkout
          <ArrowRight size={18} />
        </button>
      )}
    </div>
  );
};

export default CartSummary;