import { useEffect, useState } from 'react';
import { connectSocket } from '../utils/socket';

export function useSocketConnection() {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const socket = connectSocket();
    socket.on('connected', () => setConnected(true));
    return () => {
      socket.off('connected');
    };
  }, []);
  return connected;
}
