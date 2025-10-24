import React, { useState, useEffect } from 'react';
import ProductService from '../services/productService';
import { useSearchParams } from 'react-router-dom';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilters from '../components/product/ProductFilters';
import CartDrawer from '../components/cart/CartDrawer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useApp } from '../context/AppContext';
import { Filter, X, SlidersHorizontal } from 'lucide-react';



const Products = () => {
  const { showCart, toggleCart, searchQuery, loading } = useApp();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: [0, 1000],
    rating: 0,
    inStock: false
  });

  // Load products from backend API on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { products } = await ProductService.getProducts();
        setProducts(products);
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    loadProducts();
  }, []);

  // Handle search from URL params
  useEffect(() => {
    const searchTerm = searchParams.get('search');
    if (searchTerm) {
      // Filter products by search term
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchParams, products]);

  // Apply filters
  useEffect(() => {
    let filtered = [...products];

    // Search filter
    const searchTerm = searchParams.get('search') || searchQuery;
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(product => 
        product.category === filters.category
      );
    }

    // Price range filter
    filtered = filtered.filter(product => 
      product.price >= filters.priceRange[0] && 
      product.price <= filters.priceRange[1]
    );

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(product => 
        product.rating >= filters.rating
      );
    }

    // Stock filter
    if (filters.inStock) {
      filtered = filtered.filter(product => 
        product.inStock !== false
      );
    }

    setFilteredProducts(filtered);
  }, [products, filters, searchQuery, searchParams]);

  const pageStyle = {
    backgroundColor: '#1a1a1a',
    minHeight: '100vh',
    color: '#ffffff'
  };

  const containerStyle = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem',
    display: 'flex',
    gap: '2rem'
  };

  const filtersToggleStyle = {
    display: 'none',
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    backgroundColor: '#ff6b35',
    color: '#ffffff',
    border: 'none',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(255, 107, 53, 0.4)',
    zIndex: 1000,
    transition: 'all 0.3s ease'
  };

  const sidebarStyle = {
    width: '300px',
    flexShrink: 0,
    position: showFilters ? 'fixed' : 'sticky',
    top: showFilters ? 0 : '100px',
    left: showFilters ? 0 : 'auto',
    height: showFilters ? '100vh' : 'fit-content',
    backgroundColor: showFilters ? '#1a1a1a' : 'transparent',
    zIndex: showFilters ? 1000 : 'auto',
    transform: showFilters ? 'translateX(0)' : 'translateX(0)',
    transition: 'transform 0.3s ease'
  };

  const mainContentStyle = {
    flex: 1,
    minWidth: 0
  };

  const headerStyle = {
    marginBottom: '2rem'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#ffffff'
  };

  const breadcrumbStyle = {
    color: '#cccccc',
    fontSize: '1rem',
    marginBottom: '1rem'
  };

  const breadcrumbLinkStyle = {
    color: '#ff6b35',
    textDecoration: 'none'
  };

  const resultsHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    padding: '1rem 0',
    borderBottom: '1px solid #333'
  };

  const mobileFiltersOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 999,
    display: showFilters ? 'block' : 'none'
  };

  // Get unique categories for filter
  const categories = [...new Set(products.map(product => product.category))];

  if (loading) {
    return (
      <div style={pageStyle}>
        <LoadingSpinner fullScreen text="Loading products..." />
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Mobile Filters Overlay */}
        <div 
          style={mobileFiltersOverlayStyle}
          onClick={() => setShowFilters(false)}
        />

        {/* Filters Sidebar */}
        <aside style={sidebarStyle}>
          <ProductFilters
            filters={filters}
            onFiltersChange={setFilters}
            categories={categories}
            showMobile={showFilters}
            onClose={() => setShowFilters(false)}
          />
        </aside>

        {/* Main Content */}
        <main style={mainContentStyle}>
          {/* Page Header */}
          <header style={headerStyle}>
            <nav style={breadcrumbStyle}>
              <a href="/" style={breadcrumbLinkStyle}>Home</a>
              <span style={{ margin: '0 0.5rem', color: '#666' }}>/</span>
              <span>Products</span>
            </nav>
            
            <h1 style={titleStyle}>
              {searchParams.get('search') 
                ? `Search Results for "${searchParams.get('search')}"` 
                : 'All Products'
              }
            </h1>
          </header>

          {/* Results Header */}
          <div style={resultsHeaderStyle}>
            <p style={{ color: '#cccccc', margin: 0 }}>
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </p>
            
            <button
              style={filtersToggleStyle}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <X size={24} /> : <SlidersHorizontal size={24} />}
            </button>
          </div>

          {/* Products Grid */}
          <ProductGrid 
            products={filteredProducts}
            loading={loading}
            showFilters={true}
          />
        </main>
      </div>

      {/* Mobile Filters Toggle Button */}
      <button
        style={{
          ...filtersToggleStyle,
          display: window.innerWidth <= 768 ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={() => setShowFilters(!showFilters)}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        <Filter size={24} />
      </button>

      {/* Cart Drawer */}
      <CartDrawer isOpen={showCart} onClose={toggleCart} />
    </div>
  );
};

export default Products;