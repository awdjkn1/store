import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const UserPage = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [invoiceDetails, setInvoiceDetails] = useState({});

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
    <div style={{ maxWidth: 1000, margin: '2rem auto', padding: '0 1rem' }}>
      <h2 style={{ color: 'var(--sb-text)', marginBottom: 12 }}>User Profile</h2>
      <div style={{ background: 'var(--sb-surface)', borderRadius: 12, boxShadow: '0 4px 18px rgba(0,0,0,0.6)', padding: 24, marginBottom: 32, color: 'var(--sb-text)' }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Username: <span style={{ color: 'var(--sb-accent)' }}>{user?.username}</span></div>
        <div style={{ fontSize: 16, marginBottom: 8, color: 'var(--sb-muted)' }}>Email: {user?.email}</div>
        <button onClick={logout} style={{ marginTop: 12, background: 'linear-gradient(90deg,var(--sb-accent),var(--sb-accent-400))', color: 'var(--sb-text)', fontWeight: 600, fontSize: 16, padding: '0.5rem 1.5rem', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Logout</button>
      </div>
      <h3 style={{ color: 'var(--sb-text)', marginBottom: 8 }}>Purchased Products</h3>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
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
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', margin: '3rem 0' }}>
          <div style={{ fontSize: 22, color: 'var(--sb-muted)', marginBottom: 16 }}>You have not purchased any products yet.</div>
          <a href="/products" style={{
            display: 'inline-block',
            background: 'linear-gradient(90deg,var(--sb-accent),var(--sb-accent-400))',
            color: 'var(--sb-text)',
            fontWeight: 600,
            fontSize: 18,
            padding: '0.75rem 2rem',
            borderRadius: 8,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
            marginTop: 12
          }}>Start Shopping</a>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--sb-bg)', borderRadius: 12, boxShadow: '0 6px 26px rgba(0,0,0,0.6)', color: 'var(--sb-text)' }}>
            <thead>
              <tr style={{ background: 'var(--sb-border)' }}>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid var(--sb-border)', textAlign: 'left', color: 'var(--sb-muted)' }}>Order ID</th>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid var(--sb-border)', textAlign: 'left', color: 'var(--sb-muted)' }}>Username</th>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid var(--sb-border)', textAlign: 'left', color: 'var(--sb-muted)' }}>Email</th>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid var(--sb-border)', textAlign: 'left', color: 'var(--sb-muted)' }}>Product</th>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid var(--sb-border)', textAlign: 'left', color: 'var(--sb-muted)' }}>Quantity</th>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid var(--sb-border)', textAlign: 'left', color: 'var(--sb-muted)' }}>Status</th>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid var(--sb-border)', textAlign: 'left', color: 'var(--sb-muted)' }}>Purchased On</th>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid var(--sb-border)', textAlign: 'left', color: 'var(--sb-muted)' }}>Shipping Address</th>
                  <th style={{ padding: '12px 8px', borderBottom: '1px solid var(--sb-border)', textAlign: 'left', color: 'var(--sb-muted)' }}>Invoice</th>
                  <th style={{ padding: '12px 8px', borderBottom: '1px solid var(--sb-border)', textAlign: 'left', color: 'var(--sb-muted)' }}>Invoice No</th>
                  <th style={{ padding: '12px 8px', borderBottom: '1px solid var(--sb-border)', textAlign: 'left', color: 'var(--sb-muted)' }}>Invoice Date</th>
                  <th style={{ padding: '12px 8px', borderBottom: '1px solid var(--sb-border)', textAlign: 'left', color: 'var(--sb-muted)' }}>Invoice Size</th>
                  <th style={{ padding: '12px 8px', borderBottom: '1px solid var(--sb-border)', textAlign: 'left', color: 'var(--sb-muted)' }}>Invoice Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <React.Fragment key={order.id}>
                  <tr style={{ borderBottom: '1px solid var(--sb-border)' }}>
                    <td style={{ padding: '10px 8px', color: 'var(--sb-text)', fontWeight: 500 }}>{order.id}</td>
                  {/* Prefer user info from order (for admins or joined data), fallback to current logged-in user */}
                  <td style={{ padding: '10px 8px' }}>{(order.users && (order.users.username || (Array.isArray(order.users) ? order.users[0]?.username : null))) || user?.username || '-'}</td>
                  <td style={{ padding: '10px 8px' }}>{(order.users && (order.users.email || (Array.isArray(order.users) ? order.users[0]?.email : null))) || user?.email || '-'}</td>
                  <td style={{ padding: '10px 8px' }}>{order.product_name}</td>
                  <td style={{ padding: '10px 8px' }}>{order.quantity}</td>
                  <td style={{ padding: '10px 8px' }}>{order.status}</td>
                  <td style={{ padding: '10px 8px' }}>{new Date(order.created_at).toLocaleString()}</td>
                  <td style={{ padding: '10px 8px' }}>{order.shipping_address || '-'}</td>
                    <td style={{ padding: '10px 8px' }}>
                    <button
                      onClick={async () => {
                        try {
                          if (expandedOrder === order.id) {
                            setExpandedOrder(null);
                            return;
                          }
                          // fetch invoice JSON
                          const resp = await fetch(`/api/orders/${order.id}/invoice`, { credentials: 'include' });
                          if (!resp.ok) throw new Error('Failed to load invoice');
                          const data = await resp.json();
                          setInvoiceDetails(prev => ({ ...prev, [order.id]: data.invoice || data }));
                          setExpandedOrder(order.id);
                        } catch (e) {
                          alert('Failed to load invoice details');
                        }
                      }}
                      style={{ background: 'var(--sb-accent)', color: 'var(--sb-text)', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}
                    >
                      Details
                    </button>
                    {order.invoice && order.invoice.invoice_number && (
                      <span style={{ marginLeft: 8, color: 'var(--sb-accent-400)', fontSize: 12 }}>Stored</span>
                    )}
                  </td>
                  </tr>
                  {expandedOrder === order.id && (
                    <tr style={{ background: 'var(--sb-bg)' }}>
                      <td colSpan={9} style={{ padding: 12 }}>
                        <div style={{ color: 'var(--sb-muted)' }}>
                          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: 'var(--sb-text)', margin: 0 }}>{JSON.stringify(invoiceDetails[order.id] || (order.invoice && order.invoice.content) || { message: 'No invoice details' }, null, 2)}</pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserPage;
