import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import ProductList from '../components/admin/ProductList';
import UserList from '../components/admin/UserList';
import OrderList from '../components/admin/OrderList';
import AdminStats from '../components/admin/AdminStats';
import ProductFormModal from '../components/admin/ProductFormModal';
import ChangePasswordModal from '../components/admin/ChangePasswordModal';
// Import your new upload modal
import ProductImageUploadModal from '../components/admin/ProductImageUploadModal'; 

// NOTE: We no longer need 'apiService' or the 'token' state
// const apiService = require('../services/api'); -- REMOVED
// const [token, setToken] = useState(null); -- REMOVED

const AdminDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [refreshProducts, setRefreshProducts] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // This state will hold the product created in Step 1
  const [productToUploadTo, setProductToUploadTo] = useState(null);

  // Page-level data
  const [pageProducts, setPageProducts] = useState([]);
  const [pageUsers, setPageUsers] = useState([]);
  const [pageOrders, setPageOrders] = useState([]);
  const [pageStats, setPageStats] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState('');

  // This Effect correctly checks for a cookie session on page load
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/test', { credentials: 'include' });
        if (res.ok) {
          const d = await res.json();
          if (d && d.admin) setAdmin(d.admin);
        }
      } catch (e) { /* ignore */ }
    };
    checkSession();
  }, []);

  // This Effect loads data once the 'admin' object is set
  useEffect(() => {
    if (!admin) return;
    const load = async () => {
      setPageLoading(true);
      setPageError('');
      try {
        // All these fetches now rely on 'credentials: "include"' (the cookie)
        const prodResp = await fetch('/api/products', { credentials: 'include' });
        const prodJson = await prodResp.json().catch(() => ({}));
        const products = prodJson.products || [];
        setPageProducts(products);

        const usersResp = await fetch('/api/admin/users', { credentials: 'include' });
        const usersJson = await usersResp.json().catch(() => ({}));
        const users = usersJson.users || [];
        setPageUsers(users);

        const ordersResp = await fetch('/api/admin/orders', { credentials: 'include' });
        const ordersJson = await ordersResp.json().catch(() => ({}));
        const orders = ordersJson.orders || [];
        setPageOrders(orders);

        setPageStats({
          products: products.length,
          users: users.length,
          orders: orders.length
        });
      } catch (err) {
        const msg = (err && (err.payload || err.message)) || 'Failed to load admin data';
        setPageError(String(msg));
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [admin, refreshProducts]); // Also re-load when 'refreshProducts' changes

  // This is the new callback for the "Create Product" modal
  const handleProductCreated = (newProduct) => {
    setShowModal(false);         // Close the create modal
    setRefreshProducts(r => !r); // Refresh the product list
    setProductToUploadTo(newProduct); // Open the upload modal
  };

  // Login screen
  if (!admin || !admin.id || !admin.username || !admin.role) {
    return <AdminLogin onLogin={(t, a) => {
      // We still get the 'admin' object from the login
      setAdmin(a);
      // We NO LONGER need to set the token in state or apiService
    }} />;
  }

  // Main dashboard
  return (
    <div style={{ /* ... */ }}>
      <header style={{ /* ... */ }}>
        {/* ... (your header buttons) ... */}
        <button onClick={() => setShowModal(true)}>Create product</button>
        <button onClick={() => setShowChangePassword(true)}>Change password</button>
        <button onClick={async () => {
          try {
            await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
          } catch (e) { /* ignore */ }
          setAdmin(null);
        }}>Logout</button>
      </header>

      {/* --- ALL 'token={token}' PROPS ARE REMOVED --- */}
      
      <AdminStats stats={pageStats} />
      
      <ProductFormModal 
        show={showModal} 
        onClose={() => setShowModal(false)} 
        onProductCreated={handleProductCreated} 
      />
      
      <ProductImageUploadModal 
        show={!!productToUploadTo}
        product={productToUploadTo}
        onClose={() => setProductToUploadTo(null)}
        onUploadSuccess={() => {
          setProductToUploadTo(null); // Close modal on success
          setRefreshProducts(r => !r); // Refresh list to show new images
        }}
      />

      <ChangePasswordModal show={showChangePassword} onClose={() => setShowChangePassword(false)} />
      
      <div>
        {pageError && <div style={{ color: 'var(--sb-error)', marginBottom: 12 }}>{pageError}</div>}
        <ProductList cardView={false} initialProducts={pageProducts} />
        <UserList initialUsers={pageUsers} />
        <OrderList initialOrders={pageOrders} />
      </div>
    </div>
  );
};

export default AdminDashboard;
