import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, formatDate, getCategoryIcon, getImageUrl } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import StatusBadge from '../components/StatusBadge';
import { Trash2, CheckCircle, RefreshCw } from 'lucide-react';

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const qs = currentStatus ? `?status=${currentStatus}` : '';
      const data = await apiFetch(`/items/admin/all${qs}`);
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load inventory items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentStatus]);

  const handleStatusChange = async (id, status) => {
    try {
      await apiFetch(`/items/admin/${id}/status`, {
        method: 'PATCH',
        body: { status },
      });
      fetchItems();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this item and its photo?')) return;
    try {
      await apiFetch(`/items/admin/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete item.');
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="page-header">
          <div className="page-header__eyebrow">📦 Inventory Management</div>
          <h1 className="page-header__title">Manage Items</h1>
        </div>

        {/* Status filter tabs */}
        <div className="tabs">
          {['', 'PENDING', 'PUBLISHED', 'UNPUBLISHED', 'CLAIMED', 'RETURNED'].map((status) => (
            <button
              key={status}
              className={`tab ${currentStatus === status ? 'active' : ''}`}
              onClick={() => setCurrentStatus(status)}
            >
              {status || 'All Items'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-overlay" style={{ minHeight: '400px' }}><div className="spinner"></div></div>
        ) : errorMsg ? (
          <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center', maxWidth: '600px', margin: 'var(--space-2xl) auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>⚠️</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 'var(--space-xs)' }}>Unable to Load Items</h3>
            <p style={{ color: 'var(--clr-text-muted)', marginBottom: 'var(--space-lg)' }}>{errorMsg}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn--primary" onClick={fetchItems}>
                <RefreshCw size={15} /> Retry
              </button>
              <Link to="/admin/login" className="btn btn--secondary">
                Re-authenticate Admin Login
              </Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state" style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: 'var(--space-3xl)', border: '1.5px solid var(--clr-border)' }}>
            <div className="empty-state__icon">📦</div>
            <p className="empty-state__title">No items found</p>
            <p className="empty-state__text">No items match the selected status filter.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Item Details</th>
                  <th>Location</th>
                  <th>Submitted By</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const title = [item.color, item.brand, item.category].filter(Boolean).join(' ') || item.category;
                  const icon = getCategoryIcon(item.category);

                  return (
                    <tr key={item._id}>
                      <td>
                        {item.image_url ? (
                          <img src={getImageUrl(item.image_url)} alt={title} className="table-img" />
                        ) : (
                          <span style={{ fontSize: '1.8rem' }}>{icon}</span>
                        )}
                      </td>
                      <td>
                        <Link to={`/item/${item._id}`} style={{ fontWeight: 700, color: 'var(--clr-text)' }}>
                          {title}
                        </Link>
                        <br />
                        <span style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>Category: {item.category}</span>
                      </td>
                      <td>{item.location_found || '—'}</td>
                      <td>
                        <strong>{item.student_name}</strong>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-dim)' }}>{item.registration_number}</span>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>{formatDate(item.uploaded_at)}</td>
                      <td>
                        <div className="table-actions">
                          {item.status === 'PENDING' && (
                            <button
                              className="btn btn--success btn--sm"
                              onClick={() => handleStatusChange(item._id, 'PUBLISHED')}
                              title="Publish item to public registry"
                            >
                              <CheckCircle size={14} /> Publish
                            </button>
                          )}

                          {item.status === 'PUBLISHED' && (
                            <button
                              className="btn btn--secondary btn--sm"
                              onClick={() => handleStatusChange(item._id, 'UNPUBLISHED')}
                            >
                              Unpublish
                            </button>
                          )}

                          {item.status === 'UNPUBLISHED' && (
                            <button
                              className="btn btn--primary btn--sm"
                              onClick={() => handleStatusChange(item._id, 'PUBLISHED')}
                            >
                              Re-publish
                            </button>
                          )}

                          <button
                            className="btn btn--danger btn--sm btn--icon"
                            onClick={() => handleDelete(item._id)}
                            title="Delete item permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
