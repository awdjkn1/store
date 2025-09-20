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
          color: '#fff',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #ff6b35',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
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
      backgroundColor: '#1a1a1a',
      paddingTop: '40px',
      paddingBottom: '40px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        {/* Success Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <div style={{
            backgroundColor: '#4ade8020',
            borderRadius: '50%',
            padding: '20px',
            display: 'inline-flex',
            marginBottom: '20px'
          }}>
            <CheckCircle size={60} color="#4ade80" />
          </div>
          
          <h1 style={{
            color: '#fff',
            fontSize: '32px',
            fontWeight: '700',
            marginBottom: '12px'
          }}>
            Order Confirmed!
          </h1>
          
          <p style={{
            color: '#ccc',
            fontSize: '18px',
            marginBottom: '8px'
          }}>
            Thank you for your purchase, {order.firstName}!
          </p>
          
          <p style={{
            color: '#4ade80',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            Order #{order.id}
          </p>
        </div>

        {/* Order Status */}
        <div style={{
          backgroundColor: '#2d2d2d',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #404040'
        }}>
          <h2 style={{
            color: '#fff',
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '20px'
          }}>
            Order Status
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                backgroundColor: '#4ade80',
                borderRadius: '50%',
                padding: '8px',
                display: 'flex'
              }}>
                <CheckCircle size={20} color="#fff" />
              </div>
              <div>
                <p style={{
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  Payment Confirmed
                </p>
                <p style={{
                  color: '#ccc',
                  fontSize: '12px',
                  margin: '0'
                }}>
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                backgroundColor: '#ff6b35',
                borderRadius: '50%',
                padding: '8px',
                display: 'flex'
              }}>
                <Package size={20} color="#fff" />
              </div>
              <div>
                <p style={{
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  Processing
                </p>
                <p style={{
                  color: '#ccc',
                  fontSize: '12px',
                  margin: '0'
                }}>
                  1-2 business days
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              opacity: 0.6
            }}>
              <div style={{
                backgroundColor: '#666',
                borderRadius: '50%',
                padding: '8px',
                display: 'flex'
              }}>
                <Truck size={20} color="#fff" />
              </div>
              <div>
                <p style={{
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  Shipped
                </p>
                <p style={{
                  color: '#ccc',
                  fontSize: '12px',
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
          backgroundColor: '#2d2d2d',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #404040'
        }}>
          <h2 style={{
            color: '#fff',
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '20px'
          }}>
            Order Details
          </h2>

          {/* Items */}
          <div style={{ marginBottom: '20px' }}>
            {order.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #404040'
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
                
                <div style={{ flex: 1 }}>
                  <p style={{
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 4px 0'
                  }}>
                    {item.name}
                  </p>
                  <p style={{
                    color: '#ccc',
                    fontSize: '14px',
                    margin: '0'
                  }}>
                    Quantity: {item.quantity}
                  </p>
                </div>
                
                <p style={{
                  color: '#ff6b35',
                  fontSize: '16px',
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
            borderTop: '1px solid #404040',
            paddingTop: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ color: '#ccc', fontSize: '14px' }}>Subtotal:</span>
              <span style={{ color: '#fff', fontSize: '14px' }}>
                ${order.subtotal.toFixed(2)}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ color: '#ccc', fontSize: '14px' }}>Shipping:</span>
              <span style={{ color: '#fff', fontSize: '14px' }}>
                ${order.shipping.toFixed(2)}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <span style={{ color: '#ccc', fontSize: '14px' }}>Tax:</span>
              <span style={{ color: '#fff', fontSize: '14px' }}>
                ${order.tax.toFixed(2)}
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
                ${order.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping & Payment Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          {/* Shipping Address */}
          <div style={{
            backgroundColor: '#2d2d2d',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #404040'
          }}>
            <h3 style={{
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              Shipping Address
            </h3>
            <p style={{
              color: '#ccc',
              fontSize: '14px',
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
            backgroundColor: '#2d2d2d',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #404040'
          }}>
            <h3 style={{
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              Payment Method
            </h3>
            <p style={{
              color: '#ccc',
              fontSize: '14px',
              margin: '0 0 8px 0'
            }}>
              {order.payment.method === 'hoodpay' ? 'HoodPay' : 'Cryptocurrency'}
            </p>
            <p style={{
              color: '#999',
              fontSize: '12px',
              margin: '0'
            }}>
              Transaction ID: {order.payment.transactionId}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <button
            onClick={downloadInvoice}
            style={{
              backgroundColor: '#ff6b35',
              color: '#fff',
              border: 'none',
              padding: '14px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#e55a2b'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#ff6b35'}
          >
            <Download size={16} />
            Download Invoice
          </button>

          <Link
            to="/products"
            style={{
              backgroundColor: 'transparent',
              color: '#fff',
              border: '1px solid #666',
              padding: '14px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = '#ff6b35';
              e.target.style.color = '#ff6b35';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = '#666';
              e.target.style.color = '#fff';
            }}
          >
            Continue Shopping
          </Link>

          <Link
            to="/"
            style={{
              backgroundColor: 'transparent',
              color: '#ccc',
              border: '1px solid #666',
              padding: '14px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = '#999';
              e.target.style.color = '#fff';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = '#666';
              e.target.style.color = '#ccc';
            }}
          >
            <Home size={16} />
            Back to Home
          </Link>
        </div>

        {/* Email Confirmation */}
        <div style={{
          backgroundColor: '#1a1a2e20',
          border: '1px solid #404040',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <Mail size={20} color="#4ade80" />
            <p style={{
              color: '#4ade80',
              fontSize: '14px',
              fontWeight: '600',
              margin: '0'
            }}>
              Confirmation Email Sent
            </p>
          </div>
          <p style={{
            color: '#ccc',
            fontSize: '14px',
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