import React, { useState, useEffect } from 'react';
import ProductService from '../services/productService';
import { useSearchParams } from 'react-router-dom';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilters from '../components/product/ProductFilters';
import CartDrawer from '../components/cart/CartDrawer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProductSkeleton from '../components/common/ProductSkeleton';
import { useApp } from '../context/AppContext';
import { Filter, X, SlidersHorizontal, Grid as GridIcon, Home as HomeIcon } from 'lucide-react';



const Products = () => {
  const { showCart, toggleCart, searchQuery, loading, products, setProducts } = useApp();
  const [searchParams] = useSearchParams();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [serverPage, setServerPage] = useState(1);
  const [serverLimit, setServerLimit] = useState(12);
  const [serverPagination, setServerPagination] = useState({ page: 1, limit: 12 });
  const [isLoadingPage, setIsLoadingPage] = useState(false);
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
      setIsLoadingPage(true);
      try {
        const resp = await ProductService.getProducts({ page: serverPage, limit: serverLimit });
        console.log('ProductService.getProducts response:', resp);
        const fetched = resp.products || [];
        // Populate global products so other pages can react to updates (ratings)
        setProducts(fetched);
        setServerPagination(resp.pagination || { page: serverPage, limit: serverLimit });
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setIsLoadingPage(false);
      }
    };
    loadProducts();
  }, [setProducts, serverPage, serverLimit]);

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
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const breadcrumbLinkStyle = {
    color: 'var(--sb-accent)',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem'
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
    <div style={pageStyle} className="page-container">
      <div style={containerStyle} className="app-container">
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
              <a href="/" style={breadcrumbLinkStyle} aria-label="Home">
                <HomeIcon size={16} />
              </a>
              <span style={{ margin: '0 0.5rem', color: 'var(--sb-border)' }}>/</span>
              <a href="/products" style={breadcrumbLinkStyle} aria-label="Products">
                <GridIcon size={16} />
              </a>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => setServerPage(Math.max(1, serverPage - 1))}
                style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--sb-border)', background: 'transparent', cursor: 'pointer' }}
                disabled={serverPage <= 1}
              >
                Previous
              </button>
              <span style={{ color: 'var(--sb-muted)' }}>
                {`Page ${serverPagination.page || serverPage}`}
                {serverPagination.total ? ` of ${Math.ceil((serverPagination.total || 0) / (serverPagination.limit || serverLimit))}` : ''}
              </span>
              <button
                onClick={() => setServerPage((serverPage || 1) + 1)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--sb-border)', background: 'transparent', cursor: 'pointer' }}
                disabled={serverPagination.total ? (serverPage * serverPagination.limit >= serverPagination.total) : false}
              >
                Next
              </button>
            </div>

            <button
              style={filtersToggleStyle}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <X size={24} /> : <SlidersHorizontal size={24} />}
            </button>
          </div>

          {/* Products Grid */}
          {isLoadingPage ? (
            <div style={{ padding: '1rem' }}>
              <div className="product-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : (
            <ProductGrid 
              products={filteredProducts}
              loading={loading}
              showFilters={true}
              disableClientPagination={true}
            />
          )}
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
      <CartDrawer isOpen={showCart} onClose={toggleCart} />
    </div>
  );
};

export default Products;