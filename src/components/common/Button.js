/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:07.998Z */
import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  loading = false,
  type = 'button',
  className = '',
  icon: Icon,
  ...props 
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    textDecoration: 'none',
    opacity: disabled || loading ? 0.6 : 1,
    position: 'relative',
    overflow: 'hidden'
  };

  const variants = {
    primary: {
      backgroundColor: '#ff6b35',
      color: '#ffffff',
      boxShadow: '0 0.25rem 0.75rem rgba(255, 107, 53, 0.3)',
      ':hover': {
        backgroundColor: '#e55a2e',
        transform: 'translateY(-0.125rem)',
        boxShadow: '0 0.375rem 1rem rgba(255, 107, 53, 0.4)'
      }
    },
    secondary: {
      backgroundColor: '#2d2d2d',
      color: '#ffffff',
      border: '0.125rem solid #ff6b35',
      boxShadow: '0 0.125rem 0.5rem rgba(45, 45, 45, 0.2)',
      ':hover': {
        backgroundColor: '#ff6b35',
        transform: 'translateY(-0.125rem)'
      }
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#ff6b35',
      border: '0.125rem solid #ff6b35',
      ':hover': {
        backgroundColor: '#ff6b35',
        color: '#ffffff'
      }
    },
    danger: {
      backgroundColor: '#dc3545',
      color: '#ffffff',
      boxShadow: '0 0.25rem 0.75rem rgba(220, 53, 69, 0.3)',
      ':hover': {
        backgroundColor: '#c82333',
        transform: 'translateY(-0.125rem)'
      }
    },
    success: {
      backgroundColor: '#28a745',
      color: '#ffffff',
      boxShadow: '0 0.25rem 0.75rem rgba(40, 167, 69, 0.3)',
      ':hover': {
        backgroundColor: '#218838',
        transform: 'translateY(-0.125rem)'
      }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#ffffff',
      border: '0.0625rem solid rgba(255, 255, 255, 0.2)',
      ':hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.3)'
      }
    }
  };

  const sizes = {
    small: {
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      minHeight: '2.25rem'
    },
    medium: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      minHeight: '2.75rem'
    },
    large: {
      padding: '1rem 2rem',
      fontSize: '1.125rem',
      minHeight: '3.25rem'
    }
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const buttonStyle = {
    ...baseStyles,
    ...variants[variant],
    ...sizes[size],
    ...(isHovered && variants[variant][':hover']),
    ...props.style
  };

  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={className}
      style={buttonStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {loading && (
        <div style={{
          width: '1rem',
          height: '1rem',
          border: '0.125rem solid transparent',
          borderTop: '0.125rem solid currentColor',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      )}
      
      {Icon && !loading && <Icon size={16} />}
      
      {children}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default Button;