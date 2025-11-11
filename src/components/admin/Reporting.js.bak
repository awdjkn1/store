import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Reporting = ({ token }) => {
  const [summary, setSummary] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get('/api/admin/reporting/sales-summary', {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        setSummary(res.data.summary || {});
      } catch (err) {
        setError('Failed to fetch summary');
      }
    };
    fetchSummary();
  }, [token]);

  return (
    <div>
      <h3>Sales Summary</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <pre>{JSON.stringify(summary, null, 2)}</pre>
    </div>
  );
};

export default Reporting;
