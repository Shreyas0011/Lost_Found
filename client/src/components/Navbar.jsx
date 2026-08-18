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
      </div>

      <div>
        {user && user.role === 'admin' ? (
          <Link to="/admin/dashboard" className="btn btn--primary btn--sm">
            Admin Dashboard
          </Link>
        ) : (
          <Link to="/admin/login" className="btn btn--secondary btn--sm">
            Admin Portal
          </Link>
        )}
      </div>
    </nav>
  );
}
