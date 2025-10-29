import React, { useState } from 'react';
import AdminLogin from './AdminLogin';
import ProductList from '../components/admin/ProductList';
import AdminStats from '../components/admin/AdminStats';
import ProductFormModal from '../components/admin/ProductFormModal';
import ChangePasswordModal from '../components/admin/ChangePasswordModal';


const AdminDashboard = () => {
  const [token, setToken] = useState(null);
  const [admin, setAdmin] = useState(null);

  // If a token/admin were stored in localStorage (e.g., pasted from a curl response), use them.
  // No localStorage usage: only set token/admin from login
  const [refreshProducts, setRefreshProducts] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Only render dashboard if both token and admin object with required fields are present
  if (!token || !admin || !admin.id || !admin.username || !admin.role) {
    return <AdminLogin onLogin={(t, a) => {
      setToken(t);
      setAdmin(a);
    }} />;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 16px 48px', fontFamily: 'Segoe UI, Arial, sans-serif', color: '#222' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Welcome, {admin?.username}</h2>
          <p style={{ color: '#666', margin: 0 }}>Admin panel — manage products</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #2563eb', background: '#2563eb', color: 'white', cursor: 'pointer' }} onClick={() => setShowModal(true)}>Create product</button>
          <button style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #6b7280', background: '#fff', color: '#111', cursor: 'pointer' }} onClick={() => setShowChangePassword(true)}>Change password</button>
        </div>
      </header>
      <AdminStats token={token} />
      <ProductFormModal token={token} show={showModal} onClose={() => setShowModal(false)} onProductCreated={() => setRefreshProducts(r => !r)} />
  <ChangePasswordModal token={token} show={showChangePassword} onClose={() => setShowChangePassword(false)} />
      <div>
        <ProductList token={token} key={refreshProducts} cardView={true} />
      </div>
    </div>
  );
};

export default AdminDashboard;
