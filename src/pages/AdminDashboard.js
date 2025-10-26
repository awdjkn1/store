import React, { useState } from 'react';
import AdminLogin from './AdminLogin';
import ProductList from '../components/admin/ProductList';
import AdminStats from '../components/admin/AdminStats';
import ProductFormModal from '../components/admin/ProductFormModal';
import '../styles/admin.css';

const AdminDashboard = () => {
  const [token, setToken] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [refreshProducts, setRefreshProducts] = useState(false);
  const [showModal, setShowModal] = useState(false);

  if (!token) {
    return <AdminLogin onLogin={(t, a) => { setToken(t); setAdmin(a); }} />;
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h2>Welcome, {admin?.username}</h2>
          <p className="muted">Admin panel — manage products</p>
        </div>
        <div className="admin-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create product</button>
        </div>
      </header>
      <AdminStats token={token} />
      <ProductFormModal token={token} show={showModal} onClose={() => setShowModal(false)} onProductCreated={() => setRefreshProducts(r => !r)} />
      <div className="admin-products-grid">
        <ProductList token={token} key={refreshProducts} cardView={true} />
      </div>
    </div>
  );
};

export default AdminDashboard;
