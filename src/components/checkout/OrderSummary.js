/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:07.967Z */
import React from 'react';
import { Package, Truck, Shield } from 'lucide-react';

const OrderSummary = ({ cartItems = [], shippingInfo = {}, paymentMethod = null }) => {
  const cart = cartItems || [];

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

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 0',
    borderBottom: '0.0625rem solid var(--sb-border)'
  };

  const itemImageStyle = {
    width: '3.125rem',
    height: '3.125rem',
    borderRadius: '0.375rem',
    objectFit: 'cover',
    border: '0.0625rem solid var(--sb-border)'
  };

  const itemInfoStyle = {
    flex: 1,
    minWidth: 0
  };

  const itemNameStyle = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--sb-text)',
    margin: '0 0 0.25rem 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  };

  const itemDetailsStyle = {
    fontSize: '0.75rem',
    color: 'var(--sb-muted)',
    margin: 0
  };

  const priceStyle = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--sb-accent)'
  };

  const summaryRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    fontSize: '0.875rem'
  };

  const totalRowStyle = {
    ...summaryRowStyle,
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--sb-accent)',
    borderTop: '0.0625rem solid var(--sb-border)',
    paddingTop: '1rem',
    marginTop: '1rem'
  };

  const sectionStyle = {
    marginBottom: '1.25rem',
    paddingBottom: '1rem',
    borderBottom: '0.0625rem solid var(--sb-border)'
  };

  const sectionTitleStyle = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--sb-accent)',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const infoTextStyle = {
    fontSize: '0.8125rem',
    color: 'var(--sb-muted)',
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
        <Package size={20} style={{ color: 'var(--sb-accent)' }} />
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
            {paymentMethod === 'card2crypto' && '🔒 Card2Crypto Secure Payment'}
            {paymentMethod === 'card' && '💳 Credit/Debit Card'}
            {paymentMethod === 'bank' && '🏦 Bank Transfer'}
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div>
        <div style={summaryRowStyle}>
          <span style={{ color: 'var(--sb-muted)' }}>Subtotal</span>
          <span style={{ color: 'var(--sb-text)' }}>${subtotal.toFixed(2)}</span>
        </div>
        
        <div style={summaryRowStyle}>
          <span style={{ color: 'var(--sb-muted)' }}>Shipping</span>
          <span style={{ color: 'var(--sb-text)' }}>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
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
        backgroundColor: 'var(--sb-bg)',
        border: '0.0625rem solid var(--sb-border)',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        marginTop: '1.25rem',
        textAlign: 'center'
      }}>
        <Shield size={16} style={{ color: 'var(--sb-success)', marginBottom: '0.25rem' }} />
        <div style={{ fontSize: '0.75rem', color: 'var(--sb-success)', fontWeight: '600' }}>
          Secure 256-bit SSL Encryption
        </div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--sb-muted)' }}>
          Your payment information is protected
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;