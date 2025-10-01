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
    gap: '8px',
    fontWeight: '600',
    borderRadius: '8px',
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
      boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
      ':hover': {
        backgroundColor: '#e55a2e',
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 16px rgba(255, 107, 53, 0.4)'
      }
    },
    secondary: {
      backgroundColor: '#2d2d2d',
      color: '#ffffff',
      border: '2px solid #ff6b35',
      boxShadow: '0 2px 8px rgba(45, 45, 45, 0.2)',
      ':hover': {
        backgroundColor: '#ff6b35',
        transform: 'translateY(-2px)'
      }
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#ff6b35',
      border: '2px solid #ff6b35',
      ':hover': {
        backgroundColor: '#ff6b35',
        color: '#ffffff'
      }
    },
    danger: {
      backgroundColor: '#dc3545',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)',
      ':hover': {
        backgroundColor: '#c82333',
        transform: 'translateY(-2px)'
      }
    },
    success: {
      backgroundColor: '#28a745',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
      ':hover': {
        backgroundColor: '#218838',
        transform: 'translateY(-2px)'
      }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#ffffff',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      ':hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.3)'
      }
    }
  };

  const sizes = {
    small: {
      padding: '8px 16px',
      fontSize: '14px',
      minHeight: '36px'
    },
    medium: {
      padding: '12px 24px',
      fontSize: '16px',
      minHeight: '44px'
    },
    large: {
      padding: '16px 32px',
      fontSize: '18px',
      minHeight: '52px'
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
          width: '16px',
          height: '16px',
          border: '2px solid transparent',
          borderTop: '2px solid currentColor',
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