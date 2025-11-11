import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OrderManager = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get('/api/admin/orders', {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        setOrders(res.data.orders || []);
      } catch (err) {
        setError('Failed to fetch orders');
      }
    };
    fetchOrders();
  }, [token]);

  return (
    <div>
      <h3>Orders</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ul>
        {orders.map(o => (
          <li key={o.id}>{o.status} - {o.total} - {o.created_at}</li>
        ))}
      </ul>
    </div>
  );
};

export default OrderManager;
