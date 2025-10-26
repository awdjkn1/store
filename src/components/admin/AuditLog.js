import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AuditLog = ({ token }) => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/admin/reporting/audit', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(res.data.logs || []);
      } catch (err) {
        setError('Failed to fetch audit logs');
      }
    };
    fetchLogs();
  }, [token]);

  return (
    <div>
      <h3>Audit Logs</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ul>
        {logs.map(l => (
          <li key={l.id}>{l.action} - {l.admin} - {l.timestamp}</li>
        ))}
      </ul>
    </div>
  );
};

export default AuditLog;
