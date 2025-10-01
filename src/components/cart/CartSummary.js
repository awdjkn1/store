import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { ShoppingCart, Tag, Truck, CreditCard, ArrowRight, Gift } from 'lucide-react';

const CartSummary = ({ showCheckoutButton = true, promoCode, onPromoCodeChange }) => {
  const { state } = useContext(AppContext);
  const { cart } = state;
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const containerStyle = {
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #444',
    position: 'sticky',
    top: '100px'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #444'
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0
  };

  const summaryRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    fontSize: '14px',
    borderBottom: '1px solid #333'
  };

  const totalRowStyle = {
    ...summaryRowStyle,
    fontSize: '18px',
    fontWeight: '700',
    color: '#ff6b35',
    borderBottom: 'none',
    borderTop: '2px solid #444',
    paddingTop: '16px',
    marginTop: '8px'
  };

  const promoSectionStyle = {
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    border: '1px solid #333'
  };

  const promoInputStyle = {
    display: 'flex',
    gap: '8px',
    marginTop: '8px'
  };

  const inputStyle = {
    flex: 1,
    padding: '10px 12px',
    backgroundColor: '#2d2d2d',
    border: '1px solid #444',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px'
  };

  const buttonStyle = {
    padding: '10px 16px',
    backgroundColor: '#ff6b35',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const checkoutButtonStyle = {
    width: '100%',
    padding: '16px',
    backgroundColor: '#ff6b35',
    color: '#ffffff',
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
    backgroundColor: '#1a1a1a',
    borderRadius: '6px',
    marginBottom: '8px',
    fontSize: '13px',
    color: '#cccccc'
  };

  const errorStyle = {
    color: '#dc3545',
    fontSize: '12px',
    marginTop: '4px'
  };

  const successStyle = {
    color: '#28a745',
    fontSize: '12px',
    marginTop: '4px'
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Shipping calculation
  const freeShippingThreshold = 100;
  const standardShipping = 15;
  const shipping = subtotal >= freeShippingThreshold ? 0 : standardShipping;
  
  // Tax calculation (8%)
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  
  // Promo code discount
  const validPromoCodes = {
    'SAVE10': 0.1,
    'WELCOME15': 0.15,
    'SAVE20': 0.2
  };
  
  const promoDiscount = promoCode && validPromoCodes[promoCode] 
    ? subtotal * validPromoCodes[promoCode] 
    : 0;
  
  const total = subtotal + shipping + tax - promoDiscount;
  
  const remainingForFreeShipping = freeShippingThreshold - subtotal;

  const handlePromoApply = () => {
    const upperPromo = promoInput.toUpperCase();
    
    if (!upperPromo) {
      setPromoError('Please enter a promo code');
      return;
    }
    
    if (validPromoCodes[upperPromo]) {
      setPromoError('');
      onPromoCodeChange?.(upperPromo);
      setPromoInput('');
    } else {
      setPromoError('Invalid promo code');
    }
  };

  const handlePromoRemove = () => {
    onPromoCodeChange?.('');
    setPromoError('');
  };

  if (cart.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#888'
        }}>
          <ShoppingCart size={48} color="#444" style={{ marginBottom: '16px' }} />
          <h3 style={{
            fontSize: '18px',
            color: '#ffffff',
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
              backgroundColor: '#ff6b35',
              color: '#ffffff',
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
        <ShoppingCart size={20} color="#ff6b35" />
        <h3 style={titleStyle}>
          Cart Summary ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </h3>
      </div>

      {/* Free Shipping Progress */}
      {shipping > 0 && (
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <Truck size={16} color="#ff6b35" />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
              Free Shipping
            </span>
          </div>
          <p style={{
            fontSize: '13px',
            color: '#cccccc',
            margin: '0 0 8px 0'
          }}>
            Add ${remainingForFreeShipping.toFixed(2)} more for free shipping
          </p>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#333',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%`,
              height: '100%',
              backgroundColor: '#ff6b35',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {/* Promo Code Section */}
      <div style={promoSectionStyle}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <Tag size={16} color="#ff6b35" />
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
            Promo Code
          </span>
        </div>
        
        {promoCode ? (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            backgroundColor: '#28a745',
            borderRadius: '6px',
            marginTop: '8px'
          }}>
            <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
              {promoCode} Applied ✓
            </span>
            <button
              onClick={handlePromoRemove}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <div style={promoInputStyle}>
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                style={inputStyle}
                onKeyPress={(e) => e.key === 'Enter' && handlePromoApply()}
              />
              <button 
                onClick={handlePromoApply}
                style={buttonStyle}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e55a2e'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ff6b35'}
              >
                Apply
              </button>
            </div>
            {promoError && <div style={errorStyle}>{promoError}</div>}
            <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
              Try: SAVE10, WELCOME15, SAVE20
            </div>
          </>
        )}
      </div>

      {/* Price Breakdown */}
      <div>
        <div style={summaryRowStyle}>
          <span style={{ color: '#cccccc' }}>Subtotal</span>
          <span style={{ color: '#ffffff' }}>${subtotal.toFixed(2)}</span>
        </div>
        
        <div style={summaryRowStyle}>
          <span style={{ color: '#cccccc' }}>
            Shipping {shipping === 0 && '(Free)'}
          </span>
          <span style={{ color: '#ffffff' }}>
            {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        
        <div style={summaryRowStyle}>
          <span style={{ color: '#cccccc' }}>Tax (8%)</span>
          <span style={{ color: '#ffffff' }}>${tax.toFixed(2)}</span>
        </div>
        
        {promoDiscount > 0 && (
          <div style={summaryRowStyle}>
            <span style={{ color: '#28a745' }}>
              Discount ({Math.round(validPromoCodes[promoCode] * 100)}%)
            </span>
            <span style={{ color: '#28a745' }}>-${promoDiscount.toFixed(2)}</span>
          </div>
        )}
        
        <div style={totalRowStyle}>
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Benefits */}
      <div style={{ margin: '20px 0' }}>
        <div style={benefitStyle}>
          <CreditCard size={16} color="#28a745" />
          <span>Secure checkout with HoodPay</span>
        </div>
        <div style={benefitStyle}>
          <Gift size={16} color="#28a745" />
          <span>30-day return guarantee</span>
        </div>
      </div>

      {/* Checkout Button */}
      {showCheckoutButton && (
        <button
          style={checkoutButtonStyle}
          onClick={() => window.location.href = '/checkout'}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#e55a2e';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 25px rgba(255, 107, 53, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#ff6b35';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
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