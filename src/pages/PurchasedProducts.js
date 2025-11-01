import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PurchasedProducts = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Use cookie-based auth; axios defaults to withCredentials from setup
        const res = await axios.get('/api/orders/mine', { withCredentials: true });
        setOrders(res.data.orders || []);
      } catch (err) {
        setError('Failed to fetch purchased products');
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return (
    <div style={{ textAlign: 'center', margin: '3rem 0' }}>
      <div style={{ fontSize: 22, color: 'var(--sb-border)', marginBottom: 16 }}>You have not purchased any products yet.</div>
      <a href="/products" style={{
        display: 'inline-block',
        background: 'linear-gradient(90deg,var(--sb-accent),var(--sb-accent-400))',
        color: 'var(--sb-text)',
        fontWeight: 600,
        fontSize: 18,
        padding: '0.75rem 2rem',
        borderRadius: 8,
        textDecoration: 'none',
        boxShadow: '0 2px 8px rgba(80,80,160,0.08)',
        marginTop: 12
      }}>Start Shopping</a>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto' }}>
      <h2>Purchased Products</h2>
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', margin: '3rem 0' }}>
    <div style={{ fontSize: 22, color: 'var(--sb-muted)', marginBottom: 16 }}>You have not purchased any products yet.</div>
          <a href="/products" style={{
            display: 'inline-block',
            background: 'linear-gradient(90deg, var(--sb-accent), var(--sb-accent-700))',
            color: 'var(--sb-text)',
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
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--sb-cta-surface)', borderRadius: 12, boxShadow: '0 2px 8px rgba(80,80,160,0.08)' }}>
            <thead>
              <tr style={{ background: 'var(--sb-cta-surface)' }}>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid var(--sb-border)', textAlign: 'left' }}>Order ID</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid var(--sb-border)', textAlign: 'left' }}>Product</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid var(--sb-border)', textAlign: 'left' }}>Quantity</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid var(--sb-border)', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid var(--sb-border)', textAlign: 'left' }}>Purchased On</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid var(--sb-border)', textAlign: 'left' }}>Shipping Address</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--sb-border)', color: 'var(--sb-cta-text)', fontWeight: 500 }}>{order.id}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--sb-border)' }}>{order.product_name}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--sb-border)' }}>{order.quantity}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--sb-border)' }}>{order.status}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--sb-border)' }}>{new Date(order.created_at).toLocaleString()}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--sb-border)' }}>{order.shipping_address || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PurchasedProducts;
