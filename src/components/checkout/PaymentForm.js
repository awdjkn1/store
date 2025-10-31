import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Shield, Lock, AlertCircle, CheckCircle, Phone } from 'lucide-react';
import hoodpayClient from '../../utils/hoodpayClient';

const PaymentForm = ({ 
  onPaymentSubmit, 
  orderTotal, 
  isLoading, 
  onPaymentMethodChange,
  customerInfo 
}) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    saveCard: false
  });
  const [contactInfo, setContactInfo] = useState({ phone: '', email: '' });
  // two-factor UI removed — verification handled by provider/hosted pages
  const [cryptoList, setCryptoList] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const redirectTimerRef = useRef(null);
  const pollAbortRef = useRef(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Base for constructing public hosted-page URLs (falls back to HoodPay public API)
  const HOODPAY_PUBLIC_BASE = process.env.REACT_APP_HOODPAY_PUBLIC_BASE || 'https://api.hoodpay.io/v1';

  // Payment method options
  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, American Express'
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      icon: Lock,
      description: 'Bitcoin, Ethereum, USDT, and more'
    },
  ];


  useEffect(() => {
    if (onPaymentMethodChange) {
      onPaymentMethodChange(paymentMethod);
    }
  }, [paymentMethod, onPaymentMethodChange]);

  useEffect(() => {
    // fetch available cryptos from backend
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('/api/payments/crypto/available', { credentials: 'include' });
        if (!resp.ok) return;
        const json = await resp.json();
        if (!mounted) return;
        // Keep only active cryptos (respecting user's request to use active crypto only)
        setCryptoList(Array.isArray(json.cryptos) ? json.cryptos.filter(c => c && c.active) : []);
      } catch (e) {
        // ignore fetch errors; UI will simply show empty list
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Validation functions
  const validateCard = () => {
    const newErrors = {};
    
    // Card number validation (simplified)
    if (!cardData.cardNumber.replace(/\s/g, '')) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cardData.cardNumber.replace(/\s/g, '').length < 13) {
      newErrors.cardNumber = 'Invalid card number';
    }

    // Expiry date validation
    if (!cardData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      const [month, year] = cardData.expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      if (!month || !year || month < 1 || month > 12) {
        newErrors.expiryDate = 'Invalid expiry date';
      } else if (parseInt(year) < currentYear || 
                 (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiryDate = 'Card has expired';
      }
    }

    // CVV validation
    if (!cardData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (cardData.cvv.length < 3) {
      newErrors.cvv = 'Invalid CVV';
    }

    // Cardholder name validation
    if (!cardData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    return newErrors;
  };

  // Helper: poll server/provider until hosted payment resource is present, then redirect.
  const initiateRedirectWithPoll = async (paymentIdentifier, url) => {
    try {
      setRedirectUrl(url);
      setIsRedirecting(true);
      // Prepare AbortController for poll requests
      const ac = new AbortController();
      pollAbortRef.current = ac;

      // If we have a provider id, poll for up to ~4 seconds to confirm creation.
      if (paymentIdentifier) {
        const maxAttempts = 8;
        const delayMs = 500;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (ac.signal.aborted) break;
          try {
            const resp = await fetch(`/api/payments/hosted/status?paymentId=${encodeURIComponent(paymentIdentifier)}`, { credentials: 'include', signal: ac.signal });
            if (resp.ok) {
              // hosted resource exists; proceed to redirect
              break;
            }
          } catch (e) {
            // swallow and retry
          }
          // wait before next attempt
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }

      // Finally, navigate after a tiny delay so overlay is visible
      redirectTimerRef.current = setTimeout(() => {
        try { window.location.href = url; } catch (e) { console.warn('Redirect failed', e); }
      }, 120);
    } catch (e) {
      console.warn('initiateRedirectWithPoll failed', e && e.message);
      // fallback: just navigate
      try { window.location.href = url; } catch (err) {}
    }
  };

  



  // Input handlers
  const handleCardInputChange = (field, value) => {
    let formattedValue = value;

    // Format card number
    if (field === 'cardNumber') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    
    // Format expiry date
    if (field === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').replace(/^(\d{2})/, '$1/').substr(0, 5);
    }

    // Format CVV
    if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substr(0, 4);
    }

    setCardData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };


  

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let validationErrors = {};
    
    switch (paymentMethod) {
      case 'card':
        validationErrors = validateCard();
        break;
      case 'crypto':
        // No validation needed for crypto selection
        break;
      default:
        validationErrors = { submit: 'Unsupported payment method selected.' };
    }


    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsProcessing(true);
    setErrors({});

    try {
      let result;

      if (paymentMethod === 'card') {
        // Card hosted checkout flow (server-side). We no longer require 2FA to
        // initiate the hosted card payment here — the provider will handle
        // verification/3DS on their hosted page. (2FA UI remains optional.)
        try {
          const resp = await fetch('/api/payments/card/initiate', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: orderTotal, currency: 'USD' })
          });
          const json = await resp.json().catch(() => ({}));
          if (!resp.ok) {
            result = { success: false, error: json.error || 'Failed to initiate card payment' };
          } else if (json.url) {
            await initiateRedirectWithPoll(json.paymentId, json.url);
            return;
          } else {
            const hosted = json.hosted || json;
            const redirectUrl = hosted && (hosted.hosted_page_url || hosted.hosted_url || hosted.url || hosted.redirect_url || (hosted.data && hosted.data.hosted_page_url));
            const paymentId = hosted && (hosted.id || hosted.payment_id || (hosted.data && hosted.data.id));
            if (redirectUrl) {
              const paymentIdentifier = paymentId || (hosted && (hosted.id || hosted.payment_id || (hosted.data && hosted.data.id)));
              await initiateRedirectWithPoll(paymentIdentifier, redirectUrl);
              return;
            }
            // Fallback: if provider returned an id but not a redirect URL, build
            // the public hosted-page URL format and navigate there.
            if (paymentId) {
              const hostedUrl = `${HOODPAY_PUBLIC_BASE}/public/payments/hosted-page/${paymentId}`;
              await initiateRedirectWithPoll(paymentId, hostedUrl);
              return;
            }

            // Last fallback: hand to parent callback for custom handling
            result = await onPaymentSubmit({ provider: 'hoodpay', method: 'card', hosted: hosted, paymentId, amount: orderTotal });
          }
        } catch (e) {
          console.error('Card initiate error', e);
          result = { success: false, error: 'Card initiation failed' };
        }
      
      } else if (paymentMethod === 'crypto') {
        if (!selectedCrypto) {
          setErrors({ submit: 'Please select a cryptocurrency to proceed.' });
          setIsProcessing(false);
          return;
        }
        try {
          const resp = await fetch('/api/payments/crypto/initiate', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: orderTotal, currency: 'USD', asset: selectedCrypto })
          });
          const json = await resp.json().catch(() => ({}));
          if (!resp.ok) {
            result = { success: false, error: json.error || 'Failed to initiate crypto payment' };
          } else if (json.url) {
            await initiateRedirectWithPoll(json.paymentId, json.url);
            return;
          } else {
            const hosted = json.hosted || json;
            const redirectUrl = hosted && (hosted.hosted_page_url || hosted.hosted_url || hosted.url || hosted.redirect_url || (hosted.data && hosted.data.hosted_page_url));
            const paymentId = hosted && (hosted.id || hosted.payment_id || (hosted.data && hosted.data.id));
            if (redirectUrl) {
              const paymentIdentifier = paymentId || (hosted && (hosted.id || hosted.payment_id || (hosted.data && hosted.data.id)));
              await initiateRedirectWithPoll(paymentIdentifier, redirectUrl);
              return;
            }
            // Fallback: if provider returned an id but not a redirect URL, build
            // the public hosted-page URL format and navigate there.
            if (paymentId) {
              const hostedUrl = `${HOODPAY_PUBLIC_BASE}/public/payments/hosted-page/${paymentId}`;
              await initiateRedirectWithPoll(paymentId, hostedUrl);
              return;
            }

            result = await onPaymentSubmit({ provider: 'hoodpay', method: 'crypto', hosted: hosted, paymentId, amount: orderTotal });
          }
        } catch (e) {
          console.error('Crypto initiate error', e);
          result = { success: false, error: 'Crypto initiation failed' };
        }
      }
      if (result && result.error) {
        setErrors({ submit: result.error });
      }
    } catch (e) {
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#2d2d2d',
    border: '2px solid #404040',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease'
  };

  const errorInputStyle = {
    ...inputStyle,
    borderColor: '#dc2626',
    backgroundColor: '#1a0f0f'
  };

  const labelStyle = {
    display: 'block',
    color: '#e0e0e0',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '6px'
  };

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #333333'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{
          color: '#ffffff',
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Shield size={20} color="#ff6b35" />
          Payment Information
        </h3>
        <p style={{
          color: '#a0a0a0',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Lock size={14} />
          Secured by HoodPay.io - Your payment is safe and encrypted
        </p>
      </div>

      {/* Payment Method Selection */}
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Payment Method</label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '8px'
        }}>
          {paymentMethods.map((method) => {
            const IconComponent = method.icon;
            const isSelected = paymentMethod === method.id;
            
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id)}
                style={{
                  padding: '16px',
                  backgroundColor: isSelected ? '#ff6b35' : '#2d2d2d',
                  border: `2px solid ${isSelected ? '#ff6b35' : '#404040'}`,
                  borderRadius: '8px',
                  color: isSelected ? '#ffffff' : '#e0e0e0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.target.style.backgroundColor = '#333333';
                    e.target.style.borderColor = '#ff6b35';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.target.style.backgroundColor = '#2d2d2d';
                    e.target.style.borderColor = '#404040';
                  }
                }}
              >
                <IconComponent size={24} />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{method.name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>
                    {method.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit}>
        {/* Card Payment Form (Hosted Checkout) */}
        {paymentMethod === 'card' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Phone or Email (for verification)</label>
              <input
                type="text"
                placeholder="+1 555 555 5555 or you@example.com"
                value={contactInfo.phone || contactInfo.email}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.includes('@')) setContactInfo(prev => ({ ...prev, email: v, phone: '' }));
                  else setContactInfo(prev => ({ ...prev, phone: v, email: '' }));
                }}
                style={inputStyle}
              />
              {errors.contact && (
                <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} />
                  {errors.contact}
                </div>
              )}
              <div style={{ color: '#a0a0a0', fontSize: 12, marginTop: 6 }}>
                We will verify this contact before creating the hosted card payment. Card details are collected on the provider's secure page.
              </div>
            </div>

            {/* 2FA removed — provider-hosted pages handle verification */}
          </div>
        )}

        

        {/* Crypto Payment Form */}
        {paymentMethod === 'crypto' && (
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Choose cryptocurrency</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {cryptoList.length === 0 && <div style={{ color: '#888' }}>No cryptos available</div>}
                {cryptoList.map(c => (
                  <button key={c.symbol} type="button" onClick={() => setSelectedCrypto(c.symbol)}
                    style={{ padding: '8px 12px', borderRadius: 8, backgroundColor: selectedCrypto === c.symbol ? '#ff6b35' : '#2d2d2d', color: '#fff', border: '1px solid #444', cursor: 'pointer' }}>
                    {c.symbol} {c.active ? '' : '(inactive)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Phone or Email (for verification)</label>
              <input
                type="text"
                placeholder="+1 555 555 5555 or you@example.com"
                value={contactInfo.phone || contactInfo.email}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.includes('@')) setContactInfo(prev => ({ ...prev, email: v, phone: '' }));
                  else setContactInfo(prev => ({ ...prev, phone: v, email: '' }));
                }}
                style={inputStyle}
              />
              {errors.contact && (
                <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} />
                  {errors.contact}
                </div>
              )}
            </div>

            {/* 2FA Controls reused for crypto */}
            {/* 2FA removed — provider-hosted pages handle verification */}
          </div>
        )}

        

        {/* Submit Error */}
        {errors.submit && (
          <div style={{
            padding: '12px',
            backgroundColor: '#1a0f0f',
            border: '1px solid #dc2626',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px'
          }}>
            <AlertCircle size={16} />
            {errors.submit}
          </div>
        )}

        {/* Success Message */}
        {paymentStatus === 'success' && (
          <div style={{
            padding: '12px',
            backgroundColor: '#0f1a0f',
            border: '1px solid #22c55e',
            borderRadius: '6px',
            color: '#22c55e',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px'
          }}>
            <CheckCircle size={16} />
            Payment processed successfully!
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing || isLoading}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: isProcessing || isLoading ? '#666666' : '#ff6b35',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isProcessing || isLoading ? 'not-allowed' : 'pointer',
            marginTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isProcessing && !isLoading) {
              e.target.style.backgroundColor = '#e55a2b';
            }
          }}
          onMouseLeave={(e) => {
            if (!isProcessing && !isLoading) {
              e.target.style.backgroundColor = '#ff6b35';
            }
          }}
        >
          {isProcessing ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Processing Payment...
            </>
          ) : (
            <>
              <Shield size={16} />
              Pay ${orderTotal?.toFixed(2)} Securely
            </>
          )}
        </button>

        {/* Hosted Checkout Button */}
        <button
          type="button"
          disabled={isProcessing || isLoading}
          onClick={async () => {
            // Create hosted payment on server and redirect user
            setIsProcessing(true);
            setErrors({});
            try {
              const resp = await fetch('/api/payments/hosted', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: orderTotal, currency: 'USD' })
              });
              const json = await resp.json().catch(() => ({}));
              if (!resp.ok) {
                setErrors({ submit: json.error || 'Failed to create hosted payment' });
                setIsProcessing(false);
                return;
              }

              const hosted = json.hosted || json;
              // Try common fields for redirect URL
              const redirectUrl = hosted && (hosted.hosted_page_url || hosted.hosted_url || hosted.url || hosted.redirect_url || (hosted.data && hosted.data.hosted_page_url));
              const paymentId = hosted && (hosted.id || hosted.payment_id || (hosted.data && hosted.data.id));

              if (redirectUrl) {
                const paymentIdentifier = paymentId || (hosted && (hosted.id || hosted.payment_id || (hosted.data && hosted.data.id)));
                await initiateRedirectWithPoll(paymentIdentifier, redirectUrl);
                return;
              }

              if (paymentId) {
                // Best-effort fallback: navigate to public hosted-page endpoint
                const built = `${HOODPAY_PUBLIC_BASE}/public/payments/hosted-page/${paymentId}`;
                await initiateRedirectWithPoll(paymentId, built);
                return;
              }

              setErrors({ submit: 'Could not determine hosted checkout URL from provider response' });
            } catch (e) {
              console.error('Hosted checkout error', e);
              setErrors({ submit: 'Hosted checkout failed' });
            } finally {
              setIsProcessing(false);
            }
          }}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#222',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '12px'
          }}
        >
          Pay via Hosted Checkout
        </button>
      </form>

      {/* Trust Badges */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#2d2d2d',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <div style={{
          color: '#a0a0a0',
          fontSize: '12px',
          marginBottom: '8px'
        }}>
          Your payment is secured by industry-standard encryption
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#22c55e',
            fontSize: '12px'
          }}>
            <Shield size={14} />
            SSL Secured
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#22c55e',
            fontSize: '12px'
          }}>
            <Lock size={14} />
            PCI Compliant
          </div>
          <div style={{
            color: '#ff6b35',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            Powered by HoodPay.io
          </div>
        </div>
      </div>

      {/* Redirect overlay shown when sending user to hosted checkout */}
      {isRedirecting && (
        <div style={{
          position: 'fixed',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            backgroundColor: '#111',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #333',
            color: '#fff',
            maxWidth: 560,
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{
                width: 28,
                height: 28,
                border: '3px solid #fff',
                borderTop: '3px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <h4 style={{ margin: 0 }}>Redirecting to hosted checkout…</h4>
            </div>
            <p style={{ color: '#cfcfcf', marginTop: 12 }}>
              You will be redirected to the payment provider to complete the secure transaction. This may take a few seconds.
            </p>
            {redirectUrl && (
              <p style={{ marginTop: 8 }}>
                If you are not redirected, <a href={redirectUrl} style={{ color: '#ff6b35' }}>click here to continue</a>.
              </p>
            )}

            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  // Cancel redirect: abort pending timer/poll and restore UI
                  try { if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current); } catch (e) {}
                  try { if (pollAbortRef.current) pollAbortRef.current.abort(); } catch (e) {}
                  setIsRedirecting(false);
                  setRedirectUrl(null);
                  setIsProcessing(false);
                }}
                style={{ padding: '8px 12px', backgroundColor: '#444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default PaymentForm;