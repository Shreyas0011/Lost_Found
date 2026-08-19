import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Package, PlusCircle, LogOut, Sparkles, Ban, HeartHandshake, ShieldAlert, Zap } from 'lucide-react';

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isDeactivated = location.pathname === '/admin/items' && location.search.includes('status=DEACTIVATED');
  const isDonated = location.pathname === '/admin/items' && location.search.includes('status=DONATED');
  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__brand-icon" style={isSuperAdmin ? { background: '#7E22CE' } : {}}><Sparkles size={18} /></div>
        {isSuperAdmin ? 'SuperAdmin Control' : 'Transcend Admin'}
      </div>

      {isSuperAdmin && (
        <div style={{ margin: '0 var(--space-md) var(--space-md) var(--space-md)', padding: '6px 12px', background: 'linear-gradient(135deg, #4338CA 0%, #7E22CE 100%)', borderRadius: 'var(--radius-md)', color: '#FDE047', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={14} fill="#FDE047" /> SUPERADMIN ACTIVE
        </div>
      )}

      <nav className="admin-nav">
        <Link to="/admin/dashboard" className={location.pathname === '/admin/dashboard' ? 'active' : ''}>
          <span className="nav-icon"><LayoutDashboard size={18} /></span>
          Dashboard
        </Link>
        {isSuperAdmin && (
          <Link to="/admin/superadmin" className={location.pathname === '/admin/superadmin' ? 'active' : ''} style={{ color: '#A855F7', fontWeight: 800 }}>
            <span className="nav-icon"><ShieldAlert size={18} color="#A855F7" /></span>
            SuperAdmin Portal
          </Link>
        )}
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
      </nav>

      <button className="admin-sidebar__logout" onClick={handleLogout}>
        <span className="nav-icon"><LogOut size={18} /></span>
        Sign Out
      </button>
    </aside>
  );
}
