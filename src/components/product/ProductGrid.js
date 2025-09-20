import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import LoadingSpinner from '../common/LoadingSpinner';
import { Grid, List, Filter, SortAsc, SortDesc } from 'lucide-react';

const ProductGrid = ({ 
  products = [], 
  loading = false, 
  showFilters = true,
  itemsPerPage = 12 
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'price-low', 'price-high', 'rating', 'newest'
  const [currentPage, setCurrentPage] = useState(1);
  const [sortedProducts, setSortedProducts] = useState([]);

  // Sort products based on selected option
  useEffect(() => {
    let sorted = [...products];
    
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default: // 'featured'
        // Keep original order for featured
        break;
    }
    
    setSortedProducts(sorted);
    setCurrentPage(1); // Reset to first page when sorting changes
  }, [products, sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

  const containerStyle = {
    width: '100%'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    padding: '0 1rem',
    flexWrap: 'wrap',
    gap: '1rem'
  };

  const resultsInfoStyle = {
    color: '#cccccc',
    fontSize: '0.9rem'
  };

  const controlsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap'
  };

  const sortSelectStyle = {
    backgroundColor: '#2d2d2d',
    color: '#ffffff',
    border: '1px solid #444',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
    cursor: 'pointer',
    outline: 'none'
  };

  const viewToggleStyle = {
    display: 'flex',
    backgroundColor: '#2d2d2d',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #444'
  };

  const viewButtonStyle = (isActive) => ({
    backgroundColor: isActive ? '#ff6b35' : 'transparent',
    color: isActive ? '#ffffff' : '#cccccc',
    border: 'none',
    padding: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });

  const gridContainerStyle = {
    display: viewMode === 'grid' ? 'grid' : 'flex',
    flexDirection: viewMode === 'list' ? 'column' : 'row',
    gridTemplateColumns: viewMode === 'grid' 
      ? 'repeat(auto-fill, minmax(280px, 1fr))' 
      : 'none',
    gap: viewMode === 'grid' ? '2rem' : '1rem',
    padding: '1rem'
  };

  const paginationStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '3rem',
    padding: '2rem 1rem'
  };

  const pageButtonStyle = (isActive = false, isDisabled = false) => ({
    backgroundColor: isActive ? '#ff6b35' : '#2d2d2d',
    color: isActive ? '#ffffff' : isDisabled ? '#666' : '#cccccc',
    border: '1px solid #444',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    minWidth: '40px',
    textAlign: 'center'
  });

  const noProductsStyle = {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#666'
  };

  const noProductsIconStyle = {
    fontSize: '4rem',
    marginBottom: '1rem',
    opacity: 0.5
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div style={noProductsStyle}>
        <div style={noProductsIconStyle}>📦</div>
        <h3 style={{ marginBottom: '0.5rem', color: '#cccccc' }}>No products found</h3>
        <p>Try adjusting your search criteria or filters</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header with controls */}
      {showFilters && (
        <div style={headerStyle}>
          <div style={resultsInfoStyle}>
            Showing {startIndex + 1}-{Math.min(endIndex, sortedProducts.length)} of {sortedProducts.length} products
          </div>
          
          <div style={controlsStyle}>
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={sortSelectStyle}
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
              <option value="name">Name A-Z</option>
            </select>

            {/* View Toggle */}
            <div style={viewToggleStyle}>
              <button
                style={viewButtonStyle(viewMode === 'grid')}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <Grid size={16} />
              </button>
              <button
                style={viewButtonStyle(viewMode === 'list')}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid/List */}
      <div style={gridContainerStyle}>
        {currentProducts.map(product => (
          <ProductCard 
            key={product.id} 
            product={product}
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={paginationStyle}>
          <button
            style={pageButtonStyle(false, currentPage === 1)}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>

          {/* Page Numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                style={pageButtonStyle(currentPage === pageNum)}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span style={{ color: '#666', padding: '0 0.5rem' }}>...</span>
              <button
                style={pageButtonStyle()}
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            style={pageButtonStyle(false, currentPage === totalPages)}
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;