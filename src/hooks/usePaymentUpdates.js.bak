import { useEffect, useState, useRef } from 'react';
import { connectSocket } from '../utils/socket';

// usePaymentUpdates listens for server-side 'payment.update' events
// and returns the most recent event payload.
export function usePaymentUpdates() {
  const [latest, setLatest] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const socket = connectSocket();

    function onPaymentUpdate(payload) {
      // defensive copy
      if (!mounted.current) return;
      setLatest({ receivedAt: Date.now(), payload });
    }

    socket.on('payment.update', onPaymentUpdate);

    return () => {
      mounted.current = false;
      socket.off('payment.update', onPaymentUpdate);
    };
  }, []);

  return latest;
}
