import React from 'react';
import { Package, Truck, Shield } from 'lucide-react';

const OrderSummary = ({ cartItems = [], shippingInfo = {}, paymentMethod = null }) => {
  const cart = cartItems || [];

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

  

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => {
    const price = Number(item.price_shipping_included ?? item.price ?? 0) || 0;
    const qty = Number(item.quantity ?? 1) || 1;
    return sum + price * qty;
  }, 0);
  // No shipping charges per new requirement
  const shipping = 0;
  const total = subtotal + shipping;

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
        {cart.map((item) => {
          const name = item.name ?? item.title ?? item.productName ?? 'Product';
          const image = item.image ?? (item.images && item.images[0]) ?? '';
          const price = Number(item.price_shipping_included ?? item.price ?? 0) || 0;
          const qty = Number(item.quantity ?? 1) || 1;
          return (
            <div key={item.id ?? item.product_id ?? name} style={itemStyle}>
              <img src={image} alt={name} style={itemImageStyle} />
              <div style={itemInfoStyle}>
                <h4 style={itemNameStyle}>{name}</h4>
                <p style={itemDetailsStyle}>Qty: {qty} × ${price.toFixed(2)}</p>
              </div>
              <div style={priceStyle}>${(price * qty).toFixed(2)}</div>
            </div>
          );
        })}
      </div>

      {/* Promo code removed per request */}

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
          <span style={{ color: '#cccccc' }}>Shipping</span>
          <span style={{ color: '#ffffff' }}>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
        </div>
        
        {/* Tax removed per user request */}
        
        {/* No promo discounts shown in simplified UI */}
        
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