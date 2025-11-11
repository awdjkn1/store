/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:07.953Z */
import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Minus, Plus, Trash2, ExternalLink } from 'lucide-react';

const CartItem = ({ item, compact = false }) => {
  const { dispatch } = useContext(AppContext);
  const [isRemoving, setIsRemoving] = useState(false);

  const itemStyle = {
    display: 'flex',
    gap: compact ? '0.75rem' : '1rem',
    padding: compact ? '0.75rem' : '1rem',
  backgroundColor: 'var(--sb-surface)',
    borderRadius: '0.5rem',
  border: '0.0625rem solid var(--sb-border)',
    marginBottom: compact ? '0.5rem' : '0.75rem',
    transition: 'all 0.3s ease',
    opacity: isRemoving ? 0.5 : 1,
    transform: isRemoving ? 'scale(0.95)' : 'scale(1)'
  };

  const imageStyle = {
    width: compact ? '3.75rem' : '5rem',
    height: compact ? '3.75rem' : '5rem',
    borderRadius: '0.375rem',
    objectFit: 'cover',
    border: '0.0625rem solid var(--sb-border)'
  };

  const contentStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minWidth: 0
  };

  const nameStyle = {
    fontSize: compact ? '0.875rem' : '1rem',
    fontWeight: '600',
    color: 'var(--sb-text)',
    margin: '0 0 0.25rem 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  };

  const priceStyle = {
    fontSize: compact ? '0.875rem' : '1rem',
    fontWeight: '700',
    color: 'var(--sb-accent)',
    margin: 0
  };

  const quantityControlStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: compact ? '0.5rem' : '0.75rem'
  };

  const quantityButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2rem',
    height: '2rem',
    backgroundColor: 'var(--sb-bg)',
    border: '0.0625rem solid var(--sb-border)',
    borderRadius: '0.375rem',
    color: 'var(--sb-text)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const quantityDisplayStyle = {
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--sb-bg)',
    border: '0.0625rem solid var(--sb-border)',
    borderRadius: '0.375rem',
    color: 'var(--sb-text)',
    fontSize: '0.875rem',
    fontWeight: '600',
    minWidth: '3.125rem',
    textAlign: 'center'
  };

  const actionButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '0.375rem',
    color: 'var(--sb-muted)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const topRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: compact ? '0.25rem' : '0.5rem'
  };

  const bottomRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem'
  };

  const metaInfoStyle = {
    fontSize: '0.75rem',
    color: 'var(--sb-muted)',
    marginTop: '0.125rem'
  };

  const updateQuantity = (newQuantity) => {
    if (newQuantity === 0) {
      handleRemove();
      return;
    }
    
    dispatch({
      type: 'UPDATE_CART_ITEM',
      payload: {
        id: item.id,
        quantity: newQuantity
      }
    });
  };

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      dispatch({
        type: 'REMOVE_FROM_CART',
        payload: { id: item.id }
      });
    }, 300);
  };

  const addToWishlist = () => {
    // wishlist removed per request
  };

  return (
    <div style={itemStyle}>
      {/* Product Image */}
      <div style={{ position: 'relative' }}>
        <img 
          src={item.image} 
          alt={item.name}
          style={imageStyle}
        />
        {item.discount && (
          <div style={{
            position: 'absolute',
            top: '-0.3125rem',
            right: '-0.3125rem',
            backgroundColor: 'var(--sb-error)',
            color: 'var(--sb-accent-on)',
            borderRadius: '50%',
            width: '1.25rem',
            height: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.625rem',
            fontWeight: '700'
          }}>
            {item.discount}%
          </div>
        )}
      </div>

      {/* Product Content */}
      <div style={contentStyle}>
        {/* Top Row - Name and Actions */}
        <div style={topRowStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={nameStyle}>{item.name}</h3>
            {item.variant && (
              <div style={metaInfoStyle}>
                {item.variant}
              </div>
            )}
            {item.inStock !== undefined && (
              <div style={{
                ...metaInfoStyle,
                color: item.inStock ? 'var(--sb-success)' : 'var(--sb-error)'
              }}>
                {item.inStock ? '✓ In Stock' : '⚠ Out of Stock'}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {!compact && (
              <>
                <button
                  style={actionButtonStyle}
                  onClick={() => window.open(`/products/${item.id}`, '_blank')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--sb-border)';
                    e.currentTarget.style.color = 'var(--sb-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--sb-muted)';
                  }}
                  title="View Product"
                >
                  <ExternalLink size={16} />
                </button>
              </>
            )}
            <button
              style={actionButtonStyle}
              onClick={handleRemove}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--sb-error)';
                e.currentTarget.style.color = 'var(--sb-accent-on)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--sb-muted)';
              }}
              title="Remove from Cart"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Bottom Row - Price and Quantity */}
        <div style={bottomRowStyle}>
          <div>
            <div style={priceStyle}>
              ${(item.price * item.quantity).toFixed(2)}
            </div>
            {!compact && item.originalPrice && item.originalPrice > item.price && (
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--sb-muted)',
                textDecoration: 'line-through',
                marginTop: '0.125rem'
              }}>
                ${(item.originalPrice * item.quantity).toFixed(2)}
              </div>
            )}
          </div>

          {/* Quantity Controls */}
          <div style={quantityControlStyle}>
            <button
              style={quantityButtonStyle}
              onClick={() => updateQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1}
              onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--sb-accent)';
                    e.currentTarget.style.borderColor = 'var(--sb-accent)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--sb-bg)';
                  e.currentTarget.style.borderColor = 'var(--sb-border)';
                }}
            >
              <Minus size={14} />
            </button>
            
            <div style={quantityDisplayStyle}>
              {item.quantity}
            </div>
            
            <button
              style={quantityButtonStyle}
              onClick={() => updateQuantity(item.quantity + 1)}
              disabled={item.maxQuantity && item.quantity >= item.maxQuantity}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--sb-accent)';
                  e.currentTarget.style.borderColor = 'var(--sb-accent)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--sb-bg)';
                e.currentTarget.style.borderColor = 'var(--sb-border)';
              }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Unit Price (for reference) */}
        {!compact && (
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--sb-muted)',
            marginTop: '0.25rem'
          }}>
            ${item.price.toFixed(2)} each
          </div>
        )}
      </div>
    </div>
  );
};

export default CartItem;