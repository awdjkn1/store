/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:09.216Z */
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
        padding: '2.5rem 1.25rem',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: 'var(--sb-surface)',
          borderRadius: '50%',
          padding: '1.875rem',
          marginBottom: '1.5rem'
        }}>
          <ShoppingBag size={60} style={{ color: 'var(--sb-accent)' }} />
        </div>

        <h2 style={{
          color: 'var(--sb-text)',
          marginBottom: '0.75rem',
          fontSize: '1.75rem',
          fontWeight: '600'
        }}>
          Your cart is empty
        </h2>

        <p style={{
          color: 'var(--sb-muted)',
          marginBottom: '2rem',
          fontSize: '1rem',
          maxWidth: '25rem'
        }}>
          Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
        </p>

        <Link
          to="/products"
          style={{
            backgroundColor: 'var(--sb-accent)',
            color: 'var(--sb-accent-on)',
            padding: '0.875rem 1.75rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
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
    <div style={{ maxWidth: '75rem', margin: '0 auto', padding: '1.25rem', minHeight: '60vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--sb-text)', fontSize: '2rem', fontWeight: '700', margin: 0 }}>Shopping Cart</h1>

        <Link to="/products" style={{ color: 'var(--sb-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: '500', transition: 'color 0.3s ease' }}>
          Continue shopping
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 21.25rem', gap: '1.5rem', alignItems: 'start' }}>
        {/* Items list */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cartItems.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', backgroundColor: 'var(--sb-bg)', padding: '1rem', borderRadius: '0.5rem', border: '0.0625rem solid var(--sb-border)' }}>
                <div style={{ flexShrink: 0 }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ height: '7.5rem', objectFit: 'cover', borderRadius: '0.5rem', cursor: 'pointer' }}
                    onClick={() => navigate(`/product/${item.product_id || item.productId || item.id}`)}
                  />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: 'var(--sb-text)', margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600', cursor: 'pointer' }} onClick={() => navigate(`/product/${item.product_id || item.productId || item.id}`)}>
                      {item.name}
                    </h3>

                    {item.variant && (
                      <p style={{ color: 'var(--sb-muted)', margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>Size: {item.variant}</p>
                    )}

                    <p style={{ color: 'var(--sb-accent)', margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '700' }}>${(item.price_shipping_included || 0).toFixed(2)}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: 'var(--sb-muted)', fontSize: '0.875rem', fontWeight: '500' }}>Quantity:</span>

                      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--sb-bg)', borderRadius: '0.375rem', border: '0.0625rem solid var(--sb-border)' }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{ background: 'none', border: 'none', color: 'var(--sb-muted)', padding: '0.5rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.3s ease' }}
                          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--sb-accent)')}
                          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sb-muted)')}
                        >
                          <Minus size={16} />
                        </button>

                        <span style={{ color: 'var(--sb-text)', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: '600', minWidth: '2.5rem', textAlign: 'center' }}>{item.quantity}</span>

                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ background: 'none', border: 'none', color: 'var(--sb-muted)', padding: '0.5rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.3s ease' }}
                          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--sb-accent)')}
                          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sb-muted)')}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ color: 'var(--sb-text)', fontSize: '1.125rem', fontWeight: '600' }}>{((item.price_shipping_included || 0) * item.quantity).toFixed(2)}</span>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{ background: 'none', border: '0.0625rem solid var(--sb-border)', color: 'var(--sb-muted)', padding: '0.5rem', borderRadius: '0.375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.3s ease' }}
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
        <div style={{ position: 'sticky', top: '1.25rem', height: 'fit-content' }}>
          <div style={{ backgroundColor: 'var(--sb-surface)', borderRadius: '0.75rem', padding: '1.5rem', border: '0.0625rem solid var(--sb-border)' }}>
            <h3 style={{ color: 'var(--sb-text)', marginBottom: '1.25rem', fontSize: '1.25rem', fontWeight: '600' }}>Order Summary</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--sb-muted)', fontSize: '0.875rem' }}>Subtotal ({cartItems.length} items):</span>
                <span style={{ color: 'var(--sb-text)', fontSize: '0.875rem' }}>${subtotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--sb-muted)', fontSize: '0.875rem' }}>Shipping:</span>
                <span style={{ color: 'var(--sb-text)', fontSize: '0.875rem' }}>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
              </div>

              {shipping === 0 && (
                <p style={{ color: 'var(--sb-success)', fontSize: '0.75rem', margin: 0, textAlign: 'right' }}>🎉 You qualified for free shipping!</p>
              )}

              {subtotal > 0 && subtotal < 100 && (
                <p style={{ color: 'var(--sb-accent)', fontSize: '0.75rem', margin: 0, textAlign: 'right' }}>Add ${(100 - subtotal).toFixed(2)} more for free shipping</p>
              )}
            </div>

            <div style={{ borderTop: '0.0625rem solid var(--sb-border)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--sb-text)', fontSize: '1.125rem', fontWeight: '600' }}>Total:</span>
                <span style={{ color: 'var(--sb-accent)', fontSize: '1.5rem', fontWeight: '700' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              style={{ width: '100%', backgroundColor: 'var(--sb-accent)', color: 'var(--sb-accent-on)', border: 'none', padding: '1rem', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', marginBottom: '0.75rem' }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--sb-accent-700)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--sb-accent)')}
            >
              Proceed to Checkout
            </button>

            <p style={{ color: 'var(--sb-muted)', fontSize: '0.75rem', textAlign: 'center', margin: 0 }}>Secure checkout with SSL encryption</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;