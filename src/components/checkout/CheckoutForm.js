/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:07.963Z */
import React, { useState, useMemo } from 'react';
import ShippingForm from './ShippingForm';
import OrderSummary from './OrderSummary';

const CheckoutForm = ({ cartItems = [], onSubmit }) => {
  const [shippingInfo, setShippingInfo] = useState({});
  // promo code removed per product requirement
  const [error, setError] = useState(null);

  const handleShippingChange = (data) => {
    setShippingInfo(data || {});
    setError(null);
  };

  const totals = useMemo(() => {
    const items = (cartItems || []).map(i => {
      const price = Number(i.price_shipping_included ?? i.price ?? 0) || 0;
      const quantity = Number(i.quantity ?? 1) || 1;
      return { id: i.product_id ?? i.id ?? i.productId, name: i.name ?? i.title ?? i.productName, price, quantity };
    });
    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    // No shipping charges per new requirement
    const shipping = 0;
    const tax = 0;
    const promo = 0;
    const total = subtotal + shipping + tax - promo;
    return { items, subtotal, shipping, tax, promo, total };
  }, [cartItems]);

  const handleProceed = () => {
  // basic validation (no email/phone required)
  const required = ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode'];
    for (const k of required) {
      if (!shippingInfo || !String(shippingInfo[k] ?? '').trim()) {
        setError('Please complete all required shipping fields.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    const orderData = {
      ...shippingInfo,
      items: totals.items,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      tax: totals.tax,
      promo: totals.promo,
      total: totals.total
    };

    onSubmit(orderData);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 22.5rem', gap: 24 }}>
      <div>
        {error && <div style={{ marginBottom: 12, color: 'var(--sb-accent)', fontWeight: 600 }}>{error}</div>}

        <ShippingForm onShippingChange={handleShippingChange} initialData={{}} />

        {/* Promo code removed per request */}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <button onClick={handleProceed} style={{ backgroundColor: 'var(--sb-accent)', color: 'var(--sb-text)', padding: '0.75rem 1.25rem', borderRadius: 8, border: 'none', fontWeight: 700, cursor: 'pointer' }}>Proceed to Payment</button>
        </div>
      </div>

      <div>
  <OrderSummary cartItems={cartItems} shippingInfo={shippingInfo} />
      </div>
    </div>
  );
};

export default CheckoutForm;