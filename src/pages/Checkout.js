import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import CheckoutForm from '../components/checkout/CheckoutForm';
import PaymentForm from '../components/checkout/PaymentForm';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Lock } from 'lucide-react';

const Checkout = () => {
  const { cart: cartItems = [], clearCart } = useApp();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuth();

  // Defensive redirects in effects (avoid navigating during render)
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const orderTotal = useMemo(() => {
    return cartItems.reduce((sum, i) => {
      const price = Number(i.price_shipping_included ?? i.price ?? 0) || 0;
      const qty = Number(i.quantity ?? 1) || 1;
      return sum + price * qty;
    }, 0);
  }, [cartItems]);

  const handleCheckoutSubmit = (form) => {
    setOrderData(form);
    setCurrentStep(2);
  };

  // Payment handler called by PaymentForm. Returns { success, error }
  const handlePaymentSubmit = async (paymentData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // If client created a payment, verify it first with the backend
      if (paymentData && (paymentData.paymentId || paymentData.payment_id)) {
        const paymentId = paymentData.paymentId || paymentData.payment_id;
        const verifyResp = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ paymentId, amount: orderTotal, currency: 'USD' })
        });
        const verifyJson = await verifyResp.json().catch(() => ({}));
        if (!verifyResp.ok || !verifyJson.success) {
          const msg = verifyJson.error || 'Payment verification failed';
          setError(msg);
          setIsSubmitting(false);
          return { success: false, error: msg };
        }

        // Payment verified, submit checkout with only paymentId
        const checkoutPayload = {
          shippingAddress: orderData?.shippingAddress ?? orderData?.address ?? null,
          payment: {
            provider: paymentData.provider ?? paymentData.method ?? 'hoodpay',
            paymentId
          },
          items: cartItems.map((i) => ({ product_id: i.product_id ?? i.id ?? i.productId, quantity: Number(i.quantity ?? 1) }))
        };

        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(checkoutPayload)
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = json.error || 'Failed to complete checkout';
          setError(msg);
          setIsSubmitting(false);
          return { success: false, error: msg };
        }

        // Clear UI cart
        try { await clearCart(); } catch (e) { console.warn('clearCart failed', e); }

        try { localStorage.setItem('lastOrder', JSON.stringify({ createdAt: new Date().toISOString(), orders: json.orders || [] })); } catch (e) {}
        navigate('/order-confirmation');
        setIsSubmitting(false);
        return { success: true };
      }

      // Unified server-side checkout: send items + payment.token to /api/checkout
      const checkoutPayload = {
        shippingAddress: orderData?.shippingAddress ?? orderData?.address ?? null,
        payment: {
          provider: paymentData.provider ?? paymentData.method ?? 'hoodpay',
          token: paymentData.token
        },
        items: cartItems.map((i) => ({ product_id: i.product_id ?? i.id ?? i.productId, quantity: Number(i.quantity ?? 1) }))
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(checkoutPayload)
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json.error || 'Failed to complete checkout';
        setError(msg);
        setIsSubmitting(false);
        return { success: false, error: msg };
      }

      // Clear UI cart
      try { await clearCart(); } catch (e) { console.warn('clearCart failed', e); }

      // Persist last order locally for confirmation page
      try {
        localStorage.setItem('lastOrder', JSON.stringify({ createdAt: new Date().toISOString(), orders: json.orders || [] }));
      } catch (e) { /* ignore storage errors */ }

      // navigate to confirmation
      navigate('/order-confirmation');
      setIsSubmitting(false);
      return { success: true };
    } catch (err) {
      console.error('Checkout submit error:', err);
      setError('Network error');
      setIsSubmitting(false);
      return { success: false, error: 'Network error' };
    }
  };

  const steps = [
    { number: 1, title: 'Shipping & Billing' },
    { number: 2, title: 'Payment' },
    { number: 3, title: 'Confirmation' }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', paddingTop: 20, paddingBottom: 40 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Secure Checkout</h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#4ade80', fontSize: 14, fontWeight: 500 }}>
            <Lock size={16} />
            SSL Encrypted & Secure
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', maxWidth: 680 }}>
            {steps.map((s, idx) => (
              <React.Fragment key={s.number}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, margin: '0 auto', borderRadius: '50%', backgroundColor: currentStep >= s.number ? '#ff6b35' : '#404040', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                    {currentStep > s.number ? <CheckCircle size={18} /> : s.number}
                  </div>
                  <div style={{ marginTop: 8, color: currentStep >= s.number ? '#fff' : '#999', fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                </div>
                {idx < steps.length - 1 && <div style={{ width: 32, height: 2, backgroundColor: currentStep > s.number ? '#ff6b35' : '#404040' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ minHeight: 400 }}>
          {currentStep === 1 && (
            <CheckoutForm cartItems={cartItems} onSubmit={handleCheckoutSubmit} />
          )}

          {currentStep === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <button type="button" onClick={() => setCurrentStep(1)} style={{ background: 'none', border: '1px solid #666', color: '#ccc', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>← Back to Shipping</button>
              </div>

              <PaymentForm orderTotal={orderTotal} customerInfo={orderData} onPaymentSubmit={handlePaymentSubmit} isLoading={isSubmitting} />

              {error && <div style={{ marginTop: 12, color: '#ff6b35', textAlign: 'center' }}>{error}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;