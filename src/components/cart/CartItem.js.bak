import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Minus, Plus, Trash2, ExternalLink } from 'lucide-react';

const CartItem = ({ item, compact = false }) => {
  const { dispatch } = useContext(AppContext);
  const [isRemoving, setIsRemoving] = useState(false);

  const itemStyle = {
    display: 'flex',
    gap: compact ? '12px' : '16px',
    padding: compact ? '12px' : '16px',
  backgroundColor: 'var(--sb-surface)',
    borderRadius: '8px',
  border: '1px solid var(--sb-border)',
    marginBottom: compact ? '8px' : '12px',
    transition: 'all 0.3s ease',
    opacity: isRemoving ? 0.5 : 1,
    transform: isRemoving ? 'scale(0.95)' : 'scale(1)'
  };

  const imageStyle = {
    width: compact ? '60px' : '80px',
    height: compact ? '60px' : '80px',
    borderRadius: '6px',
    objectFit: 'cover',
    border: '1px solid var(--sb-border)'
  };

  const contentStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minWidth: 0
  };

  const nameStyle = {
    fontSize: compact ? '14px' : '16px',
    fontWeight: '600',
    color: 'var(--sb-text)',
    margin: '0 0 4px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  };

  const priceStyle = {
    fontSize: compact ? '14px' : '16px',
    fontWeight: '700',
    color: 'var(--sb-accent)',
    margin: 0
  };

  const quantityControlStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: compact ? '8px' : '12px'
  };

  const quantityButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: 'var(--sb-bg)',
    border: '1px solid var(--sb-border)',
    borderRadius: '6px',
    color: 'var(--sb-text)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const quantityDisplayStyle = {
    padding: '8px 16px',
    backgroundColor: 'var(--sb-bg)',
    border: '1px solid var(--sb-border)',
    borderRadius: '6px',
    color: 'var(--sb-text)',
    fontSize: '14px',
    fontWeight: '600',
    minWidth: '50px',
    textAlign: 'center'
  };

  const actionButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: 'var(--sb-muted)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const topRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: compact ? '4px' : '8px'
  };

  const bottomRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  };

  const metaInfoStyle = {
    fontSize: '12px',
    color: 'var(--sb-muted)',
    marginTop: '2px'
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
            top: '-5px',
            right: '-5px',
            backgroundColor: 'var(--sb-error)',
            color: 'var(--sb-accent-on)',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
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

          <div style={{ display: 'flex', gap: '4px' }}>
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
                fontSize: '12px',
                color: 'var(--sb-muted)',
                textDecoration: 'line-through',
                marginTop: '2px'
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
            fontSize: '12px',
            color: 'var(--sb-muted)',
            marginTop: '4px'
          }}>
            ${item.price.toFixed(2)} each
          </div>
        )}
      </div>
    </div>
  );
};

export default CartItem;