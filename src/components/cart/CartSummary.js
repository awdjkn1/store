/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:07.958Z */
import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { ShoppingCart, Truck, CreditCard, ArrowRight, Gift } from 'lucide-react';

const CartSummary = ({ showCheckoutButton = true }) => {
  const { state } = useContext(AppContext);
  const { cart } = state;

  const containerStyle = {
    backgroundColor: 'var(--sb-surface)',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    border: '0.0625rem solid var(--sb-border)',
    position: 'sticky',
    top: '6.25rem'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    marginBottom: '1.25rem',
    paddingBottom: '1rem',
    borderBottom: '0.0625rem solid var(--sb-border)'
  };

  const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--sb-text)',
    margin: 0
  };

  const summaryRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    fontSize: '0.875rem',
    borderBottom: '0.0625rem solid var(--sb-border)'
  };

  const totalRowStyle = {
    ...summaryRowStyle,
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--sb-accent)',
    borderBottom: 'none',
    borderTop: '0.125rem solid var(--sb-border)',
    paddingTop: '1rem',
    marginTop: '0.5rem'
  };

  const promoSectionStyle = {
    marginBottom: '1.25rem',
    padding: '1rem',
    backgroundColor: 'var(--sb-bg)',
    borderRadius: '0.5rem',
    border: '0.0625rem solid var(--sb-border)'
  };
  

  const checkoutButtonStyle = {
    width: '100%',
    padding: '1rem',
    backgroundColor: 'var(--sb-accent)',
    color: 'var(--sb-accent-on)',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginTop: '1.25rem'
  };

  const benefitStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: 'var(--sb-bg)',
    borderRadius: '0.375rem',
    marginBottom: '0.5rem',
    fontSize: '0.8125rem',
    color: 'var(--sb-muted)'
  };

  const errorStyle = {
    color: 'var(--sb-error)',
    fontSize: '0.75rem',
    marginTop: '0.25rem'
  };

  const successStyle = {
    color: 'var(--sb-success)',
    fontSize: '0.75rem',
    marginTop: '0.25rem'
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
          padding: '2.5rem 1.25rem',
          color: 'var(--sb-muted)'
        }}>
          <ShoppingCart size={48} style={{ marginBottom: '1rem', color: 'var(--sb-border)' }} />
          <h3 style={{
            fontSize: '1.125rem',
            color: 'var(--sb-text)',
            marginBottom: '0.5rem'
          }}>
            Your cart is empty
          </h3>
          <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Add some items to get started
          </p>
          <a
            href="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--sb-accent)',
              color: 'var(--sb-accent-on)',
              textDecoration: 'none',
              borderRadius: '0.5rem',
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
      <div style={{ margin: '1.25rem 0' }}>
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
            e.currentTarget.style.transform = 'translateY(-0.125rem)';
            e.currentTarget.style.boxShadow = '0 0.5rem 1.5625rem rgba(0,77,64,0.25)';
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