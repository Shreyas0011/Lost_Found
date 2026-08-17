import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Package, ShieldCheck, MessageSquare, LogOut, Sparkles } from 'lucide-react';

export default function AdminSidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__brand-icon"><Sparkles size={18} /></div>
        Transcend Admin
      </div>

      <nav className="admin-nav">
        <Link to="/admin/dashboard" className={location.pathname === '/admin/dashboard' ? 'active' : ''}>
          <span className="nav-icon"><LayoutDashboard size={18} /></span>
          Dashboard
        </Link>
        <Link to="/admin/items" className={location.pathname === '/admin/items' ? 'active' : ''}>
          <span className="nav-icon"><Package size={18} /></span>
          Items
        </Link>
        <Link to="/admin/requests" className={location.pathname === '/admin/requests' ? 'active' : ''}>
          <span className="nav-icon"><ShieldCheck size={18} /></span>
          Ownership Requests
        </Link>
        <Link to="/admin/chat" className={location.pathname === '/admin/chat' ? 'active' : ''}>
          <span className="nav-icon"><MessageSquare size={18} /></span>
          Messages
        </Link>
      </nav>

      <button className="admin-sidebar__logout" onClick={handleLogout}>
        <span className="nav-icon"><LogOut size={18} /></span>
        Sign Out
      </button>
    </aside>
  );
}
