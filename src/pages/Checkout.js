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

  // Payment handler called by PaymentForm. Replaced with debug helper to surface
  // backend JSON errors in an alert so the server's exact response can be inspected.
  const handlePaymentSubmit = async (paymentData) => {
    try {
      const response = await fetch('/api/checkout/process-payment', { // or /api/payments/hosted
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for sending your login cookie
        body: JSON.stringify({
          // Send your cart data
          amount: 1.00, // Example amount
          currency: "USD"
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) { // We're checking for 'url'
        // SUCCESS!
        window.location.href = data.url;
      } else {
        // FAILURE: Show the JSON error from the backend
        alert("Backend Error:\n\n" + JSON.stringify(data, null, 2));
      }

    } catch (error) {
      alert("Network Error:\n\n" + error.message);
    }
  };

  const steps = [
    { number: 1, title: 'Shipping & Billing' },
    { number: 2, title: 'Payment' },
    { number: 3, title: 'Confirmation' }
  ];

  return (
  <div style={{ minHeight: '100vh', backgroundColor: 'var(--sb-bg)', paddingTop: 20, paddingBottom: 40 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ color: 'var(--sb-text)', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Secure Checkout</h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--sb-success)', fontSize: 14, fontWeight: 500 }}>
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
                  <div style={{ width: 44, height: 44, margin: '0 auto', borderRadius: '50%', backgroundColor: currentStep >= s.number ? 'var(--sb-accent)' : 'var(--sb-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sb-accent-on)', fontWeight: 700 }}>
                    {currentStep > s.number ? <CheckCircle size={18} /> : s.number}
                  </div>
                  <div style={{ marginTop: 8, color: currentStep >= s.number ? 'var(--sb-text)' : 'var(--sb-muted)', fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                </div>
                {idx < steps.length - 1 && <div style={{ width: 32, height: 2, backgroundColor: currentStep > s.number ? 'var(--sb-accent)' : 'var(--sb-border)' }} />}
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
                <button type="button" onClick={() => setCurrentStep(1)} style={{ background: 'none', border: '1px solid var(--sb-border)', color: 'var(--sb-muted)', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>← Back to Shipping</button>
              </div>

              <PaymentForm orderTotal={orderTotal} customerInfo={orderData} onPaymentSubmit={handlePaymentSubmit} isLoading={isSubmitting} />

              {error && <div style={{ marginTop: 12, color: 'var(--sb-accent)', textAlign: 'center' }}>{error}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;