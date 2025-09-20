import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext"; 
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";

const Cart = () => {
  const { state, dispatch } = useApp();   // ✅ use custom hook
  const navigate = useNavigate();

  const { cartItems } = state;

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 15.0; // Free shipping over $100
  const tax = subtotal * 0.08; // 8% tax rate
  const total = subtotal + shipping + tax;

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
    } else {
      dispatch({
        type: 'UPDATE_CART_QUANTITY',
        payload: { id: itemId, quantity: newQuantity }
      });
    }
  };

  const removeItem = (itemId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  if (cartItems.length === 0) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: '#2d2d2d',
          borderRadius: '50%',
          padding: '30px',
          marginBottom: '24px'
        }}>
          <ShoppingBag size={60} color="#ff6b35" />
        </div>
        
        <h2 style={{
          color: '#fff',
          marginBottom: '12px',
          fontSize: '28px',
          fontWeight: '600'
        }}>
          Your cart is empty
        </h2>
        
        <p style={{
          color: '#ccc',
          marginBottom: '32px',
          fontSize: '16px',
          maxWidth: '400px'
        }}>
          Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
        </p>
        
        <Link
          to="/products"
          style={{
            backgroundColor: '#ff6b35',
            color: '#fff',
            padding: '14px 28px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#e55a2b'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#ff6b35'}
        >
          <ArrowLeft size={18} />
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      minHeight: '60vh'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <h1 style={{
          color: '#fff',
          fontSize: '32px',
          fontWeight: '700',
          margin: '0'
        }}>
          Shopping Cart
        </h1>
        
        <Link
          to="/products"
          style={{
            color: '#ff6b35',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'color 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.color = '#e55a2b'}
          onMouseOut={(e) => e.target.style.color = '#ff6b35'}
        >
          <ArrowLeft size={18} />
          Continue Shopping
        </Link>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '40px',
        '@media (max-width: 768px)': {
          gridTemplateColumns: '1fr',
          gap: '20px'
        }
      }}>
        {/* Cart Items */}
        <div>
          {/* Clear Cart Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <p style={{
              color: '#ccc',
              margin: '0',
              fontSize: '14px'
            }}>
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
            </p>
            
            <button
              onClick={clearCart}
              style={{
                background: 'none',
                border: '1px solid #666',
                color: '#ccc',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.borderColor = '#ff4444';
                e.target.style.color = '#ff4444';
              }}
              onMouseOut={(e) => {
                e.target.style.borderColor = '#666';
                e.target.style.color = '#ccc';
              }}
            >
              Clear Cart
            </button>
          </div>

          {/* Cart Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cartItems.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#2d2d2d',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #404040',
                  display: 'flex',
                  gap: '16px'
                }}
              >
                {/* Product Image */}
                <div style={{ flexShrink: 0 }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/product/${item.id}`)}
                  />
                </div>

                {/* Product Details */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      color: '#fff',
                      margin: '0 0 8px 0',
                      fontSize: '18px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/product/${item.id}`)}
                    >
                      {item.name}
                    </h3>
                    
                    {item.variant && (
                      <p style={{
                        color: '#ccc',
                        margin: '0 0 8px 0',
                        fontSize: '14px'
                      }}>
                        Size: {item.variant}
                      </p>
                    )}
                    
                    <p style={{
                      color: '#ff6b35',
                      margin: '0 0 16px 0',
                      fontSize: '20px',
                      fontWeight: '700'
                    }}>
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity Controls and Actions */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    {/* Quantity Controls */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{
                        color: '#ccc',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        Quantity:
                      </span>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '6px',
                        border: '1px solid #404040'
                      }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ccc',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color 0.3s ease'
                          }}
                          onMouseOver={(e) => e.target.style.color = '#ff6b35'}
                          onMouseOut={(e) => e.target.style.color = '#ccc'}
                        >
                          <Minus size={16} />
                        </button>
                        
                        <span style={{
                          color: '#fff',
                          padding: '8px 16px',
                          fontSize: '16px',
                          fontWeight: '600',
                          minWidth: '40px',
                          textAlign: 'center'
                        }}>
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ccc',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color 0.3s ease'
                          }}
                          onMouseOver={(e) => e.target.style.color = '#ff6b35'}
                          onMouseOut={(e) => e.target.style.color = '#ccc'}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <span style={{
                        color: '#fff',
                        fontSize: '18px',
                        fontWeight: '600'
                      }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          background: 'none',
                          border: '1px solid #666',
                          color: '#ccc',
                          padding: '8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.borderColor = '#ff4444';
                          e.target.style.color = '#ff4444';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.borderColor = '#666';
                          e.target.style.color = '#ccc';
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div style={{
          position: 'sticky',
          top: '20px',
          height: 'fit-content'
        }}>
          <div style={{
            backgroundColor: '#2d2d2d',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #404040'
          }}>
            <h3 style={{
              color: '#fff',
              marginBottom: '20px',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              Order Summary
            </h3>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#ccc', fontSize: '14px' }}>
                  Subtotal ({cartItems.length} items):
                </span>
                <span style={{ color: '#fff', fontSize: '14px' }}>
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#ccc', fontSize: '14px' }}>
                  Shipping:
                </span>
                <span style={{ color: '#fff', fontSize: '14px' }}>
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </span>
              </div>

              {shipping === 0 && (
                <p style={{
                  color: '#4ade80',
                  fontSize: '12px',
                  margin: '0',
                  textAlign: 'right'
                }}>
                  🎉 You qualified for free shipping!
                </p>
              )}

              {subtotal > 0 && subtotal < 100 && (
                <p style={{
                  color: '#ff6b35',
                  fontSize: '12px',
                  margin: '0',
                  textAlign: 'right'
                }}>
                  Add ${(100 - subtotal).toFixed(2)} more for free shipping
                </p>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#ccc', fontSize: '14px' }}>Tax:</span>
                <span style={{ color: '#fff', fontSize: '14px' }}>
                  ${tax.toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid #404040',
              paddingTop: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
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
                  fontSize: '24px',
                  fontWeight: '700'
                }}>
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => navigate('/checkout')}
              style={{
                width: '100%',
                backgroundColor: '#ff6b35',
                color: '#fff',
                border: 'none',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                marginBottom: '12px'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#e55a2b'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ff6b35'}
            >
              Proceed to Checkout
            </button>

            <p style={{
              color: '#999',
              fontSize: '12px',
              textAlign: 'center',
              margin: '0'
            }}>
              Secure checkout with SSL encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;