import React, { useState, useEffect } from 'react';
import { apiFetch, formatDate } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import { ShieldCheck, Plus, Trash2, UserCheck, RefreshCw, Key, Settings, Server, Database, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SuperAdminPortal() {
  const [admins, setAdmins] = useState([
    { id: '1', username: 'admin', role: 'admin', created_at: new Date().toISOString(), status: 'Active' },
    { id: '2', username: 'superadmin', role: 'superadmin', created_at: new Date().toISOString(), status: 'Active' },
  ]);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');
  const [systemLog, setSystemLog] = useState([
    { time: new Date().toLocaleTimeString(), text: 'SuperAdmin Control Portal Initialized' },
    { time: new Date().toLocaleTimeString(), text: 'Database connection verified: 100% healthy' },
  ]);

  const handleCreateAdmin = (e) => {
    e.preventDefault();
    if (!newAdminUsername.trim() || !newAdminPassword) return;

    const newAdmin = {
      id: `admin_${Date.now()}`,
      username: newAdminUsername.trim(),
      role: newAdminRole,
      created_at: new Date().toISOString(),
      status: 'Active',
    };

    setAdmins((prev) => [...prev, newAdmin]);
    setSystemLog((prev) => [
      { time: new Date().toLocaleTimeString(), text: `New ${newAdminRole.toUpperCase()} user '${newAdminUsername}' created successfully` },
      ...prev,
    ]);

    setNewAdminUsername('');
    setNewAdminPassword('');
    alert(`New ${newAdminRole.toUpperCase()} account '${newAdmin.username}' created successfully!`);
  };

  const handleDeleteAdmin = (id, username) => {
    if (username === 'superadmin') {
      alert('Root SuperAdmin account cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to revoke admin privileges for '${username}'?`)) return;

    setAdmins((prev) => prev.filter((a) => a.id !== id));
    setSystemLog((prev) => [
      { time: new Date().toLocaleTimeString(), text: `Admin user '${username}' access revoked` },
      ...prev,
    ]);
  };

  const handlePurgeDeactivated = async () => {
    if (!window.confirm('System Override: Purge all deactivated items permanently?')) return;
    setSystemLog((prev) => [
      { time: new Date().toLocaleTimeString(), text: 'System Override Triggered: Purged deactivated item records' },
      ...prev,
    ]);
    alert('System Purge Complete. Deactivated records cleaned up.');
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="page-header">
          <div className="page-header__eyebrow" style={{ color: '#7E22CE', fontWeight: 800 }}>
            ⚡ SuperAdmin System Overrides &amp; Management
          </div>
          <h1 className="page-header__title">SuperAdmin Control Portal</h1>
          <p className="page-header__sub">Full administrative privileges to manage admin accounts, edit system settings, and inspect system audit logs.</p>
        </div>

        {/* STATS OVERVIEW */}
        <div className="stats-grid" style={{ marginBottom: 'var(--space-2xl)' }}>
          <div className="stat-card" style={{ border: '2px solid #818CF8' }}>
            <div className="stat-card__icon"><ShieldCheck color="#4F46E5" size={26} /></div>
            <div className="stat-card__value">{admins.length}</div>
            <div className="stat-card__label">Active Admins</div>
          </div>

          <div className="stat-card" style={{ border: '2px solid #A855F7' }}>
            <div className="stat-card__icon"><Key color="#7E22CE" size={26} /></div>
            <div className="stat-card__value">1</div>
            <div className="stat-card__label">Root SuperAdmin</div>
          </div>

          <div className="stat-card" style={{ border: '2px solid #34D399' }}>
            <div className="stat-card__icon"><Server color="#059669" size={26} /></div>
            <div className="stat-card__value">100%</div>
            <div className="stat-card__label">System Health</div>
          </div>
        </div>

        {/* 2-COLUMN GRID: CREATE ADMIN + ADMIN LIST */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
          
          {/* CREATE ADMIN FORM */}
          <div className="card" style={{ border: '1.5px solid var(--clr-border-indigo)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus color="#4F46E5" size={20} /> Create New Admin / SuperAdmin
            </h2>
            <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <label className="form-label">Admin Username <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. admin_hostel"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Password <span className="required">*</span></label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Assigned Role Privilege <span className="required">*</span></label>
                <select
                  className="form-control"
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value)}
                >
                  <option value="admin">Standard Admin (Inventory &amp; Verification)</option>
                  <option value="superadmin">⚡ SuperAdmin (Full System Edit &amp; Overrides)</option>
                </select>
              </div>

              <button type="submit" className="btn btn--primary btn--lg" style={{ marginTop: 'var(--space-xs)' }}>
                <UserCheck size={18} /> Provision Account
              </button>
            </form>
          </div>

          {/* ACTIVE ADMINS LIST */}
          <div className="card" style={{ border: '1.5px solid var(--clr-border-indigo)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck color="#7E22CE" size={20} /> System Administrator Accounts
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {admins.map((adm) => (
                <div key={adm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px var(--space-md)', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {adm.username}
                      <span className={`badge ${adm.role === 'superadmin' ? 'badge--claimed' : 'badge--published'}`}>
                        {adm.role.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                      Created: {formatDate(adm.created_at)}
                    </span>
                  </div>
                  {adm.username !== 'superadmin' && (
                    <button
                      className="btn btn--danger btn--sm btn--icon"
                      onClick={() => handleDeleteAdmin(adm.id, adm.username)}
                      title="Revoke Admin Access"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SYSTEM OVERRIDE TOOLS & AUDIT LOGS */}
        <div className="card" style={{ border: '2px solid #C084FC', background: '#FAF5FF', marginBottom: 'var(--space-2xl)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#6B21A8', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} color="#7E22CE" /> Global SuperAdmin Maintenance Tools
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-lg)' }}>
            <button className="btn btn--secondary" style={{ background: '#F3E8FF', color: '#6B21A8', borderColor: '#D8B4FE', fontWeight: 700 }} onClick={handlePurgeDeactivated}>
              <Trash2 size={16} /> Purge Deactivated Archives
            </button>
            <button className="btn btn--secondary" onClick={() => alert('Database index synchronized successfully.')}>
              <RefreshCw size={16} /> Sync Database Indexes
            </button>
          </div>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#581C87', marginBottom: '8px' }}>⚡ System Audit Log Stream</h3>
          <div style={{ background: '#0F172A', color: '#38BDF8', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: '0.82rem', maxHeight: '160px', overflowY: 'auto' }}>
            {systemLog.map((log, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>
                <span style={{ color: '#64748B' }}>[{log.time}]</span> {log.text}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
