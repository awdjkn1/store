/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:07.975Z */
import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Shield, Lock, AlertCircle, CheckCircle, Phone } from 'lucide-react';

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
  const [fiatList, setFiatList] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const redirectTimerRef = useRef(null);
  const pollAbortRef = useRef(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Base for constructing public hosted-page URLs (falls back to Card2Crypto public API)
  const CARD2CRYPTO_PUBLIC_BASE = process.env.REACT_APP_CARD2CRYPTO_PUBLIC_BASE || 'https://api.card2crypto.org/v1';

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
        // Keep active fiat/fiat-like payment methods (e.g. card)
        setFiatList(Array.isArray(json.fiat) ? json.fiat.filter(f => f && f.active) : []);
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
        // Use Card2Crypto create endpoint which returns a hosted pay URL
        try {
          const resp = await fetch('/api/payments/card2crypto/create', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: orderTotal, currency: 'USD', email: customerInfo && customerInfo.email })
          });
          const json = await resp.json().catch(() => ({}));
          if (!resp.ok) {
            result = { success: false, error: json.error || 'Failed to initiate payment' };
          } else if (json.url) {
            await initiateRedirectWithPoll(json.orderId || null, json.url);
            return;
          } else {
            result = { success: false, error: 'No payment URL received from provider' };
          }
        } catch (e) {
          console.error('Card2Crypto create error', e);
          result = { success: false, error: 'Payment initiation failed' };
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
              const hostedUrl = `${CARD2CRYPTO_PUBLIC_BASE}/public/payments/hosted-page/${paymentId}`;
              await initiateRedirectWithPoll(paymentId, hostedUrl);
              return;
            }

            result = await onPaymentSubmit({ provider: 'card2crypto', method: 'crypto', hosted: hosted, paymentId, amount: orderTotal });
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
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--sb-surface)',
    border: '0.125rem solid var(--sb-border)',
    borderRadius: '0.5rem',
    color: 'var(--sb-text)',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s ease'
  };

  const errorInputStyle = {
    ...inputStyle,
    borderColor: 'var(--sb-error)',
    backgroundColor: 'var(--sb-bg)'
  };

  const labelStyle = {
    display: 'block',
    color: 'var(--sb-muted)',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '0.375rem'
  };

  return (
    <div style={{
      backgroundColor: 'var(--sb-bg)',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '0.0625rem solid var(--sb-border)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{
          color: 'var(--sb-text)',
          fontSize: '1.25rem',
          fontWeight: '600',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Shield size={20} style={{ color: 'var(--sb-accent)' }} />
          Payment Information
        </h3>
        <p style={{
                color: 'var(--sb-muted)',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}>
                <Lock size={14} />
                Secured by Card2Crypto.org - Your payment is converted to crypto securely
              </p>
      </div>

      {/* Payment Method Selection */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={labelStyle}>Payment Method</label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(12.5rem, 1fr))',
          gap: '0.75rem',
          marginTop: '0.5rem'
        }}>
          {(() => {
            // Merge server-provided fiat methods into the payment method tiles (avoid duplicates)
            const rendered = [...paymentMethods];
            if (Array.isArray(fiatList) && fiatList.length > 0) {
              fiatList.forEach(f => {
                if (!rendered.some(m => m.id === f.id)) {
                  rendered.push({ id: f.id, name: f.name || f.id, icon: CreditCard, description: f.description || '' });
                }
              });
            }

            return rendered.map((method) => {
              const IconComponent = method.icon || CreditCard;
              const isSelected = paymentMethod === method.id;

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    padding: '1rem',
                    backgroundColor: isSelected ? 'var(--sb-accent)' : 'var(--sb-surface)',
                    border: `0.125rem solid ${isSelected ? 'var(--sb-accent)' : 'var(--sb-border)'}`,
                    borderRadius: '0.5rem',
                    color: isSelected ? 'var(--sb-accent-on)' : 'var(--sb-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <IconComponent size={18} />
                  <div style={{ fontWeight: 700 }}>{method.name}</div>
                  {method.description && <div style={{ fontSize: 12, color: 'var(--sb-muted)' }}>{method.description}</div>}
                </button>
              );
            });
          })()}
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit}>
        {/* Card Payment Form (Hosted Checkout) */}
        {paymentMethod === 'card' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
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
                <div style={{ color: 'var(--sb-error)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={12} />
                  {errors.contact}
                </div>
              )}
              <div style={{ color: 'var(--sb-muted)', fontSize: 12, marginTop: 6 }}>
                We will verify this contact before creating the hosted card payment. Card details are collected on the provider's secure page.
              </div>
            </div>

            {/* 2FA removed — provider-hosted pages handle verification */}
          </div>
        )}

        

        {/* Crypto Payment Form */}
        {paymentMethod === 'crypto' && (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Choose cryptocurrency</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {cryptoList.length === 0 && <div style={{ color: 'var(--sb-muted)' }}>No cryptos available</div>}
                {cryptoList.map(c => (
                  <button key={c.symbol} type="button" onClick={() => setSelectedCrypto(c.symbol)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: 8, backgroundColor: selectedCrypto === c.symbol ? 'var(--sb-accent)' : 'var(--sb-surface)', color: 'var(--sb-text)', border: '0.0625rem solid var(--sb-border)', cursor: 'pointer' }}>
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
                <div style={{ color: 'var(--sb-error)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
            padding: '0.75rem',
            backgroundColor: 'var(--sb-bg)',
            border: '0.0625rem solid var(--sb-error)',
            borderRadius: '0.375rem',
            color: 'var(--sb-error)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '1rem'
          }}>
            <AlertCircle size={16} />
            {errors.submit}
          </div>
        )}

        {/* Success Message */}
        {paymentStatus === 'success' && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--sb-bg)',
            border: '0.0625rem solid var(--sb-success)',
            borderRadius: '0.375rem',
            color: 'var(--sb-success)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '1rem'
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
            padding: '1rem',
            backgroundColor: isProcessing || isLoading ? 'var(--sb-border)' : 'var(--sb-accent)',
            color: 'var(--sb-text)',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: isProcessing || isLoading ? 'not-allowed' : 'pointer',
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isProcessing && !isLoading) {
              e.currentTarget.style.backgroundColor = 'var(--sb-accent-400)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isProcessing && !isLoading) {
              e.currentTarget.style.backgroundColor = 'var(--sb-accent)';
            }
          }}
        >
          {isProcessing ? (
            <>
              <div style={{
                width: '1rem',
                height: '1rem',
                border: '0.125rem solid var(--sb-text)',
                borderTop: '0.125rem solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Processing Payment...
            </>
          ) : (
            <>
              <Shield size={16} style={{ color: 'var(--sb-accent)' }} />
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
                const built = `${CARD2CRYPTO_PUBLIC_BASE}/public/payments/hosted-page/${paymentId}`;
                await initiateRedirectWithPoll(paymentId, built);
                return;
              }

              // If parent provided a handler (for debugging or alternate flows), delegate to it.
              if (typeof onPaymentSubmit === 'function') {
                try {
                  // Let parent inspect the raw JSON (it may alert it)
                  await onPaymentSubmit({ provider: 'card2crypto', method: 'hosted', hosted: hosted, paymentId, amount: orderTotal });
                  return;
                } catch (e) {
                  // ignore - fall through to error state below
                }
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
            padding: '0.75rem',
            backgroundColor: 'var(--sb-surface)',
            color: 'var(--sb-text)',
            border: '0.0625rem solid var(--sb-border)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '0.75rem'
          }}
        >
          Pay via Hosted Checkout
        </button>
      </form>

      {/* Trust Badges */}
      <div style={{
        marginTop: '1.25rem',
        padding: '1rem',
        backgroundColor: 'var(--sb-surface)',
        borderRadius: '0.5rem',
        textAlign: 'center'
      }}>
        <div style={{
          color: 'var(--sb-muted)',
          fontSize: '0.75rem',
          marginBottom: '0.5rem'
        }}>
          Your payment is secured by industry-standard encryption
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: 'var(--sb-success)',
            fontSize: '0.75rem'
          }}>
            <Shield size={14} />
            SSL Secured
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: 'var(--sb-success)',
            fontSize: '0.75rem'
          }}>
            <Lock size={14} />
            PCI Compliant
          </div>
          <div style={{
            color: 'var(--sb-accent)',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            Powered by Card2Crypto.org
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
            backgroundColor: 'var(--sb-bg)',
            padding: 24,
            borderRadius: 12,
            border: '0.0625rem solid var(--sb-border)',
            color: 'var(--sb-text)',
            maxWidth: 560,
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{
                width: 28,
                height: 28,
                border: '0.1875rem solid var(--sb-text)',
                borderTop: '0.1875rem solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <h4 style={{ margin: 0 }}>Redirecting to hosted checkout…</h4>
            </div>
            <p style={{ color: 'var(--sb-muted)', marginTop: 12 }}>
              You will be redirected to the payment provider to complete the secure transaction. This may take a few seconds.
            </p>
            {redirectUrl && (
              <p style={{ marginTop: 8 }}>
                If you are not redirected, <a href={redirectUrl} style={{ color: 'var(--sb-accent)' }}>click here to continue</a>.
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
                style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--sb-border)', color: 'var(--sb-text)', border: 'none', borderRadius: 6, cursor: 'pointer' }}
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