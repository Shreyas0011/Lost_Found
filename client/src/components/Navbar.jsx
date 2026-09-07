import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, LogOut, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // If in admin layout, don't show public navbar
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">
        <span className="brand-icon"><Sparkles size={20} /></span>
        <span className="brand-title">Transcend</span>
        <span className="brand-tag">| Lost &amp; Found</span>
      </Link>

      <div className="navbar__links">
        <Link to="/" className={location.pathname === '/' || location.pathname === '/search' ? 'active' : ''}>
          Browse Lost Items
        </Link>
        {user?.role === 'student' && (
          <Link to="/submit" className={location.pathname === '/submit' ? 'active' : ''}>
            Report Found Item
          </Link>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user?.role === 'student' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="navbar__user">
              <span className="avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'S'}</span>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontWeight: 800, color: 'var(--clr-text)', fontSize: '0.85rem' }}>{user.name}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontWeight: 600 }}>{user.registration_number}</span>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="btn btn--secondary btn--sm"
              title="Sign Out Student Session"
              style={{ padding: '6px 12px' }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        ) : user && (user.role === 'admin' || user.role === 'superadmin') ? (
          <Link to="/admin/dashboard" className="btn btn--primary btn--sm" style={user.role === 'superadmin' ? { background: 'linear-gradient(135deg, #4338CA 0%, #7E22CE 100%)', borderColor: '#A855F7' } : {}}>
            {user.role === 'superadmin' ? '⚡ SuperAdmin Dashboard' : 'Admin Dashboard'}
          </Link>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to="/login" className="btn btn--secondary btn--sm">
              Student Login
            </Link>
            <Link to="/admin/login" className="btn btn--primary btn--sm">
              Admin Portal
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
