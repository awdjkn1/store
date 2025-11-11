import React, { useState, useEffect, useMemo } from 'react';

const UserList = ({ initialUsers }) => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const providedUsers = useMemo(() => (initialUsers || []), [initialUsers]);

  useEffect(() => {
    if (providedUsers && providedUsers.length > 0) {
      setUsers(providedUsers);
      setError('');
      return;
    }
    setUsers([]);
    setError('No users found.');
  }, [providedUsers]);

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ marginTop: 0, color: '#ff6b35' }}>Users</h3>
      {error && <div style={{ color: '#fca5a5', padding: 12, background: '#111', borderRadius: 8, marginBottom: 12 }}>{error}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#111', borderRadius: 8, overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#0f1724' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9ca3af' }}>#</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9ca3af' }}>Username</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9ca3af' }}>Email</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9ca3af' }}>Role</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9ca3af' }}>Created At</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, idx) => (
            <tr key={u.id} style={{ borderBottom: '1px solid #0b1220' }}>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{idx + 1}</td>
              <td style={{ padding: '12px 16px', color: '#fff' }}>{u.username}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{u.email}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{u.role}</td>
              <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{u.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
