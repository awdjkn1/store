import React, { useState, useEffect } from 'react';

const PaymentForm = ({ orderData, onPaymentComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState('hoodpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [hoodpayLoaded, setHoodpayLoaded] = useState(false);

  // Initialize HoodPay
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://hoodpay.io/js/hoodpay.js'; // Replace with actual HoodPay script URL
    script.async = true;
    script.onload = () => {
      setHoodpayLoaded(true);
      // Initialize HoodPay with your API key
      if (window.HoodPay) {
        window.HoodPay.configure({
          apiKey: process.env.REACT_APP_HOODPAY_API_KEY || 'your-api-key-here',
          environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox'
        });
      }
    };
    script.onerror = () => {
      setPaymentError('Failed to load HoodPay payment processor');
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const processHoodPayPayment = async () => {
    try {
      setIsProcessing(true);
      setPaymentError('');

      if (!window.HoodPay) {
        throw new Error('HoodPay is not loaded');
      }

      // Create payment payload
      const paymentPayload = {
        amount: orderData.total * 100, // Convert to cents
        currency: 'USD',
        order_id: `ORDER-${Date.now()}`,
        customer: {
          email: orderData.email,
          first_name: orderData.firstName,
          last_name: orderData.lastName,
          phone: orderData.phone
        },
        billing_address: {
          street: orderData.sameAsShipping ? orderData.address : orderData.billingAddress,
          city: orderData.sameAsShipping ? orderData.city : orderData.billingCity,
          state: orderData.sameAsShipping ? orderData.state : orderData.billingState,
          zip: orderData.sameAsShipping ? orderData.zipCode : orderData.billingZipCode,
          country: orderData.sameAsShipping ? orderData.country : orderData.billingCountry
        },
        shipping_address: {
          street: orderData.address,
          city: orderData.city,
          state: orderData.state,
          zip: orderData.zipCode,
          country: orderData.country
        },
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price * 100, // Convert to cents
          sku: item.id
        })),
        success_url: `${window.location.origin}/order-confirmation`,
        cancel_url: `${window.location.origin}/checkout`,
        webhook_url: `${process.env.REACT_APP_API_URL || ''}/api/webhooks/hoodpay`
      };

      // Process payment with HoodPay
      const result = await window.HoodPay.createPayment(paymentPayload);

      if (result.success) {
        // Payment successful
        onPaymentComplete({
          paymentId: result.payment_id,
          status: 'completed',
          method: 'hoodpay',
          transactionId: result.transaction_id
        });
      } else {
        throw new Error(result.error_message || 'Payment failed');
      }

    } catch (error) {
      console.error('HoodPay payment error:', error);
      setPaymentError(error.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processCryptoPayment = async () => {
    try {
      setIsProcessing(true);
      setPaymentError('');

      // Simulate crypto payment processing
      // In a real implementation, you would integrate with HoodPay's crypto payment API
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing delay

      // Mock successful crypto payment
      onPaymentComplete({
        paymentId: `CRYPTO-${Date.now()}`,
        status: 'completed',
        method: 'crypto',
        transactionId: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      });

    } catch (error) {
      console.error('Crypto payment error:', error);
      setPaymentError('Crypto payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (paymentMethod === 'hoodpay') {
      await processHoodPayPayment();
    } else if (paymentMethod === 'crypto') {
      await processCryptoPayment();
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#2d2d2d',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #404040'
      }}>
        <h2 style={{
          color: '#fff',
          marginBottom: '24px',
          fontSize: '24px',
          fontWeight: '600',
          textAlign: 'center'
        }}>
          Complete Your Payment
        </h2>

        {/* Order Summary */}
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid #404040'
        }}>
          <h3 style={{
            color: '#fff',
            marginBottom: '12px',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            Order Summary
          </h3>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ color: '#ccc', fontSize: '14px' }}>
              Subtotal ({orderData.items.length} items):
            </span>
            <span style={{ color: '#fff', fontSize: '14px' }}>
              ${orderData.subtotal.toFixed(2)}
            </span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ color: '#ccc', fontSize: '14px' }}>Shipping:</span>
            <span style={{ color: '#fff', fontSize: '14px' }}>
              ${orderData.shipping.toFixed(2)}
            </span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <span style={{ color: '#ccc', fontSize: '14px' }}>Tax:</span>
            <span style={{ color: '#fff', fontSize: '14px' }}>
              ${orderData.tax.toFixed(2)}
            </span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid #404040'
          }}>
            <span style={{
              color: '#fff',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Total:
            </span>
            <span style={{
              color: '#ff6b35',
              fontSize: '18px',
              fontWeight: '700'
            }}>
              ${orderData.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            color: '#fff',
            marginBottom: '16px',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            Select Payment Method
          </h3>

          {/* HoodPay Option */}
          <div style={{
            border: `2px solid ${paymentMethod === 'hoodpay' ? '#ff6b35' : '#404040'}`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backgroundColor: paymentMethod === 'hoodpay' ? '#ff6b3510' : 'transparent'
          }}
          onClick={() => setPaymentMethod('hoodpay')}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="radio"
                  value="hoodpay"
                  checked={paymentMethod === 'hoodpay'}
                  onChange={() => setPaymentMethod('hoodpay')}
                  style={{
                    marginRight: '12px',
                    accentColor: '#ff6b35'
                  }}
                />
                <div>
                  <h4 style={{
                    color: '#fff',
                    margin: '0 0 4px 0',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    HoodPay
                  </h4>
                  <p style={{
                    color: '#ccc',
                    margin: '0',
                    fontSize: '14px'
                  }}>
                    Secure payment processing with multiple payment options
                  </p>
                </div>
              </div>
              <div style={{
                backgroundColor: '#ff6b35',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                RECOMMENDED
              </div>
            </div>
          </div>

          {/* Crypto Payment Option */}
          <div style={{
            border: `2px solid ${paymentMethod === 'crypto' ? '#ff6b35' : '#404040'}`,
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backgroundColor: paymentMethod === 'crypto' ? '#ff6b3510' : 'transparent'
          }}
          onClick={() => setPaymentMethod('crypto')}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center'
            }}>
              <input
                type="radio"
                value="crypto"
                checked={paymentMethod === 'crypto'}
                onChange={() => setPaymentMethod('crypto')}
                style={{
                  marginRight: '12px',
                  accentColor: '#ff6b35'
                }}
              />
              <div>
                <h4 style={{
                  color: '#fff',
                  margin: '0 0 4px 0',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  Cryptocurrency
                </h4>
                <p style={{
                  color: '#ccc',
                  margin: '0',
                  fontSize: '14px'
                }}>
                  Pay with Bitcoin, Ethereum, or other supported cryptocurrencies
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        {paymentError && (
          <div style={{
            backgroundColor: '#ff444420',
            border: '1px solid #ff4444',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <p style={{
              color: '#ff4444',
              margin: '0',
              fontSize: '14px'
            }}>
              ⚠️ {paymentError}
            </p>
          </div>
        )}

        {!hoodpayLoaded && paymentMethod === 'hoodpay' && (
          <div style={{
            backgroundColor: '#ff6b3520',
            border: '1px solid #ff6b35',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <p style={{
              color: '#ff6b35',
              margin: '0',
              fontSize: '14px'
            }}>
              ⏳ Loading HoodPay payment processor...
            </p>
          </div>
        )}

        {/* Security Notice */}
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid #404040'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{
              fontSize: '20px',
              marginRight: '8px'
            }}>
              🔒
            </span>
            <h4 style={{
              color: '#fff',
              margin: '0',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Secure Payment
            </h4>
          </div>
          <p style={{
            color: '#ccc',
            margin: '0',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            Your payment information is encrypted and secure. We never store your payment details on our servers.
          </p>
        </div>

        {/* Process Payment Button */}
        <button
          onClick={handlePayment}
          disabled={isProcessing || (paymentMethod === 'hoodpay' && !hoodpayLoaded)}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isProcessing ? '#cc5429' : '#ff6b35',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isProcessing || (paymentMethod === 'hoodpay' && !hoodpayLoaded) ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: isProcessing || (paymentMethod === 'hoodpay' && !hoodpayLoaded) ? 0.7 : 1,
            position: 'relative'
          }}
        >
          {isProcessing ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #ffffff30',
                borderTop: '2px solid #ffffff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '8px'
              }}></div>
              Processing Payment...
            </span>
          ) : (
            `Pay $${orderData.total.toFixed(2)} with ${paymentMethod === 'hoodpay' ? 'HoodPay' : 'Crypto'}`
          )}
        </button>

        {/* Payment Methods Accepted */}
        <div style={{
          textAlign: 'center',
          marginTop: '16px'
        }}>
          <p style={{
            color: '#999',
            fontSize: '12px',
            marginBottom: '8px'
          }}>
            We accept:
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            {['Visa', 'MasterCard', 'PayPal', 'Bitcoin', 'Ethereum'].map(method => (
              <span
                key={method}
                style={{
                  backgroundColor: '#404040',
                  color: '#ccc',
                  fontSize: '10px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: '600'
                }}
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CSS for spinner animation */}
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