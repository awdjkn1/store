import React, { useState, useEffect } from 'react';
import ProductService from '../services/productService';
import { useSearchParams } from 'react-router-dom';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilters from '../components/product/ProductFilters';
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
    // category removed per request
    priceRange: [0, 1000],
    rating: 0,
    // removed inStock per request
  });

  // Load products from backend API on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const resp = await ProductService.getProducts();
        console.log('ProductService.getProducts response:', resp);
        const products = resp.products || [];
        setProducts(products);
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    loadProducts();
  }, []);

  // Listen for rating updates from other parts of the UI (ProductDetail / ProductCard)
  useEffect(() => {
    const handler = (e) => {
      try {
        const detail = e.detail || {};
        const pid = detail.productId;
        const newRating = detail.rating;
        const newCount = detail.reviewCount;
        if (!pid) return;
        setProducts(prev => {
          const updated = prev.map(p => {
            if (p.id !== pid) return p;
            // If API supplied new rating/count use it, otherwise fetch a loose estimate
            return {
              ...p,
              rating: typeof newRating === 'number' ? newRating : p.rating,
              reviewCount: typeof newCount === 'number' ? newCount : (Number(p.reviewCount || 0) + 1)
            };
          });
          return updated;
        });
      } catch (err) {
        console.warn('product:rating-updated handler error', err);
      }
    };

    window.addEventListener('product:rating-updated', handler);
    return () => window.removeEventListener('product:rating-updated', handler);
  }, []);

  // Handle search from URL params
  useEffect(() => {
    const searchTerm = searchParams.get('search');
    if (searchTerm) {
      // Filter products by search term only (ignore category)
      const filtered = products.filter(product =>
        product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    // Category filter removed per request

    // Price range filter — derive numeric price from backend's price_shipping_included
    const parsePrice = (p) => {
      if (p === undefined || p === null) return NaN;
      if (typeof p === 'number') return p;
      try {
        const num = parseFloat(String(p).replace(/[^0-9.-]+/g, ''));
        return isNaN(num) ? NaN : num;
      } catch (e) {
        return NaN;
      }
    };

    filtered = filtered.filter(product => {
      const price = parsePrice(product.price || product.price_shipping_included);
      // If price is not a number, include the product so it's not accidentally filtered out
      if (isNaN(price)) return true;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Rating filter — only apply when product has a numeric rating
    if (filters.rating > 0) {
      filtered = filtered.filter(product => 
        typeof product.rating === 'number' ? product.rating >= filters.rating : true
      );
    }

    // Stock filter removed per request

    setFilteredProducts(filtered);
    console.log('Filtered products count:', filtered.length);
  }, [products, filters, searchQuery, searchParams]);

  const pageStyle = {
    backgroundColor: 'var(--sb-bg)',
    minHeight: '100vh',
    color: 'var(--sb-text)'
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
  backgroundColor: 'var(--sb-accent)',
  color: 'var(--sb-text)',
    border: 'none',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(0,77,64,0.14)',
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
  backgroundColor: showFilters ? 'var(--sb-surface)' : 'transparent',
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
    color: 'var(--sb-text)'
  };

  const breadcrumbStyle = {
    color: 'var(--sb-muted)',
    fontSize: '1rem',
    marginBottom: '1rem'
  };

  const breadcrumbLinkStyle = {
    color: 'var(--sb-accent)',
    textDecoration: 'none'
  };

  const resultsHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    padding: '1rem 0',
    borderBottom: '1px solid var(--sb-border)'
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

  // Categories removed from products page UI per request
  const categories = [];

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
              <span style={{ margin: '0 0.5rem', color: 'var(--sb-border)' }}>/</span>
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
            <p style={{ color: 'var(--sb-muted)', margin: 0 }}>
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
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Filter size={24} />
      </button>

      {/* Cart Drawer */}
  {/* Cart is now a dedicated page at /cart; CartDrawer removed */}
    </div>
  );
};

export default Products;