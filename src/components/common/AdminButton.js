import React from 'react';
import { Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminButton = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Only render for admin users
  if (!user || user.role !== 'admin') return null;

  return (
    <button
      className="admin-button"
      onClick={() => navigate('/admin')}
      title="Admin"
      aria-label="Admin"
    >
      <Shield size={16} />
    </button>
  );
};

export default AdminButton;
