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
      <Link to={user ? "/search" : "/"} className="navbar__brand">
        <span className="brand-icon"><Sparkles size={20} /></span>
        <span className="brand-title">Transcend</span>
        <span className="brand-tag">| Lost &amp; Found</span>
      </Link>

      <div className="navbar__links">
        <Link to="/search" className={location.pathname === '/search' ? 'active' : ''}>
          Browse Items
        </Link>
      </div>

      <div>
        {user && user.role === 'student' ? (
          <div className="navbar__user">
            <div className="avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'S'}</div>
            <span style={{ fontWeight: 600 }}>{user.name}</span>
            <button
              onClick={() => { logout(); navigate('/'); }}
              style={{ background: 'none', border: 'none', color: 'var(--clr-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '6px' }}
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <Link to="/" className="btn btn--primary btn--sm">
            Portal Login
          </Link>
        )}
      </div>
    </nav>
  );
}
