import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, formatDate, getCategoryIcon, getImageUrl } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import StatusBadge from '../components/StatusBadge';
import { Package, Clock, CheckCircle, ShieldAlert, AlertTriangle, ArrowRight, RefreshCw, Archive, HeartHandshake } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const statsRes = await apiFetch('/admin/stats');
      setStats(statsRes);

      const itemsRes = await apiFetch('/items/admin/all');
      setRecentItems((itemsRes.items || []).slice(0, 5));
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load admin dashboard data. Session may have expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="page-header">
          <div className="page-header__eyebrow">👋 Welcome back</div>
          <h1 className="page-header__title">Transcend Admin Dashboard</h1>
          <p className="page-header__sub">Overview of found items, unclaimed inventory, and ownership claim requests.</p>
        </div>

        {loading ? (
          <div className="loading-overlay" style={{ minHeight: '400px' }}><div className="spinner"></div></div>
        ) : errorMsg ? (
          <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center', maxWidth: '600px', margin: 'var(--space-2xl) auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>⚠️</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 'var(--space-xs)' }}>Session Verification Required</h3>
            <p style={{ color: 'var(--clr-text-muted)', marginBottom: 'var(--space-lg)' }}>{errorMsg}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn--primary" onClick={loadDashboardData}>
                <RefreshCw size={15} /> Retry Loading Data
              </button>
              <Link to="/admin/login" className="btn btn--secondary">
                Re-authenticate Admin Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card__glow" style={{ background: 'var(--clr-primary)' }}></div>
                <div className="stat-card__icon"><Package color="var(--clr-primary)" size={24} /></div>
                <div className="stat-card__value">{stats?.totalItems || 0}</div>
                <div className="stat-card__label">Total Items</div>
              </div>

              <div className="stat-card">
                <div className="stat-card__glow" style={{ background: 'var(--clr-success)' }}></div>
                <div className="stat-card__icon"><CheckCircle color="var(--clr-success)" size={24} /></div>
                <div className="stat-card__value">{stats?.publishedItems || 0}</div>
                <div className="stat-card__label">Published Items</div>
              </div>

              <div className="stat-card">
                <div className="stat-card__glow" style={{ background: '#D97706' }}></div>
                <div className="stat-card__icon"><Archive color="#D97706" size={24} /></div>
                <div className="stat-card__value">{stats?.unclaimedItems || 0}</div>
                <div className="stat-card__label">Unclaimed Items</div>
              </div>

              <div className="stat-card">
                <div className="stat-card__glow" style={{ background: '#7E22CE' }}></div>
                <div className="stat-card__icon"><HeartHandshake color="#7E22CE" size={24} /></div>
                <div className="stat-card__value">{stats?.donatedItems || 0}</div>
                <div className="stat-card__label">Donated Items</div>
              </div>

              <div className="stat-card">
                <div className="stat-card__glow" style={{ background: 'var(--clr-accent)' }}></div>
                <div className="stat-card__icon"><ShieldAlert color="var(--clr-accent)" size={24} /></div>
                <div className="stat-card__value">{stats?.ownershipRequests || 0}</div>
                <div className="stat-card__label">Ownership Requests</div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 'var(--space-lg)' }}>Quick Actions</h2>
              <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                <Link to="/admin/items" className="btn btn--primary">
                  📦 Manage All Items
                </Link>
                <Link to="/admin/requests" className="btn btn--secondary">
                  🔐 Review Claims ({stats?.pendingRequests || 0} Pending)
                </Link>
                <Link to="/admin/chat" className="btn btn--secondary">
                  💬 Open Verification Chat
                </Link>
              </div>
            </div>

            {/* Recent Inventory Items Table */}
            <div className="card">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>📦 Recent Inventory Additions</span>
                <Link to="/admin/items" style={{ fontSize: '0.85rem', color: 'var(--clr-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  View all inventory <ArrowRight size={14} />
                </Link>
              </h2>

              {recentItems.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
                  <div className="empty-state__icon">✅</div>
                  <p className="empty-state__title">No items found</p>
                  <p className="empty-state__text">No found items logged in inventory.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Photo</th>
                        <th>Serial # &amp; UID &amp; Category</th>
                        <th>Location</th>
                        <th>Reported By</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentItems.map((item) => {
                        const title = item.category;
                        return (
                          <tr key={item._id}>
                            <td>
                              {item.image_url ? (
                                <img src={getImageUrl(item.image_url)} alt={title} className="table-img" />
                              ) : (
                                <span style={{ fontSize: '1.5rem' }}>{getCategoryIcon(item.category)}</span>
                              )}
                            </td>
                            <td>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--clr-primary)' }}>#{item.serial_number || 'N/A'}</strong>
                              {item.uid && (
                                <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace', fontWeight: 700 }}>
                                  {item.uid}
                                </span>
                              )}
                              <strong style={{ fontSize: '0.9rem' }}>{title}</strong>
                            </td>
                            <td>{item.location_found}</td>
                            <td>
                              {item.student_name}
                              <br />
                              <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-dim)' }}>{item.registration_number}</span>
                            </td>
                            <td>
                              <StatusBadge status={item.status} />
                            </td>
                            <td>{formatDate(item.uploaded_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
