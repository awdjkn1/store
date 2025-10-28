import React, { useState, useEffect } from 'react';
import { CreditCard, Shield, Lock, AlertCircle, CheckCircle, Phone, Building2 } from 'lucide-react';
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
  const [bankData, setBankData] = useState({
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking'
  });
  const [mobileData, setMobileData] = useState({
    phoneNumber: '',
    provider: 'mpesa'
  });
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Payment method options
  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, American Express'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: Building2,
      description: 'Direct bank account transfer'
    },
    {
      id: 'mobile',
      name: 'Mobile Money',
      icon: Phone,
      description: 'M-Pesa, MTN Mobile Money'
    }
  ];

  useEffect(() => {
    if (onPaymentMethodChange) {
      onPaymentMethodChange(paymentMethod);
    }
  }, [paymentMethod, onPaymentMethodChange]);

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

  const validateBank = () => {
    const newErrors = {};
    
    if (!bankData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }
    if (!bankData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    }
    if (!bankData.routingNumber.trim()) {
      newErrors.routingNumber = 'Routing number is required';
    }

    return newErrors;
  };

  const validateMobile = () => {
    const newErrors = {};
    
    if (!mobileData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(mobileData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    return newErrors;
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

  const handleBankInputChange = (field, value) => {
    setBankData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMobileInputChange = (field, value) => {
    setMobileData(prev => ({ ...prev, [field]: value }));
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
  case 'bank':
    validationErrors = validateBank();
    break;
  case 'mobile':
    validationErrors = validateMobile();
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
        // Prefer creating the payment client-side using the HoodPay client if available.
        // This avoids sending PAN to our server. If unavailable, fall back to client
        // tokenization, then server tokenization.
        let handled = false;

        try {
          const client = await hoodpayClient.ensureHoodPay();
          if (client && client.payments && typeof client.payments.create === 'function') {
            try {
              // Assumption: provider expects amount in minor units (cents). If your
              // provider expects major units, remove the *100.
              const amountMinor = Math.round((orderTotal || 0) * 100);
              const currency = process.env.REACT_APP_HOODPAY_CURRENCY || 'USD';

              const paymentPayload = {
                amount: amountMinor,
                currency,
                name: `Order Payment`,
                // Pass card details — SDK will handle PCI-sensitive transmission
                card: {
                  number: cardData.cardNumber.replace(/\s/g, ''),
                  expiry: cardData.expiryDate,
                  cvv: cardData.cvv,
                  name: cardData.cardholderName
                }
              };

              const paymentResp = await client.payments.create(paymentPayload);

              // If provider returned a payment object, pass it to parent so backend
              // can reconcile (store order, verify via webhook, etc.). We send the
              // raw provider response to let server decide verification strategy.
              if (paymentResp && (paymentResp.id || paymentResp.payment_id || (paymentResp.data && paymentResp.data.id))) {
                const paymentId = paymentResp.id || paymentResp.payment_id || (paymentResp.data && paymentResp.data.id);
                result = await onPaymentSubmit({ provider: 'hoodpay', paymentId, amount: orderTotal });
                handled = true;
              } else {
                // If paymentResp doesn't contain an id, fall back to tokenization below
                console.warn('HoodPay client created payment but no id found, falling back to tokenization', paymentResp);
              }
            } catch (e) {
              console.warn('Client-side HoodPay payment creation failed, falling back to tokenization', e && e.message);
            }
          }
        } catch (e) {
          console.warn('Failed to initialize HoodPay client, will fallback to tokenization', e && e.message);
        }

        if (!handled) {
          // Try client tokenization (SDK may expose tokenization helper)
          let tokenToUse = null;
          try {
            const sdkToken = await hoodpayClient.createToken({
              number: cardData.cardNumber.replace(/\s/g, ''),
              expiry: cardData.expiryDate,
              cvv: cardData.cvv,
              name: cardData.cardholderName
            });
            if (sdkToken && (sdkToken.token || sdkToken.id)) tokenToUse = sdkToken.token || sdkToken.id;
            else if (sdkToken && typeof sdkToken === 'string') tokenToUse = sdkToken;
          } catch (e) {
            console.warn('Client-side HoodPay SDK tokenization failed, falling back to server tokenization', e && e.message);
          }

            if (!tokenToUse) {
              // No server-side tokenization fallback: require client SDK to create payment.
              setErrors({ submit: 'Card tokenization failed — please use Hosted Checkout or try again.' });
              setIsProcessing(false);
              return;
            }

            // If SDK returned only a token (not a full paymentId), our server-side
            // flow no longer accepts raw tokens. Ask user to use hosted checkout
            // or upgrade the SDK to return a payment (paymentId) from client.
            setErrors({ submit: 'SDK returned a token but server requires a client-created paymentId. Use Hosted Checkout or update the SDK to create payments client-side.' });
            setIsProcessing(false);
            return;
        }
      } else if (paymentMethod === 'bank') {
        // For bank or mobile, send minimal data (server can call provider)
        result = await onPaymentSubmit({ provider: 'hoodpay', method: 'bank', bank: bankData, amount: orderTotal });
      } else if (paymentMethod === 'mobile') {
        result = await onPaymentSubmit({ provider: 'hoodpay', method: 'mobile', mobile: mobileData, amount: orderTotal });
      }

      if (result && result.success) {
        setPaymentStatus('success');
      } else {
        setPaymentStatus('error');
        setErrors({ submit: (result && result.error) || 'Payment failed. Please try again.' });
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
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
        {/* Card Payment Form */}
        {paymentMethod === 'card' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardData.cardNumber}
                onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                maxLength={19}
                style={errors.cardNumber ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
                onBlur={(e) => !errors.cardNumber && (e.target.style.borderColor = '#404040')}
              />
              {errors.cardNumber && (
                <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} />
                  {errors.cardNumber}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={cardData.expiryDate}
                  onChange={(e) => handleCardInputChange('expiryDate', e.target.value)}
                  maxLength={5}
                  style={errors.expiryDate ? errorInputStyle : inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
                  onBlur={(e) => !errors.expiryDate && (e.target.style.borderColor = '#404040')}
                />
                {errors.expiryDate && (
                  <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} />
                    {errors.expiryDate}
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  value={cardData.cvv}
                  onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                  maxLength={4}
                  style={errors.cvv ? errorInputStyle : inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
                  onBlur={(e) => !errors.cvv && (e.target.style.borderColor = '#404040')}
                />
                {errors.cvv && (
                  <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} />
                    {errors.cvv}
                  </div>
                )}
              </div>
            </div>

            <div>
                    <label style={labelStyle}>Cardholder Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={cardData.cardholderName}
                onChange={(e) => handleCardInputChange('cardholderName', e.target.value)}
                style={errors.cardholderName ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
                onBlur={(e) => !errors.cardholderName && (e.target.style.borderColor = '#404040')}
              />
              {errors.cardholderName && (
                <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} />
                  {errors.cardholderName}
                </div>
              )}
            </div>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#e0e0e0',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={cardData.saveCard}
                onChange={(e) => setCardData(prev => ({ ...prev, saveCard: e.target.checked }))}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#ff6b35'
                }}
              />
              Save card for future purchases
            </label>
          </div>
        )}

        {/* Bank Transfer Form */}
        {paymentMethod === 'bank' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Bank Name</label>
              <input
                type="text"
                placeholder="Chase Bank"
                value={bankData.bankName}
                onChange={(e) => handleBankInputChange('bankName', e.target.value)}
                style={errors.bankName ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
                onBlur={(e) => !errors.bankName && (e.target.style.borderColor = '#404040')}
              />
              {errors.bankName && (
                <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} />
                  {errors.bankName}
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Account Number</label>
              <input
                type="text"
                placeholder="1234567890"
                value={bankData.accountNumber}
                onChange={(e) => handleBankInputChange('accountNumber', e.target.value)}
                style={errors.accountNumber ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
                onBlur={(e) => !errors.accountNumber && (e.target.style.borderColor = '#404040')}
              />
              {errors.accountNumber && (
                <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} />
                  {errors.accountNumber}
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Routing Number</label>
              <input
                type="text"
                placeholder="123456789"
                value={bankData.routingNumber}
                onChange={(e) => handleBankInputChange('routingNumber', e.target.value)}
                style={errors.routingNumber ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
                onBlur={(e) => !errors.routingNumber && (e.target.style.borderColor = '#404040')}
              />
              {errors.routingNumber && (
                <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} />
                  {errors.routingNumber}
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Account Type</label>
              <select
                value={bankData.accountType}
                onChange={(e) => handleBankInputChange('accountType', e.target.value)}
                style={{
                  ...inputStyle,
                  cursor: 'pointer'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
                onBlur={(e) => e.target.style.borderColor = '#404040'}
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
          </div>
        )}

        {/* Mobile Money Form */}
        {paymentMethod === 'mobile' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Mobile Provider</label>
              <select
                value={mobileData.provider}
                onChange={(e) => handleMobileInputChange('provider', e.target.value)}
                style={{
                  ...inputStyle,
                  cursor: 'pointer'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
                onBlur={(e) => e.target.style.borderColor = '#404040'}
              >
                <option value="mpesa">M-Pesa</option>
                <option value="mtn">MTN Mobile Money</option>
                <option value="airtel">Airtel Money</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Phone Number</label>
              <input
                type="tel"
                placeholder="+254 712 345 678"
                value={mobileData.phoneNumber}
                onChange={(e) => handleMobileInputChange('phoneNumber', e.target.value)}
                style={errors.phoneNumber ? errorInputStyle : inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
                onBlur={(e) => !errors.phoneNumber && (e.target.style.borderColor = '#404040')}
              />
              {errors.phoneNumber && (
                <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} />
                  {errors.phoneNumber}
                </div>
              )}
            </div>
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
                window.location.href = redirectUrl;
                return;
              }

              if (paymentId) {
                // Best-effort fallback: navigate to public hosted-page endpoint
                const built = `${(process.env.REACT_APP_HOODPAY_PUBLIC_BASE || 'https://api.hoodpay.io/v1')}/public/payments/hosted-page/${paymentId}`;
                window.location.href = built;
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

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PaymentForm;