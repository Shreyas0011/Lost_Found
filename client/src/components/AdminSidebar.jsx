import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Package, PlusCircle, ShieldCheck, MessageSquare, LogOut, Sparkles, Ban, HeartHandshake } from 'lucide-react';

export default function AdminSidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isDeactivated = location.pathname === '/admin/items' && location.search.includes('status=DEACTIVATED');
  const isDonated = location.pathname === '/admin/items' && location.search.includes('status=DONATED');

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
        <Link to="/admin/add-item" className={location.pathname === '/admin/add-item' ? 'active' : ''}>
          <span className="nav-icon"><PlusCircle size={18} /></span>
          Upload Found Item
        </Link>
        <Link to="/admin/items" className={location.pathname === '/admin/items' && !isDeactivated && !isDonated ? 'active' : ''}>
          <span className="nav-icon"><Package size={18} /></span>
          Manage Inventory
        </Link>
        <Link to="/admin/items?status=DONATED" className={isDonated ? 'active' : ''}>
          <span className="nav-icon"><HeartHandshake size={18} /></span>
          Donated Items
        </Link>
        <Link to="/admin/items?status=DEACTIVATED" className={isDeactivated ? 'active' : ''}>
          <span className="nav-icon"><Ban size={18} /></span>
          Deactivated Items
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
