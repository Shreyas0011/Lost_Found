import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, formatDate, formatDateTime, getCategoryIcon, getImageUrl } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import StatusBadge from '../components/StatusBadge';
import { MessageSquare, Check, X, Calendar, RefreshCw } from 'lucide-react';

export default function AdminRequests() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchClaims = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const qs = filter ? `?status=${filter}` : '';
      const data = await apiFetch(`/claims/admin/all${qs}`);
      setClaims(data.claims || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load claims. Session may have expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [filter]);

  const handleClaimStatus = async (id, status) => {
    try {
      await apiFetch(`/claims/admin/${id}/status`, {
        method: 'PATCH',
        body: { status },
      });
      fetchClaims();
    } catch (err) {
      alert(err.message || 'Failed to update claim status.');
    }
  };

  const handleMeetingStatus = async (id, status) => {
    try {
      await apiFetch(`/claims/admin/${id}/meeting`, {
        method: 'PATCH',
        body: { status },
      });
      fetchClaims();
    } catch (err) {
      alert(err.message || 'Failed to update meeting status.');
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="page-header">
          <div className="page-header__eyebrow">🔐 Claims Verification</div>
          <h1 className="page-header__title">Ownership Requests</h1>
        </div>

        <div className="tabs">
          {['', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              className={`tab ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status || 'All Claims'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-overlay" style={{ minHeight: '400px' }}><div className="spinner"></div></div>
        ) : errorMsg ? (
          <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center', maxWidth: '600px', margin: 'var(--space-2xl) auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>⚠️</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 'var(--space-xs)' }}>Unable to Load Requests</h3>
            <p style={{ color: 'var(--clr-text-muted)', marginBottom: 'var(--space-lg)' }}>{errorMsg}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn--primary" onClick={fetchClaims}>
                <RefreshCw size={15} /> Retry
              </button>
              <Link to="/admin/login" className="btn btn--secondary">
                Re-authenticate Admin Login
              </Link>
            </div>
          </div>
        ) : claims.length === 0 ? (
          <div className="empty-state" style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: 'var(--space-3xl)', border: '1.5px solid var(--clr-border)' }}>
            <div className="empty-state__icon">🔐</div>
            <p className="empty-state__title">No requests found</p>
            <p className="empty-state__text">No ownership claims match the selected status filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {claims.map((claim) => {
              const item = claim.item_id;
              const student = claim.student_id;
              const title = item ? [item.color, item.brand, item.category].filter(Boolean).join(' ') : '—';
              const icon = item ? getCategoryIcon(item.category) : '📦';

              return (
                <div key={claim._id} className="card">
                  <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'flex-start' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', background: 'var(--clr-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0, border: '1px solid var(--clr-border)' }}>
                      {item?.image_url ? (
                        <img src={getImageUrl(item.image_url)} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                      ) : (
                        icon
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                        <strong style={{ fontSize: '1.05rem' }}>{title}</strong>
                        <StatusBadge status={claim.status} />
                      </div>

                      <p style={{ fontSize: '0.84rem', color: 'var(--clr-text-muted)' }}>
                        📍 {item?.location_found || '—'} · 📅 {formatDate(item?.date_found)}
                      </p>

                      {/* Student detail card */}
                      <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: '#EEF2FF', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                        <p style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#3730A3', marginBottom: '2px' }}>
                          Claimant Student Profile
                        </p>
                        <p style={{ fontSize: '0.95rem', fontWeight: 700 }}>{student?.name || '—'}</p>
                        <p style={{ fontSize: '0.84rem', color: 'var(--clr-text-muted)' }}>
                          Registration #: <strong>{student?.registration_number}</strong> · Class {student?.class}-{student?.section}
                        </p>
                      </div>

                      {/* Claim message */}
                      <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: '#FFFFFF', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #4F46E5', border: '1px solid var(--clr-border)' }}>
                        <p style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clr-text-muted)', marginBottom: '4px' }}>
                          Student's Ownership Proof Message
                        </p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--clr-text)' }}>{claim.message}</p>
                      </div>

                      {/* In-person meeting block */}
                      {claim.in_person_request?.status && claim.in_person_request.status !== 'NONE' && (
                        <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'rgba(79, 70, 229, 0.08)', border: '1px solid rgba(79, 70, 229, 0.25)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}>
                          <span style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={14} /> In-Person Verification: <StatusBadge status={claim.in_person_request.status} />
                          </span>
                          <span style={{ marginLeft: '8px', color: 'var(--clr-text-muted)' }}>
                            {formatDate(claim.in_person_request.preferred_date)} at {claim.in_person_request.preferred_time}
                          </span>
                          {claim.in_person_request.note && (
                            <div style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)', marginTop: '4px' }}>
                              Note: {claim.in_person_request.note}
                            </div>
                          )}

                          <div style={{ marginTop: 'var(--space-sm)', display: 'flex', gap: 'var(--space-xs)' }}>
                            {claim.in_person_request.status === 'REQUESTED' && (
                              <>
                                <button className="btn btn--success btn--sm" onClick={() => handleMeetingStatus(claim._id, 'SCHEDULED')}>Schedule</button>
                                <button className="btn btn--danger btn--sm" onClick={() => handleMeetingStatus(claim._id, 'CANCELLED')}>Cancel</button>
                              </>
                            )}
                            {claim.in_person_request.status === 'SCHEDULED' && (
                              <button className="btn btn--primary btn--sm" onClick={() => handleMeetingStatus(claim._id, 'COMPLETED')}>Mark Completed</button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                        <Link to={`/admin/chat?request=${claim._id}`} className="btn btn--secondary btn--sm">
                          <MessageSquare size={14} /> Open Verification Chat
                        </Link>

                        {claim.status === 'PENDING' && (
                          <>
                            <button className="btn btn--success btn--sm" onClick={() => handleClaimStatus(claim._id, 'APPROVED')}>
                              <Check size={14} /> Approve Claim
                            </button>
                            <button className="btn btn--danger btn--sm" onClick={() => handleClaimStatus(claim._id, 'REJECTED')}>
                              <X size={14} /> Reject Claim
                            </button>
                          </>
                        )}
                      </div>

                      <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-dim)', marginTop: 'var(--space-sm)' }}>
                        Submitted on {formatDateTime(claim.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
