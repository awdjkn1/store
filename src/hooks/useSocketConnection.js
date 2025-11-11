/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:09.139Z */
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
