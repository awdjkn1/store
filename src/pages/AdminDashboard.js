import React, { useState } from 'react';
import AdminLogin from './AdminLogin';
import ProductList from '../components/admin/ProductList';
import AdminStats from '../components/admin/AdminStats';
import ProductFormModal from '../components/admin/ProductFormModal';


const AdminDashboard = () => {
  const [token, setToken] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [refreshProducts, setRefreshProducts] = useState(false);
  const [showModal, setShowModal] = useState(false);

  if (!token) {
    return <AdminLogin onLogin={(t, a) => { setToken(t); setAdmin(a); }} />;
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
        </div>
      </header>
      <AdminStats token={token} />
      <ProductFormModal token={token} show={showModal} onClose={() => setShowModal(false)} onProductCreated={() => setRefreshProducts(r => !r)} />
      <div>
        <ProductList token={token} key={refreshProducts} cardView={true} />
      </div>
    </div>
  );
};

export default AdminDashboard;
