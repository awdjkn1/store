import React from 'react';
import { Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Fixed admin link/button which shows either "Admin Panel" (for logged-in admins)
// or "Admin Login" (for logged-out or non-admin users). Improves accessibility
// by providing aria-label and keyboard focus styles are handled via CSS focus rules.
const AdminButton = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const isAuthenticated = Boolean(user);
  const isAdmin = isAuthenticated && user.role === 'admin';

  // Wait until auth has finished loading to avoid flicker
  if (loading) return null;

  const showAdminLink = !isAuthenticated || isAdmin;
  if (!showAdminLink) return null;

  const handleClick = (e) => {
    e.preventDefault();
    if (isAdmin) {
      navigate('/admin');
    } else {
      navigate('/admin/login');
    }
  };

  return (
    <button
      className="admin-button"
      onClick={handleClick}
      title={isAdmin ? 'Admin Panel' : 'Admin Login'}
      aria-label={isAdmin ? 'Admin Panel' : 'Admin Login'}
    >
      <Shield size={16} style={{ marginRight: '8px' }} />
      <span style={{ fontWeight: 700 }}>{isAdmin ? 'Admin Panel' : 'Admin Login'}</span>
    </button>
  );
};

export default AdminButton;
