import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = ''
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus trap for accessibility
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    small: { maxWidth: '400px' },
    medium: { maxWidth: '600px' },
    large: { maxWidth: '800px' },
    xlarge: { maxWidth: '1200px' },
    full: { width: '100vw', height: '100vh', maxWidth: 'none' }
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  backgroundColor: 'rgba(32, 35, 39, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: size === 'full' ? '0' : '20px',
    backdropFilter: 'blur(4px)'
  };

  const modalStyle = {
    backgroundColor: 'var(--sb-bg)',
    borderRadius: size === 'full' ? '0' : '12px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
    width: '100%',
    ...sizes[size],
    maxHeight: size === 'full' ? '100vh' : '90vh',
    overflow: 'hidden',
    position: 'relative',
    border: '1px solid var(--sb-border)'
  };

  const headerStyle = {
    padding: '24px 24px 0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: title ? '1px solid var(--sb-border)' : 'none',
    paddingBottom: title ? '16px' : '0'
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--sb-text)',
    margin: 0
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
  color: 'var(--sb-muted)',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  };

  const contentStyle = {
    padding: title ? '24px' : '24px 24px 24px 24px',
    overflowY: 'auto',
    maxHeight: size === 'full' ? 'calc(100vh - 80px)' : 'calc(90vh - 120px)',
    color: 'var(--sb-text)'
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      style={overlayStyle} 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div style={modalStyle} className={className}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div style={headerStyle}>
            {title && (
              <h2 style={titleStyle} id="modal-title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                style={closeButtonStyle}
                onClick={onClose}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--sb-accent)';
                  e.currentTarget.style.color = 'var(--sb-accent-on)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--sb-muted)';
                }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div style={contentStyle}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal Component
export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message, 
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary" 
}) => {
  const buttonStyle = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '100px'
  };

  const confirmButtonStyle = {
    ...buttonStyle,
    backgroundColor: variant === 'danger' ? 'var(--sb-error)' : 'var(--sb-accent)',
    color: 'var(--sb-accent-on)',
    marginLeft: '12px'
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: 'var(--sb-muted)',
    border: '1px solid var(--sb-border)'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <div style={{ marginBottom: '24px', lineHeight: '1.6' }}>
        {message}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          style={cancelButtonStyle}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--sb-surface)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {cancelText}
        </button>
        <button 
          style={confirmButtonStyle}
          onClick={() => {
            onConfirm();
            onClose();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = variant === 'danger' ? 'var(--sb-error)' : 'var(--sb-accent-700)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = variant === 'danger' ? 'var(--sb-error)' : 'var(--sb-accent)';
          }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default Modal;