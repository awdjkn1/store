import React, { createContext, useState, useEffect, useContext } from 'react';
import { getProfile } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Rely on HttpOnly cookie-based session. Request profile; server will read JWT from cookie.
    getProfile().then(res => {
      if (res && res.user) setUser(res.user);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const login = (user /*, token */) => {
    // After successful login the server sets the HttpOnly cookie.
    setUser(user);
  };

  const logout = async () => {
    try {
      await fetch((process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
