import React, { useState } from 'react';

const StarRating = ({ 
  rating = 0, 
  maxStars = 5, 
  size = 16, 
  interactive = false, 
  onRatingChange,
  showValue = false,
  precision = 1 // 1 = whole stars, 0.5 = half stars, 0.1 = decimal stars
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [tempRating, setTempRating] = useState(rating);

  const handleMouseEnter = (starIndex) => {
    if (!interactive) return;
    setHoverRating(starIndex);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoverRating(0);
  };

  const handleClick = (starIndex) => {
    if (!interactive || !onRatingChange) return;
    
    const newRating = precision === 1 ? Math.round(starIndex) : starIndex;
    setTempRating(newRating);
    onRatingChange(newRating);
  };

  const handleMouseMove = (e, starIndex) => {
    if (!interactive || precision === 1) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const starWidth = rect.width;
    const percentage = x / starWidth;
    
    let preciseRating;
    if (precision === 0.5) {
      preciseRating = percentage < 0.5 ? starIndex - 0.5 : starIndex;
    } else {
      preciseRating = starIndex - 1 + percentage;
      preciseRating = Math.round(preciseRating * 10) / 10; // Round to 1 decimal
    }
    
    setHoverRating(Math.max(0.1, preciseRating));
  };

  const displayRating = interactive ? (hoverRating || tempRating) : rating;
  const effectiveRating = Math.min(Math.max(displayRating, 0), maxStars);

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    cursor: interactive ? 'pointer' : 'default'
  };

  const starContainerStyle = {
    position: 'relative',
    display: 'inline-block'
  };

  const getStarFill = (starIndex) => {
    const starStart = starIndex - 1;
    const starEnd = starIndex;
    
    if (effectiveRating >= starEnd) {
      return 1; // Full star
    } else if (effectiveRating > starStart) {
      return effectiveRating - starStart; // Partial star
    } else {
      return 0; // Empty star
    }
  };

  const getStarColor = (starIndex, isHovered = false) => {
    const fill = getStarFill(starIndex);
    
    if (interactive && isHovered) {
      return 'var(--sb-warning)'; // Bright warning on hover
    }
    
    if (fill > 0) {
      return 'var(--sb-accent)'; // Primary accent
    }
    
    return 'var(--sb-muted)'; // Gray for empty
  };

  const valueStyle = {
    marginLeft: '0.5rem',
    fontSize: `${size * 0.875}px`,
    color: 'var(--sb-muted)',
    fontWeight: '500'
  };

  return (
    <div style={containerStyle}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starIndex = i + 1;
        const fill = getStarFill(starIndex);
        const isHovered = interactive && hoverRating >= starIndex;

        return (
          <div
            key={starIndex}
            style={starContainerStyle}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            onMouseLeave={handleMouseLeave}
            onMouseMove={(e) => handleMouseMove(e, starIndex)}
            onClick={() => handleClick(starIndex)}
          >
                {/* Background star (empty) - use filled SVG so clipPath works reliably */}
                <svg
                  width={size}
                  height={size}
                  viewBox="0 0 24 24"
                  style={{ position: 'absolute', color: 'var(--sb-border)', display: 'block' }}
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.788 1.402 8.173L12 18.897l-7.336 3.874 1.402-8.173L.132 9.21l8.2-1.192z"
                  />
                </svg>

                {/* Foreground star (filled portion) */}
                <svg
                  width={size}
                  height={size}
                  viewBox="0 0 24 24"
                  style={{
                    color: getStarColor(starIndex, isHovered),
                    display: 'block',
                    fill: 'currentColor',
                    clipPath: fill < 1 ? `inset(0 ${(1 - fill) * 100}% 0 0)` : 'none',
                    transition: interactive ? 'all 0.2s ease' : 'none',
                    position: 'absolute'
                  }}
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.788 1.402 8.173L12 18.897l-7.336 3.874 1.402-8.173L.132 9.21l8.2-1.192z"
                  />
                </svg>
          </div>
        );
      })}
      
      {showValue && (
        <span style={valueStyle}>
          {effectiveRating.toFixed(precision === 1 ? 0 : 1)} / {maxStars}
        </span>
      )}
    </div>
  );
};

export default StarRating;