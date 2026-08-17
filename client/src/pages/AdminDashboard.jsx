import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, formatDate, getCategoryIcon } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import { Package, Clock, CheckCircle, ShieldAlert, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const statsRes = await apiFetch('/admin/stats');
      setStats(statsRes);

      const itemsRes = await apiFetch('/items/admin/all?status=PENDING');
      setPendingItems(itemsRes.items || []);
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

  const handlePublish = async (id) => {
    try {
      await apiFetch(`/items/admin/${id}/status`, {
        method: 'PATCH',
        body: { status: 'PUBLISHED' },
      });

      setPendingItems(prev => prev.filter(i => i._id !== id));
      const statsRes = await apiFetch('/admin/stats');
      setStats(statsRes);
    } catch (err) {
      alert(err.message || 'Failed to publish item.');
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="page-header">
          <div className="page-header__eyebrow">👋 Welcome back</div>
          <h1 className="page-header__title">Transcend Admin Dashboard</h1>
          <p className="page-header__sub">Overview of found item submissions, ownership claims, and pending reviews.</p>
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
                <div className="stat-card__glow" style={{ background: 'var(--clr-warning)' }}></div>
                <div className="stat-card__icon"><Clock color="var(--clr-warning)" size={24} /></div>
                <div className="stat-card__value">{stats?.pendingItems || 0}</div>
                <div className="stat-card__label">Pending Review</div>
              </div>

              <div className="stat-card">
                <div className="stat-card__glow" style={{ background: 'var(--clr-success)' }}></div>
                <div className="stat-card__icon"><CheckCircle color="var(--clr-success)" size={24} /></div>
                <div className="stat-card__value">{stats?.publishedItems || 0}</div>
                <div className="stat-card__label">Published Items</div>
              </div>

              <div className="stat-card">
                <div className="stat-card__glow" style={{ background: 'var(--clr-accent)' }}></div>
                <div className="stat-card__icon"><ShieldAlert color="var(--clr-accent)" size={24} /></div>
                <div className="stat-card__value">{stats?.ownershipRequests || 0}</div>
                <div className="stat-card__label">Ownership Requests</div>
              </div>

              <div className="stat-card">
                <div className="stat-card__glow" style={{ background: 'var(--clr-danger)' }}></div>
                <div className="stat-card__icon"><AlertTriangle color="var(--clr-danger)" size={24} /></div>
                <div className="stat-card__value">{stats?.expiringSoon || 0}</div>
                <div className="stat-card__label">Expiring Soon (&lt; 7 Days)</div>
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

            {/* Awaiting Review Table */}
            <div className="card">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>⏳ Items Awaiting Admin Review</span>
                <Link to="/admin/items" style={{ fontSize: '0.85rem', color: 'var(--clr-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  View all items <ArrowRight size={14} />
                </Link>
              </h2>

              {pendingItems.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
                  <div className="empty-state__icon">✅</div>
                  <p className="empty-state__title">All clear!</p>
                  <p className="empty-state__text">No found items waiting for review.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Photo</th>
                        <th>Item</th>
                        <th>Location</th>
                        <th>Submitted By</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingItems.map((item) => {
                        const title = [item.color, item.brand, item.category].filter(Boolean).join(' ') || item.category;
                        return (
                          <tr key={item._id}>
                            <td>
                              {item.image_url ? (
                                <img src={item.image_url} alt={title} className="table-img" />
                              ) : (
                                <span style={{ fontSize: '1.5rem' }}>{getCategoryIcon(item.category)}</span>
                              )}
                            </td>
                            <td>
                              <strong style={{ fontSize: '0.9rem' }}>{title}</strong>
                              <br />
                              <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{item.category}</span>
                            </td>
                            <td>{item.location_found}</td>
                            <td>
                              {item.student_name}
                              <br />
                              <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-dim)' }}>{item.registration_number}</span>
                            </td>
                            <td>{formatDate(item.uploaded_at)}</td>
                            <td>
                              <button className="btn btn--success btn--sm" onClick={() => handlePublish(item._id)}>
                                Publish
                              </button>
                            </td>
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
