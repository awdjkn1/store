import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();
let idCounter = 1;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = `t_${Date.now()}_${idCounter++}`;
    const t = { id, createdAt: Date.now(), ttl: 8000, ...toast };
    setToasts(s => [...s, t]);
    if (t.ttl > 0) {
      setTimeout(() => {
        setToasts(s => s.filter(x => x.id !== id));
      }, t.ttl);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => setToasts(s => s.filter(t => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ minWidth: 260, background: '#0f1724', color: '#fff', padding: '12px 14px', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.title || 'Notification'}</div>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export default ToastProvider;
