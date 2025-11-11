/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:08.038Z */
import React from 'react';

const LoadingSpinner = ({ 
  size = 40, 
  color = 'var(--sb-accent)', 
  thickness = 4,
  text = null,
  fullScreen = false 
}) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    ...(fullScreen && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(26, 26, 26, 0.8)',
      zIndex: 9999,
      backdropFilter: 'blur(0.25rem)'
    })
  };

  const spinnerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    border: `${thickness}px solid var(--sb-border)`,
    borderTop: `${thickness}px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const textStyle = {
    color: 'var(--sb-muted)',
    fontSize: '0.9rem',
    fontWeight: '500',
    textAlign: 'center'
  };

  // Inject keyframes for spinner animation
  React.useEffect(() => {
    const styleSheet = document.styleSheets[0];
    const keyframes = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    
    try {
      styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
    } catch (e) {
      // Rule might already exist
    }
  }, []);

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle}></div>
      {text && <div style={textStyle}>{text}</div>}
    </div>
  );
};

export default LoadingSpinner;