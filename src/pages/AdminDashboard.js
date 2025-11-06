import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import ProductList from '../components/admin/ProductList';
import UserList from '../components/admin/UserList';
import OrderList from '../components/admin/OrderList';
import AdminStats from '../components/admin/AdminStats';
import ProductFormModal from '../components/admin/ProductFormModal';
import ChangePasswordModal from '../components/admin/ChangePasswordModal';
import apiService from '../services/api';
import adminLogger from '../utils/adminLogger';
// Use a simple fetch to the public products endpoint (same shape as productService)

// Use the browser fetch API (no axios) for admin-protected requests

const AdminDashboard = () => {
  const [token, setToken] = useState(null);
  const [admin, setAdmin] = useState(null);

  // If a token/admin were stored in localStorage (e.g., pasted from a curl response), use them.
  // No localStorage usage: only set token/admin from login
  const [refreshProducts, setRefreshProducts] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Page-level data (declare hooks unconditionally to avoid breaking rules of hooks)
  const [pageProducts, setPageProducts] = useState([]);
  const [pageUsers, setPageUsers] = useState([]);
  const [pageOrders, setPageOrders] = useState([]);
  const [pageStats, setPageStats] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState('');

  // Try to detect existing server session via cookie (no localStorage). If we don't
  // have an admin object yet, show the login screen. The server cookie (httpOnly)
  // will be sent automatically with requests.
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/test', { credentials: 'include' });
        if (res.ok) {
          const d = await res.json();
          if (d && d.admin) setAdmin(d.admin);
          // log admin access
          try { adminLogger.log('admin_dashboard_access', { admin: d && d.admin && d.admin.username }); } catch (e) {}
        }
      } catch (e) {
        // ignore - user not logged in
      }
    };
    checkSession();
  }, []);

  // Fetch products and stats directly on the dashboard (using admin endpoints)
  useEffect(() => {
    if (!admin) return;
    const load = async () => {
      setPageLoading(true);
      setPageError('');
      try {
        // Fetch products
        const prodResp = await fetch('/api/products', { credentials: 'include' });
        const prodJson = await prodResp.json().catch(() => ({}));
        const products = prodJson.products || [];
        console.log('[AdminDashboard] Products:', products);
        setPageProducts(products);
        // Declare users and orders before using them
        const usersResp = await fetch('/api/admin/users', { credentials: 'include' });
        const usersJson = await usersResp.json().catch(() => ({}));
        const users = usersJson.users || [];
        setPageUsers(users);

        const ordersResp = await fetch('/api/admin/orders', { credentials: 'include' });
        const ordersJson = await ordersResp.json().catch(() => ({}));
        const orders = ordersJson.orders || [];
        setPageOrders(orders);

        // Stats
        const statsObj = {
          products: products.length,
          users: users.length,
          orders: orders.length
        };
        setPageStats(statsObj);
      } catch (err) {
        const msg = (err && (err.payload || err.message)) || 'Failed to load admin data';
        console.error('AdminDashboard load error:', msg, err);
        setPageError(String(msg));
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [admin]);

  // Only render dashboard if an admin object with required fields is present
  if (!admin || !admin.id || !admin.username || !admin.role) {
    return <AdminLogin onLogin={(t, a) => {
      setToken(t);
      setAdmin(a);
      // Configure shared apiService with the token so admin API calls can use the
      // Authorization header as a fallback to cookie-based auth.
      try { apiService.setAuthToken(t); } catch (e) { /* ignore */ }
    }} />;
  }

  return (
  <div style={{ maxWidth: 1200, margin: '32px auto', padding: '0 24px 48px', fontFamily: 'Segoe UI, Arial, sans-serif', color: 'var(--sb-text)', background: 'var(--sb-bg)', borderRadius: 16, boxShadow: 'var(--sb-shadow)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '2rem', color: 'var(--sb-accent)', fontWeight: 700 }}>Welcome, {admin?.username}</h2>
          <p style={{ color: 'var(--sb-muted)', margin: 0, fontSize: '1.1rem' }}>Admin panel — manage products</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--sb-accent-400)', background: 'var(--sb-accent-400)', color: 'var(--sb-accent-on)', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: 'var(--sb-shadow)' }} onClick={() => setShowModal(true)}>Create product</button>
          <button style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--sb-accent)', background: 'var(--sb-accent)', color: 'var(--sb-accent-on)', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: 'var(--sb-shadow)' }} onClick={() => { setShowChangePassword(true); try { adminLogger.log('admin_change_password_open', { admin: admin && admin.username }); } catch (e) {} }}>Change password</button>
          <button style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--sb-border)', background: 'var(--sb-surface)', color: 'var(--sb-text)', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: 'var(--sb-shadow)' }} onClick={async () => {
            // Call logout endpoint which clears the httpOnly cookie, then clear client state
            try {
              await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
            } catch (e) {
              console.warn('Logout request failed', e && e.message);
            }
            // Clear client-side token and remove from shared apiService
            try { apiService.removeAuthToken(); } catch (e) { /* ignore */ }
            try { adminLogger.log('admin_logout', { admin: admin && admin.username }); } catch (e) {}
            setToken(null);
            setAdmin(null);
          }}>Logout</button>
        </div>
      </header>
  {pageLoading && <div style={{ padding: 12, background: 'var(--sb-cta-surface)', borderRadius: 6, marginBottom: 12, color: 'var(--sb-warning)' }}>Loading admin data…</div>}
      <AdminStats token={token} stats={pageStats} />
      <ProductFormModal token={token} show={showModal} onClose={() => setShowModal(false)} onProductCreated={() => setRefreshProducts(r => !r)} />
  <ChangePasswordModal token={token} show={showChangePassword} onClose={() => setShowChangePassword(false)} />
      <div>
  {pageError && <div style={{ color: 'var(--sb-error)', marginBottom: 12 }}>{pageError}</div>}
         <ProductList token={token} key={refreshProducts} cardView={false} initialProducts={pageProducts} />
         <UserList initialUsers={pageUsers} />
         <OrderList initialOrders={pageOrders} />
        {/* Debug output removed for production-like UI; data still loaded into lists above */}
      </div>
    </div>
  );
};

  // ...existing code...
export default AdminDashboard;
