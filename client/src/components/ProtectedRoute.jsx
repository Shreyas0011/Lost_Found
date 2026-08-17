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

  if (!user || (role && user.role !== role)) {
    const fallbackPath = role === 'admin' ? '/admin/login' : '/';
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
