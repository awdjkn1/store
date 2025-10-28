import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const UserPage = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get('/api/orders/mine', { withCredentials: true });
        setOrders(res.data.orders || []);
      } catch (err) {
        setError('Failed to fetch purchased products');
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto' }}>
      <h2>User Profile</h2>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(80,80,160,0.08)', padding: 24, marginBottom: 32 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Username: <span style={{ color: '#ff6b35' }}>{user?.username}</span></div>
        <div style={{ fontSize: 16, marginBottom: 8 }}>Email: {user?.email}</div>
        <button onClick={logout} style={{ marginTop: 12, background: 'linear-gradient(90deg,#ff6b35,#e55a2b)', color: '#fff', fontWeight: 600, fontSize: 16, padding: '0.5rem 1.5rem', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Logout</button>
      </div>
      <h3>Purchased Products</h3>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', margin: '3rem 0' }}>
          <div style={{ fontSize: 22, color: '#444', marginBottom: 16 }}>You have not purchased any products yet.</div>
          <a href="/products" style={{
            display: 'inline-block',
            background: 'linear-gradient(90deg,#ff6b35,#e55a2b)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 18,
            padding: '0.75rem 2rem',
            borderRadius: 8,
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(80,80,160,0.08)',
            marginTop: 12
          }}>Start Shopping</a>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', margin: '3rem 0' }}>
          <div style={{ fontSize: 22, color: '#444', marginBottom: 16 }}>You have not purchased any products yet.</div>
          <a href="/products" style={{
            display: 'inline-block',
            background: 'linear-gradient(90deg,#ff6b35,#e55a2b)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 18,
            padding: '0.75rem 2rem',
            borderRadius: 8,
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(80,80,160,0.08)',
            marginTop: 12
          }}>Start Shopping</a>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(80,80,160,0.08)' }}>
            <thead>
              <tr style={{ background: '#f7f7f7' }}>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Order ID</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Product</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Quantity</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Purchased On</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Shipping Address</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee', color: '#222', fontWeight: 500 }}>{order.id}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee' }}>{order.product_name}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee' }}>{order.quantity}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee' }}>{order.status}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee' }}>{new Date(order.created_at).toLocaleString()}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #eee' }}>{order.shipping_address || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserPage;
