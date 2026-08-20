import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, formatDate, formatDateTime, getCategoryIcon, getImageUrl } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import StatusBadge from '../components/StatusBadge';
import { MessageSquare, Check, X, Calendar, RefreshCw, FileText, FileCheck, Eye, Search, UserCheck, Sparkles } from 'lucide-react';

export default function AdminRequests() {
  const [mainTab, setMainTab] = useState('responses'); // 'responses' | 'online'
  
  // Online requests state
  const [claims, setClaims] = useState([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [filter, setFilter] = useState('');
  
  // Claim form responses state
  const [formResponses, setFormResponses] = useState([]);
  const [responsesLoading, setResponsesLoading] = useState(true);
  const [responseSearch, setResponseSearch] = useState('');
  const [selectedResponseModal, setSelectedResponseModal] = useState(null);
  
  const [errorMsg, setErrorMsg] = useState('');

  const fetchClaims = async () => {
    setOnlineLoading(true);
    setErrorMsg('');
    try {
      const qs = filter ? `?status=${filter}` : '';
      const data = await apiFetch(`/claims/admin/all${qs}`);
      setClaims(data.claims || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load claims.');
    } finally {
      setOnlineLoading(false);
    }
  };

  const fetchFormResponses = async () => {
    setResponsesLoading(true);
    setErrorMsg('');
    try {
      const data = await apiFetch('/items/admin/claim-responses');
      setFormResponses(data.responses || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load claim form responses.');
    } finally {
      setResponsesLoading(false);
    }
  };

  const handleLoadSampleResponses = async () => {
    localStorage.removeItem('lf_mock_items');
    await fetchFormResponses();
  };

  useEffect(() => {
    fetchFormResponses();
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

  // Filter form responses based on search query
  const filteredResponses = formResponses.filter((item) => {
    if (!responseSearch.trim()) return true;
    const q = responseSearch.toLowerCase();
    return (
      (item.handover_student_name && item.handover_student_name.toLowerCase().includes(q)) ||
      (item.handover_reg_number && item.handover_reg_number.toLowerCase().includes(q)) ||
      (item.serial_number && item.serial_number.toLowerCase().includes(q)) ||
      (item.uid && item.uid.toLowerCase().includes(q)) ||
      (item.handover_department && item.handover_department.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="page-header">
          <div className="page-header__eyebrow" style={{ color: '#4F46E5', fontWeight: 800 }}>
            🔐 Claims &amp; Handover Management
          </div>
          <h1 className="page-header__title">Claims Verification &amp; Form Responses</h1>
          <p className="page-header__sub">View all physical claim form responses entered by admins and process student ownership requests.</p>
        </div>

        {/* MAIN MODE NAVIGATION SWITCHER */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: 'var(--space-xl)', borderBottom: '2px solid var(--clr-border)', paddingBottom: '12px' }}>
          <button
            className={`btn ${mainTab === 'responses' ? 'btn--primary' : 'btn--secondary'}`}
            style={{ fontWeight: 800, padding: '10px 20px', borderRadius: 'var(--radius-lg)' }}
            onClick={() => setMainTab('responses')}
          >
            <FileCheck size={18} /> Claim Form Responses ({formResponses.length})
          </button>
          <button
            className={`btn ${mainTab === 'online' ? 'btn--primary' : 'btn--secondary'}`}
            style={{ fontWeight: 800, padding: '10px 20px', borderRadius: 'var(--radius-lg)' }}
            onClick={() => setMainTab('online')}
          >
            <MessageSquare size={18} /> Online Student Claims ({claims.length})
          </button>
        </div>

        {/* ─── TAB 1: CLAIM FORM RESPONSES VIEW ────────────────────────────────────── */}
        {mainTab === 'responses' && (
          <div>
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '42px', borderRadius: 'var(--radius-lg)' }}
                  placeholder="Search responses by Student Name, Roll No, Item Serial, Department..."
                  value={responseSearch}
                  onChange={(e) => setResponseSearch(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn--secondary" onClick={fetchFormResponses}>
                  <RefreshCw size={15} /> Refresh
                </button>
                <button className="btn btn--primary" onClick={handleLoadSampleResponses} title="Load sample claimed form responses">
                  <Sparkles size={15} /> Seed Sample Responses
                </button>
              </div>
            </div>

            {responsesLoading ? (
              <div className="loading-overlay" style={{ minHeight: '300px' }}><div className="spinner"></div></div>
            ) : filteredResponses.length === 0 ? (
              <div className="empty-state" style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: 'var(--space-3xl)', border: '1.5px solid var(--clr-border)', textAlign: 'center' }}>
                <div className="empty-state__icon">📄</div>
                <p className="empty-state__title">No Claim Form Responses Found</p>
                <p className="empty-state__text">When an admin claims an item and enters student details with form proof, the response will appear here.</p>
                <div style={{ marginTop: 'var(--space-lg)' }}>
                  <button className="btn btn--primary btn--lg" onClick={handleLoadSampleResponses}>
                    <Sparkles size={18} /> Load Sample Claim Responses Now
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-lg)' }}>
                {filteredResponses.map((item) => (
                  <div key={item._id || item.id} className="card" style={{ border: '1.5px solid #C7D2FE', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="badge badge--published" style={{ background: '#DCFCE7', color: '#15803D', borderColor: '#86EFAC', fontWeight: 800 }}>
                        <FileCheck size={12} style={{ marginRight: '4px' }} /> Verified Claim
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', fontWeight: 600 }}>
                        {formatDate(item.handover_date || item.updatedAt)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-md)', background: '#F1F5F9', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {item.image_url ? (
                          <img src={getImageUrl(item.image_url)} alt="Item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.5rem' }}>{getCategoryIcon(item.category)}</span>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ fontSize: '0.98rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          #{item.serial_number || 'N/A'} — {item.category}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: '#64748B' }}>📍 {item.location_found || 'Campus'}</p>
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                      <p style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#4338CA', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        Recipient Student Info
                      </p>
                      <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                        {item.handover_student_name || 'Name not recorded'}
                      </p>
                      <p style={{ fontSize: '0.84rem', color: '#475569' }}>
                        Reg / Roll #: <strong>{item.handover_reg_number || '—'}</strong>
                      </p>
                      {item.handover_phone && (
                        <p style={{ fontSize: '0.82rem', color: '#475569' }}>Phone: <strong>{item.handover_phone}</strong></p>
                      )}
                      {item.handover_department && (
                        <p style={{ fontSize: '0.82rem', color: '#475569' }}>Dept: <strong>{item.handover_department}</strong></p>
                      )}
                    </div>

                    {item.handover_form_url && (
                      <div>
                        {item.handover_form_url.toLowerCase().includes('.pdf') || item.handover_form_url.startsWith('data:application/pdf') ? (
                          <div style={{ border: '1.5px solid #FCA5A5', background: '#FEF2F2', padding: '12px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={22} color="#DC2626" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#991B1B' }}>Physical Handover Form (PDF)</div>
                              <div style={{ fontSize: '0.74rem', color: '#B91C1C' }}>Scanned document attached</div>
                            </div>
                            <a href={getImageUrl(item.handover_form_url)} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 800 }}>Open PDF ↗</a>
                          </div>
                        ) : (
                          <div style={{ border: '1px solid #CBD5E1', borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '140px', background: '#0F172A', textAlign: 'center', padding: '6px' }}>
                            <img src={getImageUrl(item.handover_form_url)} alt="Form Proof" style={{ height: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: 'var(--space-xs)', display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn--primary btn--sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => setSelectedResponseModal(item)}
                      >
                        <Eye size={15} /> View Full Response Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: ONLINE STUDENT CLAIMS VIEW ────────────────────────────────────── */}
        {mainTab === 'online' && (
          <div>
            <div className="tabs">
              {['', 'APPROVED', 'REJECTED'].map((status) => (
                <button
                  key={status}
                  className={`tab ${filter === status ? 'active' : ''}`}
                  onClick={() => setFilter(status)}
                >
                  {status || 'All Online Requests'}
                </button>
              ))}
            </div>

            {onlineLoading ? (
              <div className="loading-overlay" style={{ minHeight: '300px' }}><div className="spinner"></div></div>
            ) : errorMsg ? (
              <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center', maxWidth: '600px', margin: 'var(--space-2xl) auto' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>⚠️</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 'var(--space-xs)' }}>Unable to Load Requests</h3>
                <p style={{ color: 'var(--clr-text-muted)', marginBottom: 'var(--space-lg)' }}>{errorMsg}</p>
                <button className="btn btn--primary" onClick={fetchClaims}>
                  <RefreshCw size={15} /> Retry
                </button>
              </div>
            ) : claims.length === 0 ? (
              <div className="empty-state" style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: 'var(--space-3xl)', border: '1.5px solid var(--clr-border)' }}>
                <div className="empty-state__icon">🔐</div>
                <p className="empty-state__title">No online claims found</p>
                <p className="empty-state__text">No ownership claims match the selected status filter.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {claims.map((claim) => {
                  const item = claim.item_id;
                  const student = claim.student_id;
                  const title = item ? (item.serial_number ? `#${item.serial_number} ${item.uid ? `[${item.uid}]` : ''} — ${item.category}` : item.category) : '—';
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

                          <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: '#EEF2FF', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                            <p style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#3730A3', marginBottom: '2px' }}>
                              Claimant Student Profile
                            </p>
                            <p style={{ fontSize: '0.95rem', fontWeight: 700 }}>{student?.name || '—'}</p>
                            <p style={{ fontSize: '0.84rem', color: 'var(--clr-text-muted)' }}>
                              Registration #: <strong>{student?.registration_number}</strong> · Class {student?.class}-{student?.section}
                            </p>
                          </div>

                          <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: '#FFFFFF', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #4F46E5', border: '1px solid var(--clr-border)' }}>
                            <p style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clr-text-muted)', marginBottom: '4px' }}>
                              Student's Ownership Proof Message
                            </p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--clr-text)' }}>{claim.message}</p>
                          </div>

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
          </div>
        )}

        {/* DETAILED RESPONSE MODAL FOR CLAIM FORM RESPONSES */}
        {selectedResponseModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: '20px' }}>
            <div className="card" style={{ width: '100%', maxWidth: '640px', background: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: 'var(--space-2xl)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
              <button
                onClick={() => setSelectedResponseModal(null)}
                style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: 'var(--space-lg)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: '#DCFCE7', color: '#15803D', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <FileCheck size={26} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Complete Claim Form Response</h2>
                  <p style={{ fontSize: '0.86rem', color: 'var(--clr-text-muted)' }}>Verified recipient student information and uploaded handover document.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div style={{ background: '#F8FAFC', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--clr-border)' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--clr-text-muted)', marginBottom: '4px' }}>Claimed Item Reference</p>
                  <p style={{ fontSize: '1rem', fontWeight: 800 }}>
                    #{selectedResponseModal.serial_number || 'N/A'} — {selectedResponseModal.category}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                    Found at: {selectedResponseModal.location_found || 'N/A'} | Reported by: {selectedResponseModal.student_name} ({selectedResponseModal.registration_number})
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', background: '#EEF2FF', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1.5px solid #C7D2FE' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4338CA', textTransform: 'uppercase' }}>Recipient Student Name</span>
                    <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1E1B4B' }}>{selectedResponseModal.handover_student_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4338CA', textTransform: 'uppercase' }}>Registration / Roll No</span>
                    <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1E1B4B' }}>{selectedResponseModal.handover_reg_number || 'Not specified'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4338CA', textTransform: 'uppercase' }}>Phone Number</span>
                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E1B4B' }}>{selectedResponseModal.handover_phone || '—'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4338CA', textTransform: 'uppercase' }}>Department / Class</span>
                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E1B4B' }}>{selectedResponseModal.handover_department || '—'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4338CA', textTransform: 'uppercase' }}>Handover / Claim Date</span>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E1B4B' }}>{formatDate(selectedResponseModal.handover_date || selectedResponseModal.updatedAt)}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4338CA', textTransform: 'uppercase' }}>Processed By Admin</span>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E1B4B' }}>{selectedResponseModal.claimed_by_admin || 'System Admin'}</p>
                  </div>
                </div>

                {selectedResponseModal.handover_notes && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>Verification Remarks / Notes</span>
                    <p style={{ fontSize: '0.9rem', color: '#92400E', marginTop: '4px' }}>{selectedResponseModal.handover_notes}</p>
                  </div>
                )}

                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--clr-text-muted)', marginBottom: '8px', display: 'block' }}>Uploaded Physical Form Proof</span>
                  {selectedResponseModal.handover_form_url ? (
                    <div>
                      {selectedResponseModal.handover_form_url.toLowerCase().includes('.pdf') || selectedResponseModal.handover_form_url.startsWith('data:application/pdf') ? (
                        <div style={{ border: '1.5px solid #FCA5A5', background: '#FEF2F2', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: '#FEE2E2', color: '#DC2626', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <FileText size={24} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#991B1B' }}>
                              Physical Handover Form (PDF Document)
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#B91C1C', fontWeight: 600 }}>
                              Official scanned paper proof attached
                            </div>
                          </div>
                          <a href={getImageUrl(selectedResponseModal.handover_form_url)} target="_blank" rel="noreferrer" className="btn btn--primary btn--sm" style={{ textDecoration: 'none' }}>
                            Open PDF ↗
                          </a>
                        </div>
                      ) : (
                        <div style={{ border: '1.5px solid var(--clr-border-indigo)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '300px', background: '#0F172A', textAlign: 'center', padding: '10px' }}>
                          <a href={getImageUrl(selectedResponseModal.handover_form_url)} target="_blank" rel="noreferrer">
                            <img src={getImageUrl(selectedResponseModal.handover_form_url)} alt="Physical Handover Form" style={{ maxHeight: '280px', maxWidth: '100%', objectFit: 'contain' }} />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.88rem', color: '#94A3B8', fontStyle: 'italic' }}>No document uploaded.</p>
                  )}
                </div>

                <div style={{ marginTop: 'var(--space-sm)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn--primary btn--lg" onClick={() => setSelectedResponseModal(null)}>
                    Close Response
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
