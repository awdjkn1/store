/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:09.286Z */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, Mail, Download, Home } from 'lucide-react';

const OrderConfirmation = () => {
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get order data from localStorage
    const orderData = localStorage.getItem('lastOrder');
    
    if (!orderData) {
      // If no order data, redirect to home
      navigate('/');
      return;
    }

    try {
      const parsedOrder = JSON.parse(orderData);
      setOrder(parsedOrder);
      
      // Clear the order data after loading (optional)
      // localStorage.removeItem('lastOrder');
    } catch (error) {
      console.error('Error parsing order data:', error);
      navigate('/');
    }
  }, [navigate]);

  const downloadInvoice = () => {
    // In a real app, this would generate and download a PDF invoice
    alert('Invoice download would be implemented with a PDF generation service');
  };

  if (!order) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
          <div style={{
            color: 'var(--sb-text)',
            textAlign: 'center'
          }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            border: '0.25rem solid var(--sb-accent)',
            borderTop: '0.25rem solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.25rem'
          }} />
          <p>Loading your order confirmation...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--sb-bg)',
      paddingTop: '2.5rem',
      paddingBottom: '2.5rem'
    }}>
      <div style={{
        maxWidth: '50rem',
        margin: '0 auto',
        padding: '0 1.25rem'
      }}>
        {/* Success Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2.5rem'
        }}>
          <div style={{
            backgroundColor: 'rgba(42,182,115,0.12)',
            borderRadius: '50%',
            padding: '1.25rem',
            display: 'inline-flex',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle size={60} style={{ color: 'var(--sb-success)' }} />
          </div>
          
          <h1 style={{
            color: 'var(--sb-text)',
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '0.75rem'
          }}>
            Order Confirmed!
          </h1>
          
          <p style={{
            color: 'var(--sb-muted)',
            fontSize: '1.125rem',
            marginBottom: '0.5rem'
          }}>
            Thank you for your purchase, {order.firstName}!
          </p>
          
          <p style={{
            color: 'var(--sb-success)',
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            Order #{order.id}
          </p>
        </div>

        {/* Order Status */}
          <div style={{
          backgroundColor: 'var(--sb-surface)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '0.0625rem solid var(--sb-border)'
        }}>
          <h2 style={{
            color: 'var(--sb-text)',
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1.25rem'
          }}>
            Order Status
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(12.5rem, 1fr))',
            gap: '1.25rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
                <div style={{
                backgroundColor: 'var(--sb-success)',
                borderRadius: '50%',
                padding: '0.5rem',
                display: 'flex'
              }}>
                <CheckCircle size={20} style={{ color: 'var(--sb-accent-on)' }} />
              </div>
              <div>
                <p style={{
                  color: 'var(--sb-text)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  margin: '0 0 0.25rem 0'
                }}>
                  Payment Confirmed
                </p>
                <p style={{
                  color: 'var(--sb-muted)',
                  fontSize: '0.75rem',
                  margin: '0'
                }}>
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                backgroundColor: 'var(--sb-accent)',
                borderRadius: '50%',
                padding: '0.5rem',
                display: 'flex'
              }}>
                <Package size={20} style={{ color: 'var(--sb-accent-on)' }} />
              </div>
              <div>
                <p style={{
                  color: 'var(--sb-text)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  margin: '0 0 0.25rem 0'
                }}>
                  Processing
                </p>
                <p style={{
                  color: 'var(--sb-muted)',
                  fontSize: '0.75rem',
                  margin: '0'
                }}>
                  1-2 business days
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              opacity: 0.6
            }}>
                <div style={{
                backgroundColor: 'var(--sb-border)',
                borderRadius: '50%',
                padding: '0.5rem',
                display: 'flex'
              }}>
                <Truck size={20} style={{ color: 'var(--sb-accent-on)' }} />
              </div>
              <div>
                <p style={{
                  color: 'var(--sb-text)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  margin: '0 0 0.25rem 0'
                }}>
                  Shipped
                </p>
                <p style={{
                  color: 'var(--sb-muted)',
                  fontSize: '0.75rem',
                  margin: '0'
                }}>
                  Estimated: {formatDate(estimatedDelivery)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div style={{
          backgroundColor: 'var(--sb-surface)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '0.0625rem solid var(--sb-border)'
        }}>
          <h2 style={{
            color: 'var(--sb-text)',
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1.25rem'
          }}>
            Order Details
          </h2>

          {/* Items */}
          <div style={{ marginBottom: '1.25rem' }}>
            {order.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '0.0625rem solid var(--sb-border)'
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: '3.75rem',
                    height: '3.75rem',
                    objectFit: 'cover',
                    borderRadius: '0.5rem'
                  }}
                />
                
                <div style={{ flex: 1 }}>
                  <p style={{
                    color: 'var(--sb-text)',
                    fontSize: '1rem',
                    fontWeight: '600',
                    margin: '0 0 0.25rem 0'
                  }}>
                    {item.name}
                  </p>
                  <p style={{
                      color: 'var(--sb-muted)',
                    fontSize: '0.875rem',
                    margin: '0'
                  }}>
                    Quantity: {item.quantity}
                  </p>
                </div>
                
                <p style={{
                    color: 'var(--sb-accent)',
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: '0'
                }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Order Total */}
            <div style={{
              borderTop: '0.0625rem solid var(--sb-border)',
              paddingTop: '1rem'
            }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: 'var(--sb-muted)', fontSize: '0.875rem' }}>Subtotal:</span>
              <span style={{ color: 'var(--sb-text)', fontSize: '0.875rem' }}>
                ${order.subtotal.toFixed(2)}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: 'var(--sb-muted)', fontSize: '0.875rem' }}>Shipping:</span>
              <span style={{ color: 'var(--sb-text)', fontSize: '0.875rem' }}>
                ${order.shipping.toFixed(2)}
              </span>
            </div>

            {/* Tax removed per user request */}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '0.75rem',
              borderTop: '0.0625rem solid var(--sb-border)'
            }}>
              <span style={{
                color: 'var(--sb-text)',
                fontSize: '1.125rem',
                fontWeight: '600'
              }}>
                Total:
              </span>
              <span style={{
                color: 'var(--sb-accent)',
                fontSize: '1.125rem',
                fontWeight: '700'
              }}>
                ${(order.subtotal + order.shipping).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping & Payment Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(18.75rem, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          {/* Shipping Address */}
          <div style={{
            backgroundColor: 'var(--sb-surface)',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            border: '0.0625rem solid var(--sb-border)'
          }}>
            <h3 style={{
              color: 'var(--sb-text)',
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              Shipping Address
            </h3>
            <p style={{
              color: 'var(--sb-muted)',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              margin: '0'
            }}>
              {order.firstName} {order.lastName}<br />
              {order.address}<br />
              {order.city}, {order.state} {order.zipCode}<br />
              {order.country}
            </p>
          </div>

          {/* Payment Method */}
          <div style={{
            backgroundColor: 'var(--sb-surface)',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            border: '0.0625rem solid var(--sb-border)'
          }}>
            <h3 style={{
              color: 'var(--sb-text)',
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              Payment Method
            </h3>
            <p style={{
              color: 'var(--sb-muted)',
              fontSize: '0.875rem',
              margin: '0 0 0.5rem 0'
            }}>
              {['card2crypto'].includes(order.payment.method) ? 'Card2Crypto' : 'Cryptocurrency'}
            </p>
            <p style={{
              color: 'var(--sb-muted)',
              fontSize: '0.75rem',
              margin: '0'
            }}>
              Transaction ID: {order.payment.transactionId}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(12.5rem, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={downloadInvoice}
            style={{
              backgroundColor: 'var(--sb-accent)',
              color: 'var(--sb-accent-on)',
              border: 'none',
              padding: '0.875rem 1.25rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-accent-700)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--sb-accent)'}
          >
            <Download size={16} />
            Download Invoice
          </button>

          <Link
            to="/products"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--sb-text)',
              border: '0.0625rem solid var(--sb-border)',
              padding: '0.875rem 1.25rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--sb-accent)';
              e.currentTarget.style.color = 'var(--sb-accent)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--sb-border)';
              e.currentTarget.style.color = 'var(--sb-text)';
            }}
          >
            Continue Shopping
          </Link>

          <Link
            to="/"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--sb-muted)',
              border: '0.0625rem solid var(--sb-border)',
              padding: '0.875rem 1.25rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--sb-muted)';
              e.currentTarget.style.color = 'var(--sb-text)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--sb-border)';
              e.currentTarget.style.color = 'var(--sb-muted)';
            }}
          >
            <Home size={16} />
            Back to Home
          </Link>
        </div>

        {/* Email Confirmation */}
        <div style={{
          backgroundColor: 'rgba(32,35,39,0.06)',
          border: '0.0625rem solid var(--sb-border)',
          borderRadius: '0.5rem',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <Mail size={20} style={{ color: 'var(--sb-success)' }} />
            <p style={{
              color: 'var(--sb-success)',
              fontSize: '0.875rem',
              fontWeight: '600',
              margin: '0'
            }}>
              Confirmation Email Sent
            </p>
          </div>
          <p style={{
            color: 'var(--sb-muted)',
            fontSize: '0.875rem',
            margin: '0'
          }}>
            We've sent a confirmation email to <strong>{order.email}</strong> with your order details and tracking information.
          </p>
        </div>

        {/* CSS for spinner animation */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default OrderConfirmation;