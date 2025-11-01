import React, { useState } from 'react';
import { X, Star, DollarSign, Package, Filter } from 'lucide-react';
import StarRating from '../common/StarRating';

const ProductFilters = ({ 
  filters, 
  onFiltersChange, 
  showMobile = false,
  onClose 
}) => {
  const [tempPriceRange, setTempPriceRange] = useState(filters.priceRange);

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    onFiltersChange(newFilters);
  };

  const handlePriceRangeChange = (index, value) => {
    const newRange = [...tempPriceRange];
    newRange[index] = parseFloat(value) || 0;
    setTempPriceRange(newRange);
    
    // Update filters immediately
    handleFilterChange('priceRange', newRange);
  };

  const clearFilters = () => {
    const clearedFilters = {
      priceRange: [0, 1000],
      rating: 0,
      // inStock removed
    };
    onFiltersChange(clearedFilters);
    setTempPriceRange([0, 1000]);
  };

  const containerStyle = {
    backgroundColor: 'var(--sb-surface)',
    borderRadius: '12px',
    padding: '1.5rem',
    height: 'fit-content',
    position: 'relative',
    border: '1px solid var(--sb-border)',
    ...(showMobile && {
      position: 'fixed',
      top: '2rem',
      left: '2rem',
      right: '2rem',
      maxHeight: '90vh',
      overflowY: 'auto',
      zIndex: 1001,
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
    })
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid var(--sb-border)'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'var(--sb-text)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const closeButtonStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--sb-muted)',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '6px',
    transition: 'all 0.3s ease',
    display: showMobile ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const sectionStyle = {
    marginBottom: '2rem'
  };

  const sectionTitleStyle = {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: 'var(--sb-text)',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const categoryButtonStyle = (isActive) => ({
    backgroundColor: isActive ? 'var(--sb-accent)' : 'transparent',
    color: isActive ? 'var(--sb-accent-on)' : 'var(--sb-muted)',
    border: isActive ? 'none' : '1px solid var(--sb-border)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    margin: '0.25rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '500',
    display: 'inline-block',
    textAlign: 'center',
    minWidth: '80px'
  });

  const priceInputStyle = {
    backgroundColor: 'var(--sb-bg)',
    border: '1px solid var(--sb-border)',
    borderRadius: '8px',
    color: 'var(--sb-text)',
    padding: '0.75rem',
    width: '100%',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.3s ease'
  };

  const priceRangeStyle = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
  };

  const rangeInputStyle = {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: 'var(--sb-border)',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer'
  };

  const checkboxStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 0',
    cursor: 'pointer',
    transition: 'color 0.3s ease'
  };

  const checkboxInputStyle = {
    width: '18px',
    height: '18px',
    accentColor: 'var(--sb-accent)',
    cursor: 'pointer'
  };

  const clearButtonStyle = {
    backgroundColor: 'transparent',
    color: 'var(--sb-accent)',
    border: '1px solid var(--sb-accent)',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    fontWeight: '600',
    width: '100%',
    marginTop: '1rem'
  };

  const ratingFilterStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  };

  const ratingOptionStyle = (rating) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    backgroundColor: filters.rating === rating ? 'rgba(0, 122, 103, 0.08)' : 'transparent'
  });

  const activeFiltersStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '1rem'
  };

  const activeFilterTagStyle = {
    backgroundColor: 'var(--sb-accent)',
    color: 'var(--sb-accent-on)',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value[0] !== 0 || value[1] !== 1000;
    if (typeof value === 'boolean') return value;
    return value !== '' && value !== 0;
  }).length;

  const getActiveFilterTags = () => {
    const tags = [];

    if (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 1000) {
      tags.push({ 
        type: 'priceRange', 
        label: `$${filters.priceRange[0]} - $${filters.priceRange[1]}`, 
        value: [0, 1000] 
      });
    }

    if (filters.rating > 0) {
      tags.push({ 
        type: 'rating', 
        label: `${filters.rating}+ stars`, 
        value: 0 
      });
    }

    return tags;
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          <Filter size={20} />
          Filters
          {activeFiltersCount > 0 && (
            <span style={{
              backgroundColor: 'var(--sb-accent)',
              color: 'var(--sb-accent-on)',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {activeFiltersCount}
            </span>
          )}
        </h3>
        
        <button
          style={closeButtonStyle}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--sb-border)';
            e.currentTarget.style.color = 'var(--sb-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--sb-muted)';
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div style={activeFiltersStyle}>
          {getActiveFilterTags().map((tag, index) => (
            <span key={index} style={activeFilterTagStyle}>
              {tag.label}
              <button
                onClick={() => handleFilterChange(tag.type, tag.value)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Category filter removed per request */}

      {/* Price Range Filter */}
      <div style={sectionStyle}>
        <h4 style={sectionTitleStyle}>
          <DollarSign size={18} />
          Price Range
        </h4>
        <div style={priceRangeStyle}>
          <input
            type="number"
            placeholder="Min"
            value={tempPriceRange[0]}
            onChange={(e) => handlePriceRangeChange(0, e.target.value)}
            style={priceInputStyle}
            min="0"
            max="1000"
          />
              <span style={{ color: 'var(--sb-muted)' }}>to</span>
          <input
            type="number"
            placeholder="Max"
            value={tempPriceRange[1]}
            onChange={(e) => handlePriceRangeChange(1, e.target.value)}
            style={priceInputStyle}
            min="0"
            max="1000"
          />
        </div>
        
        {/* Range Slider */}
        <div style={{ marginTop: '1rem' }}>
          <input
            type="range"
            min="0"
            max="1000"
            value={tempPriceRange[0]}
            onChange={(e) => handlePriceRangeChange(0, e.target.value)}
            style={rangeInputStyle}
          />
          <input
            type="range"
            min="0"
            max="1000"
            value={tempPriceRange[1]}
            onChange={(e) => handlePriceRangeChange(1, e.target.value)}
            style={{ ...rangeInputStyle, marginTop: '0.5rem' }}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '0.8rem', 
            color: 'var(--sb-muted)',
            marginTop: '0.5rem'
          }}>
            <span>$0</span>
            <span>$1000+</span>
          </div>
        </div>
      </div>

      {/* Rating Filter */}
      <div style={sectionStyle}>
        <h4 style={sectionTitleStyle}>
          <Star size={18} />
          Rating
        </h4>
        <div style={ratingFilterStyle}>
          {[4, 3, 2, 1].map(rating => (
            <div
              key={rating}
              style={ratingOptionStyle(rating)}
              onClick={() => handleFilterChange('rating', filters.rating === rating ? 0 : rating)}
            >
              <StarRating rating={rating} size={16} />
                <span style={{ color: 'var(--sb-muted)', fontSize: '0.9rem' }}>
                {rating}+ stars
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* In-stock filter removed per request */}

      {/* Clear Filters Button */}
      {activeFiltersCount > 0 && (
        <button
          style={clearButtonStyle}
          onClick={clearFilters}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--sb-accent)';
            e.currentTarget.style.color = 'var(--sb-accent-on)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--sb-accent)';
          }}
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
};

export default ProductFilters;