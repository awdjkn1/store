import React, { useState, useEffect, useMemo } from 'react';

const OrderList = ({ initialOrders }) => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const providedOrders = useMemo(() => (initialOrders || []), [initialOrders]);

  useEffect(() => {
    if (providedOrders && providedOrders.length > 0) {
      setOrders(providedOrders);
      setError('');
      // log admin viewing orders (non-blocking)
      (async () => {
        try {
          const adminLogger = (await import('../../utils/adminLogger')).default;
          adminLogger.log('admin_view_orders', { count: providedOrders.length });
        } catch (e) {
          try { console.warn('[OrderList] adminLogger failed', e && e.message); } catch (er) {}
        }
      })();
      return;
    }
    setOrders([]);
    setError('No orders found.');
    // log that orders fetch returned empty / error state
    (async () => {
      try {
        const adminLogger = (await import('../../utils/adminLogger')).default;
        adminLogger.log('admin_view_orders_empty', {});
      } catch (e) {
        try { console.warn('[OrderList] adminLogger failed', e && e.message); } catch (er) {}
      }
    })();
  }, [providedOrders]);

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ marginTop: 0, color: '#ff6b35' }}>Orders</h3>
      {error && <div style={{ color: '#fca5a5', padding: 12, background: '#111', borderRadius: 8, marginBottom: 12 }}>{error}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#111', borderRadius: 8, overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#0f1724' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9ca3af' }}>#</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9ca3af' }}>Status</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9ca3af' }}>Total Price</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9ca3af' }}>Shipping Address</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9ca3af' }}>Created At</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9ca3af' }}>User ID</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9ca3af' }}>Order ID</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o, idx) => (
            <tr key={o.id} style={{ borderBottom: '1px solid #0b1220' }}>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{idx + 1}</td>
              <td style={{ padding: '12px 16px', color: '#fff' }}>{o.status}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{o.total_price}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{o.shipping_address}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{o.created_at}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{o.user_id}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{o.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderList;
