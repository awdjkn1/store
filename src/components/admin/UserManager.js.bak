import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserManager = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        try { (await import('../../utils/adminLogger')).default.log('admin_user_list_fetch_attempt', {}); } catch (e) {}
        const res = await axios.get('/api/admin/users', {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        setUsers(res.data.users || []);
        try { (await import('../../utils/adminLogger')).default.log('admin_user_list_fetch_success', { count: Array.isArray(res.data.users) ? res.data.users.length : 0 }); } catch (e) {}
      } catch (err) {
        setError('Failed to fetch users');
        try { (await import('../../utils/adminLogger')).default.log('admin_user_list_fetch_failed', { error: (err && err.message) || String(err) }); } catch (e) {}
      }
    };
    fetchUsers();
  }, [token]);

  return (
    <div>
      <h3>Users</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ul>
        {users.map(u => (
          <li key={u.id}>{u.username} - {u.role}</li>
        ))}
      </ul>
    </div>
  );
};

export default UserManager;
