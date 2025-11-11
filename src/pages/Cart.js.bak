import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";

const Cart = () => {
  const { cart, updateCartItem, removeFromCart, cartTotal } = useApp();
  const navigate = useNavigate();

  const cartItems = cart || [];
  const subtotal = cartTotal || 0;
  const shipping = subtotal > 100 ? 0 : 15.0;
  const total = subtotal + shipping;

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateCartItem(itemId, newQuantity);
    }
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
          backgroundColor: 'var(--sb-surface)',
          borderRadius: '50%',
          padding: '30px',
          marginBottom: '24px'
        }}>
          <ShoppingBag size={60} style={{ color: 'var(--sb-accent)' }} />
        </div>

        <h2 style={{
          color: 'var(--sb-text)',
          marginBottom: '12px',
          fontSize: '28px',
          fontWeight: '600'
        }}>
          Your cart is empty
        </h2>

        <p style={{
          color: 'var(--sb-muted)',
          marginBottom: '32px',
          fontSize: '16px',
          maxWidth: '400px'
        }}>
          Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
        </p>

        <Link
          to="/products"
          style={{
            backgroundColor: 'var(--sb-accent)',
            color: 'var(--sb-accent-on)',
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
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--sb-accent-700)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--sb-accent)')}
        >
          <ArrowLeft size={18} />
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', minHeight: '60vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ color: 'var(--sb-text)', fontSize: '32px', fontWeight: '700', margin: 0 }}>Shopping Cart</h1>

        <Link to="/products" style={{ color: 'var(--sb-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '500', transition: 'color 0.3s ease' }}>
          Continue shopping
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        {/* Items list */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cartItems.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', backgroundColor: 'var(--sb-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--sb-border)' }}>
                <div style={{ flexShrink: 0 }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ height: '120px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
                    onClick={() => navigate(`/product/${item.product_id || item.productId || item.id}`)}
                  />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: 'var(--sb-text)', margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', cursor: 'pointer' }} onClick={() => navigate(`/product/${item.product_id || item.productId || item.id}`)}>
                      {item.name}
                    </h3>

                    {item.variant && (
                      <p style={{ color: 'var(--sb-muted)', margin: '0 0 8px 0', fontSize: '14px' }}>Size: {item.variant}</p>
                    )}

                    <p style={{ color: 'var(--sb-accent)', margin: '0 0 16px 0', fontSize: '20px', fontWeight: '700' }}>${(item.price_shipping_included || 0).toFixed(2)}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: 'var(--sb-muted)', fontSize: '14px', fontWeight: '500' }}>Quantity:</span>

                      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--sb-bg)', borderRadius: '6px', border: '1px solid var(--sb-border)' }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{ background: 'none', border: 'none', color: 'var(--sb-muted)', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.3s ease' }}
                          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--sb-accent)')}
                          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sb-muted)')}
                        >
                          <Minus size={16} />
                        </button>

                        <span style={{ color: 'var(--sb-text)', padding: '8px 16px', fontSize: '16px', fontWeight: '600', minWidth: '40px', textAlign: 'center' }}>{item.quantity}</span>

                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ background: 'none', border: 'none', color: 'var(--sb-muted)', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.3s ease' }}
                          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--sb-accent)')}
                          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sb-muted)')}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ color: 'var(--sb-text)', fontSize: '18px', fontWeight: '600' }}>{((item.price_shipping_included || 0) * item.quantity).toFixed(2)}</span>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{ background: 'none', border: '1px solid var(--sb-border)', color: 'var(--sb-muted)', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.3s ease' }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = 'var(--sb-error)';
                          e.currentTarget.style.color = 'var(--sb-error)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = 'var(--sb-border)';
                          e.currentTarget.style.color = 'var(--sb-muted)';
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
        <div style={{ position: 'sticky', top: '20px', height: 'fit-content' }}>
          <div style={{ backgroundColor: 'var(--sb-surface)', borderRadius: '12px', padding: '24px', border: '1px solid var(--sb-border)' }}>
            <h3 style={{ color: 'var(--sb-text)', marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>Order Summary</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--sb-muted)', fontSize: '14px' }}>Subtotal ({cartItems.length} items):</span>
                <span style={{ color: 'var(--sb-text)', fontSize: '14px' }}>${subtotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--sb-muted)', fontSize: '14px' }}>Shipping:</span>
                <span style={{ color: 'var(--sb-text)', fontSize: '14px' }}>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
              </div>

              {shipping === 0 && (
                <p style={{ color: 'var(--sb-success)', fontSize: '12px', margin: 0, textAlign: 'right' }}>🎉 You qualified for free shipping!</p>
              )}

              {subtotal > 0 && subtotal < 100 && (
                <p style={{ color: 'var(--sb-accent)', fontSize: '12px', margin: 0, textAlign: 'right' }}>Add ${(100 - subtotal).toFixed(2)} more for free shipping</p>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--sb-border)', paddingTop: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--sb-text)', fontSize: '18px', fontWeight: '600' }}>Total:</span>
                <span style={{ color: 'var(--sb-accent)', fontSize: '24px', fontWeight: '700' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              style={{ width: '100%', backgroundColor: 'var(--sb-accent)', color: 'var(--sb-accent-on)', border: 'none', padding: '16px', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', marginBottom: '12px' }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--sb-accent-700)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--sb-accent)')}
            >
              Proceed to Checkout
            </button>

            <p style={{ color: 'var(--sb-muted)', fontSize: '12px', textAlign: 'center', margin: 0 }}>Secure checkout with SSL encryption</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;