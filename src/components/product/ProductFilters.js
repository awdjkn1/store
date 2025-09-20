import React, { useState } from 'react';
import { X, Star, DollarSign, Package, Filter } from 'lucide-react';
import StarRating from '../common/StarRating';

const ProductFilters = ({ 
  filters, 
  onFiltersChange, 
  categories = [], 
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
      category: '',
      priceRange: [0, 1000],
      rating: 0,
      inStock: false
    };
    onFiltersChange(clearedFilters);
    setTempPriceRange([0, 1000]);
  };

  const containerStyle = {
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    padding: '1.5rem',
    height: 'fit-content',
    position: 'relative',
    border: '1px solid #444',
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
    borderBottom: '1px solid #444'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const closeButtonStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#cccccc',
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
    color: '#ffffff',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const categoryButtonStyle = (isActive) => ({
    backgroundColor: isActive ? '#ff6b35' : 'transparent',
    color: isActive ? '#ffffff' : '#cccccc',
    border: isActive ? 'none' : '1px solid #555',
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
    backgroundColor: '#1a1a1a',
    border: '1px solid #555',
    borderRadius: '8px',
    color: '#ffffff',
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
    background: '#555',
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
    accentColor: '#ff6b35',
    cursor: 'pointer'
  };

  const clearButtonStyle = {
    backgroundColor: 'transparent',
    color: '#ff6b35',
    border: '1px solid #ff6b35',
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
    backgroundColor: filters.rating === rating ? 'rgba(255, 107, 53, 0.1)' : 'transparent'
  });

  const activeFiltersStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '1rem'
  };

  const activeFilterTagStyle = {
    backgroundColor: '#ff6b35',
    color: '#ffffff',
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
    
    if (filters.category) {
      tags.push({ type: 'category', label: filters.category, value: '' });
    }
    
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
    
    if (filters.inStock) {
      tags.push({ type: 'inStock', label: 'In Stock', value: false });
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
              backgroundColor: '#ff6b35',
              color: '#ffffff',
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
            e.target.style.backgroundColor = '#444';
            e.target.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#cccccc';
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

      {/* Category Filter */}
      {categories.length > 0 && (
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>
            <Package size={18} />
            Categories
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            <button
              style={categoryButtonStyle(!filters.category)}
              onClick={() => handleFilterChange('category', '')}
              onMouseEnter={(e) => {
                if (!filters.category) {
                  e.target.style.backgroundColor = '#444';
                }
              }}
              onMouseLeave={(e) => {
                if (!filters.category) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category}
                style={categoryButtonStyle(filters.category === category)}
                onClick={() => handleFilterChange('category', category)}
                onMouseEnter={(e) => {
                  if (filters.category !== category) {
                    e.target.style.backgroundColor = '#444';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filters.category !== category) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

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
          <span style={{ color: '#666' }}>to</span>
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
            color: '#999',
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
              <span style={{ color: '#cccccc', fontSize: '0.9rem' }}>
                {rating}+ stars
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* In Stock Filter */}
      <div style={sectionStyle}>
        <label style={checkboxStyle}>
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => handleFilterChange('inStock', e.target.checked)}
            style={checkboxInputStyle}
          />
          <span style={{ color: '#cccccc', fontSize: '0.9rem' }}>
            In Stock Only
          </span>
        </label>
      </div>

      {/* Clear Filters Button */}
      {activeFiltersCount > 0 && (
        <button
          style={clearButtonStyle}
          onClick={clearFilters}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#ff6b35';
            e.target.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#ff6b35';
          }}
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
};

export default ProductFilters;