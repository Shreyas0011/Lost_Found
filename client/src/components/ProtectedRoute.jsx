import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-overlay" style={{ minHeight: '80vh', flexDirection: 'column', gap: '12px' }}>
        <div className="spinner"></div>
        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--clr-primary-dark)' }}>
          Verifying session credentials…
        </p>
      </div>
    );
  }

  const hasPermission = () => {
    if (!user) return false;
    if (!role) return true;
    if (Array.isArray(role)) return role.includes(user.role);
    if (role === 'admin') return user.role === 'admin' || user.role === 'superadmin';
    return user.role === role;
  };

  if (!hasPermission()) {
    const fallbackPath = (role === 'admin' || role === 'superadmin') ? '/admin/login' : '/';
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
