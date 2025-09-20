import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";   // ✅ use hook instead of AppContext
import CheckoutForm from "../components/checkout/CheckoutForm";
import PaymentForm from "../components/checkout/PaymentForm";
import { CheckCircle, Lock } from "lucide-react";

const Checkout = () => {
  const { state, dispatch } = useApp();   // ✅ replaced useContext(AppContext)
  const navigate = useNavigate();
  const { cartItems } = state;

  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);

  // Redirect if cart is empty
  if (cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  const handleCheckoutSubmit = (formData) => {
    setOrderData(formData);
    setCurrentStep(2);
  };

  const handlePaymentComplete = (paymentData) => {
    setPaymentResult(paymentData);
    
    // Clear cart
    dispatch({ type: 'CLEAR_CART' });
    
    // Create order record (in a real app, this would be saved to backend)
    const order = {
      id: `ORDER-${Date.now()}`,
      ...orderData,
      payment: paymentData,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    // Store order in localStorage for order confirmation page
    localStorage.setItem('lastOrder', JSON.stringify(order));
    
    // Redirect to confirmation page
    navigate('/order-confirmation');
  };

  const steps = [
    { number: 1, title: 'Shipping & Billing', description: 'Enter your information' },
    { number: 2, title: 'Payment', description: 'Complete your purchase' },
    { number: 3, title: 'Confirmation', description: 'Order complete' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      paddingTop: '20px',
      paddingBottom: '40px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            color: '#fff',
            fontSize: '32px',
            fontWeight: '700',
            marginBottom: '8px'
          }}>
            Secure Checkout
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: '#4ade80',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <Lock size={16} />
            SSL Encrypted & Secure
          </div>
        </div>

        {/* Progress Steps */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '40px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            maxWidth: '600px',
            width: '100%'
          }}>
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: currentStep >= step.number ? '#ff6b35' : '#404040',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    transition: 'all 0.3s ease'
                  }}>
                    {currentStep > step.number ? (
                      <CheckCircle size={20} />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{
                      color: currentStep >= step.number ? '#fff' : '#999',
                      fontSize: '14px',
                      fontWeight: '600',
                      margin: '0 0 2px 0'
                    }}>
                      {step.title}
                    </p>
                    <p style={{
                      color: '#999',
                      fontSize: '12px',
                      margin: '0'
                    }}>
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: currentStep > step.number ? '#ff6b35' : '#404040',
                    margin: '0 10px',
                    marginTop: '-20px',
                    transition: 'all 0.3s ease'
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div style={{ minHeight: '500px' }}>
          {currentStep === 1 && (
            <CheckoutForm 
              cartItems={cartItems}
              onSubmit={handleCheckoutSubmit}
            />
          )}

          {currentStep === 2 && orderData && (
            <div>
              {/* Back Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => setCurrentStep(1)}
                  style={{
                    background: 'none',
                    border: '1px solid #666',
                    color: '#ccc',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.borderColor = '#ff6b35';
                    e.target.style.color = '#ff6b35';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.borderColor = '#666';
                    e.target.style.color = '#ccc';
                  }}
                >
                  ← Back to Shipping
                </button>
              </div>

              <PaymentForm 
                orderData={orderData}
                onPaymentComplete={handlePaymentComplete}
              />
            </div>
          )}
        </div>

        {/* Security Features */}
        <div style={{
          marginTop: '40px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          maxWidth: '800px',
          margin: '40px auto 0'
        }}>
          {[
            {
              icon: '🔒',
              title: 'Secure Payments',
              description: 'Your payment information is encrypted and protected'
            },
            {
              icon: '🚚',
              title: 'Fast Shipping',
              description: 'Free shipping on orders over $100'
            },
            {
              icon: '↩️',
              title: 'Easy Returns',
              description: '30-day return policy on all items'
            },
            {
              icon: '💬',
              title: '24/7 Support',
              description: 'Get help whenever you need it'
            }
          ].map((feature, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#2d2d2d',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #404040',
                textAlign: 'center'
              }}
            >
              <div style={{
                fontSize: '24px',
                marginBottom: '8px'
              }}>
                {feature.icon}
              </div>
              <h4 style={{
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                margin: '0 0 4px 0'
              }}>
                {feature.title}
              </h4>
              <p style={{
                color: '#ccc',
                fontSize: '12px',
                margin: '0',
                lineHeight: '1.4'
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #404040'
        }}>
          <p style={{
            color: '#999',
            fontSize: '12px',
            marginBottom: '10px'
          }}>
            Trusted by thousands of customers worldwide
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            {[
              'Norton Secured',
              'SSL Certificate',
              'McAfee Secure',
              'Trusted Shop',
              'Money Back Guarantee'
            ].map(badge => (
              <span
                key={badge}
                style={{
                  backgroundColor: '#404040',
                  color: '#ccc',
                  fontSize: '10px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: '600'
                }}
              >
                ✓ {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;