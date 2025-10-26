import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserManager = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data.users || []);
      } catch (err) {
        setError('Failed to fetch users');
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
