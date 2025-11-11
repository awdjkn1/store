import React, { useEffect, useState } from 'react';

const LiveUpdates = ({ token }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000/admin/live');
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setMessages((prev) => [...prev, msg]);
    };
    return () => ws.close();
  }, [token]);

  return (
    <div>
      <h3>Live Updates</h3>
      <ul>
        {messages.map((m, i) => (
          <li key={i}>{m.type}: {m.data}</li>
        ))}
      </ul>
    </div>
  );
};

export default LiveUpdates;
