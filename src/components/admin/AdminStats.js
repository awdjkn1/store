import React, { useEffect, useState } from 'react';
// Use fetch instead of axios for stats, matching products page logic
import { FaBoxOpen, FaUserFriends, FaClipboardList } from 'react-icons/fa';

const AdminStats = ({ token, stats: initialStats }) => {
  const [stats, setStats] = useState(initialStats || { products: 0, users: 0, orders: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    // If initialStats was provided by parent, skip fetching
    if (initialStats) return;

    const fetchStats = async () => {
      try {
        // include Authorization header when token prop is provided
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const fetchJson = async (url) => {
          const res = await fetch(url, { headers, credentials: 'include' });
          const payload = await res.json().catch(() => null);
          if (!res.ok) {
            const msg = payload && payload.error ? payload.error : `${res.status} ${res.statusText}`;
            const err = new Error(msg);
            err.status = res.status;
            err.payload = payload;
            throw err;
          }
          return payload;
        };

        const [productsRes, usersRes, ordersRes] = await Promise.all([
          fetchJson('/api/admin/products'),
          fetchJson('/api/admin/users'),
          fetchJson('/api/admin/orders')
        ]);

        // backend returns plain JSON objects like { products: [...] }
        setStats({
          products: productsRes?.products?.length || 0,
          users: usersRes?.users?.length || 0,
          orders: ordersRes?.orders?.length || 0
        });
      } catch (err) {
        let msg = 'Failed to fetch stats';
        if (err && err.status === 401) {
          msg += ': Unauthorized (401) - make sure you are signed in as an admin.';
        } else if (err && err.payload && err.payload.error) {
          msg += ': ' + err.payload.error;
        } else if (err && err.message) {
          msg += ': ' + err.message;
        }
        setError(msg);
        console.error('AdminStats error:', err);
      }
    };
    fetchStats();
  }, [token, initialStats]);

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
}; // Correctly closing the AdminStats component

export default AdminStats;
