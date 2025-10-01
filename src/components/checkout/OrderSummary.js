import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Package, Truck, Shield, Tag } from 'lucide-react';

const OrderSummary = ({ shippingInfo, paymentMethod, promoCode }) => {
  const { state } = useContext(AppContext);
  const { cart } = state;

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

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid #444'
  };

  const itemImageStyle = {
    width: '50px',
    height: '50px',
    borderRadius: '6px',
    objectFit: 'cover',
    border: '1px solid #555'
  };

  const itemInfoStyle = {
    flex: 1,
    minWidth: 0
  };

  const itemNameStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 4px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  };

  const itemDetailsStyle = {
    fontSize: '12px',
    color: '#cccccc',
    margin: 0
  };

  const priceStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ff6b35'
  };

  const summaryRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    fontSize: '14px'
  };

  const totalRowStyle = {
    ...summaryRowStyle,
    fontSize: '18px',
    fontWeight: '700',
    color: '#ff6b35',
    borderTop: '1px solid #444',
    paddingTop: '16px',
    marginTop: '16px'
  };

  const sectionStyle = {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #444'
  };

  const sectionTitleStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ff6b35',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const infoTextStyle = {
    fontSize: '13px',
    color: '#cccccc',
    lineHeight: '1.4'
  };

  const promoInputStyle = {
    display: 'flex',
    gap: '8px',
    marginTop: '12px'
  };

  const inputStyle = {
    flex: 1,
    padding: '10px 12px',
    backgroundColor: '#1a1a1a',
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

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 15;
  const tax = subtotal * 0.08; // 8% tax
  const promoDiscount = promoCode ? subtotal * 0.1 : 0; // 10% discount if promo applied
  const total = subtotal + shipping + tax - promoDiscount;

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <Package size={20} color="#ff6b35" />
        <h3 style={titleStyle}>Order Summary</h3>
      </div>

      {/* Cart Items */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <span>Items ({cart.length})</span>
        </div>
        {cart.map((item) => (
          <div key={item.id} style={itemStyle}>
            <img 
              src={item.image} 
              alt={item.name}
              style={itemImageStyle}
            />
            <div style={itemInfoStyle}>
              <h4 style={itemNameStyle}>{item.name}</h4>
              <p style={itemDetailsStyle}>
                Qty: {item.quantity} × ${item.price.toFixed(2)}
              </p>
            </div>
            <div style={priceStyle}>
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <Tag size={16} />
          Promo Code
        </div>
        {promoCode ? (
          <div style={infoTextStyle}>
            ✅ Code "{promoCode}" applied (10% off)
          </div>
        ) : (
          <div style={promoInputStyle}>
            <input
              type="text"
              placeholder="Enter promo code"
              style={inputStyle}
            />
            <button 
              style={buttonStyle}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e55a2e'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ff6b35'}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Shipping Information */}
      {shippingInfo && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <Truck size={16} />
            Shipping To
          </div>
          <div style={infoTextStyle}>
            {shippingInfo.firstName} {shippingInfo.lastName}<br />
            {shippingInfo.address}<br />
            {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}<br />
            {shippingInfo.country}
          </div>
        </div>
      )}

      {/* Payment Method */}
      {paymentMethod && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <Shield size={16} />
            Payment Method
          </div>
          <div style={infoTextStyle}>
            {paymentMethod === 'hoodpay' && '🔒 HoodPay Secure Payment'}
            {paymentMethod === 'card' && '💳 Credit/Debit Card'}
            {paymentMethod === 'bank' && '🏦 Bank Transfer'}
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div>
        <div style={summaryRowStyle}>
          <span style={{ color: '#cccccc' }}>Subtotal</span>
          <span style={{ color: '#ffffff' }}>${subtotal.toFixed(2)}</span>
        </div>
        
        <div style={summaryRowStyle}>
          <span style={{ color: '#cccccc' }}>
            Shipping {subtotal > 100 && '(Free over $100)'}
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
            <span style={{ color: '#28a745' }}>Discount (10%)</span>
            <span style={{ color: '#28a745' }}>-${promoDiscount.toFixed(2)}</span>
          </div>
        )}
        
        <div style={totalRowStyle}>
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Security Badge */}
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '12px',
        marginTop: '20px',
        textAlign: 'center'
      }}>
        <Shield size={16} color="#28a745" style={{ marginBottom: '4px' }} />
        <div style={{ fontSize: '12px', color: '#28a745', fontWeight: '600' }}>
          Secure 256-bit SSL Encryption
        </div>
        <div style={{ fontSize: '11px', color: '#888' }}>
          Your payment information is protected
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;