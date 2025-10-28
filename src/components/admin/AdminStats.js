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
          axios.get('/api/admin/products', { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }),
          axios.get('/api/admin/users', { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }),
          axios.get('/api/admin/orders', { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
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
    <div style={{ marginBottom: 24 }}>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 24, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ background: 'linear-gradient(90deg, #f3f4f6 60%, #e0e7ff 100%)', borderRadius: 12, boxShadow: '0 2px 8px rgba(80,80,160,0.08)', padding: '18px 28px', display: 'flex', alignItems: 'center', minWidth: 160, gap: 16 }}>
          <FaBoxOpen style={{ fontSize: '2.2rem', color: '#2563eb' }} />
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#222' }}>{stats.products}</div>
            <div style={{ fontSize: '1rem', color: '#555' }}>Products</div>
          </div>
        </div>
        <div style={{ background: 'linear-gradient(90deg, #f3f4f6 60%, #e0e7ff 100%)', borderRadius: 12, boxShadow: '0 2px 8px rgba(80,80,160,0.08)', padding: '18px 28px', display: 'flex', alignItems: 'center', minWidth: 160, gap: 16 }}>
          <FaUserFriends style={{ fontSize: '2.2rem', color: '#2563eb' }} />
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#222' }}>{stats.users}</div>
            <div style={{ fontSize: '1rem', color: '#555' }}>Users</div>
          </div>
        </div>
        <div style={{ background: 'linear-gradient(90deg, #f3f4f6 60%, #e0e7ff 100%)', borderRadius: 12, boxShadow: '0 2px 8px rgba(80,80,160,0.08)', padding: '18px 28px', display: 'flex', alignItems: 'center', minWidth: 160, gap: 16 }}>
          <FaClipboardList style={{ fontSize: '2.2rem', color: '#2563eb' }} />
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#222' }}>{stats.orders}</div>
            <div style={{ fontSize: '1rem', color: '#555' }}>Orders</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
