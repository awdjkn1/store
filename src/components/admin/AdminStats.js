import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaBoxOpen, FaUserFriends, FaClipboardList } from 'react-icons/fa';

const AdminStats = ({ token }) => {
  const [stats, setStats] = useState({ products: 0, users: 0, orders: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, usersRes, ordersRes] = await Promise.all([
          axios.get('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setStats({
          products: productsRes.data.products?.length || 0,
          users: usersRes.data.users?.length || 0,
          orders: ordersRes.data.orders?.length || 0
        });
      } catch (err) {
        setError('Failed to fetch stats');
      }
    };
    fetchStats();
  }, [token]);

  return (
    <div className="admin-stats">
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div className="stats-cards">
        <div className="stat-card">
          <FaBoxOpen className="stat-icon" />
          <div>
            <div className="stat-value">{stats.products}</div>
            <div className="stat-label">Products</div>
          </div>
        </div>
        <div className="stat-card">
          <FaUserFriends className="stat-icon" />
          <div>
            <div className="stat-value">{stats.users}</div>
            <div className="stat-label">Users</div>
          </div>
        </div>
        <div className="stat-card">
          <FaClipboardList className="stat-icon" />
          <div>
            <div className="stat-value">{stats.orders}</div>
            <div className="stat-label">Orders</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
