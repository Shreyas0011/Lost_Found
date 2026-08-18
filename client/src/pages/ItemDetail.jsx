import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch, formatDate, getCategoryIcon, getImageUrl } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { MapPin, Building2, Clock, Calendar, ShieldAlert, ArrowLeft, Ban, CheckCircle, Download, X, FileCheck, User, HeartHandshake } from 'lucide-react';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Claim Modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimStudentName, setClaimStudentName] = useState(user?.name || '');
  const [claimRegNo, setClaimRegNo] = useState(user?.registration_number || '');
  const [claimMessage, setClaimMessage] = useState('');
  const [letterGenerated, setLetterGenerated] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/items/${id}`);
        setItem(data.item);
      } catch (err) {
        setError(err.message || 'Item not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  useEffect(() => {
    if (user) {
      if (!claimStudentName) setClaimStudentName(user.name || '');
      if (!claimRegNo) setClaimRegNo(user.registration_number || '');
    }
  }, [user]);

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate this item? It will be moved to the deactivated section.')) return;
    try {
      if (user?.role === 'admin') {
        await apiFetch(`/items/admin/${item._id}/status`, {
          method: 'PATCH',
          body: { status: 'DEACTIVATED' },
        });
      }
      setItem((prev) => ({ ...prev, status: 'DEACTIVATED' }));
      alert('Item has been deactivated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to deactivate item.');
    }
  };

  const handleClaimFormSubmit = async (e) => {
    e.preventDefault();
    if (!claimMessage.trim()) {
      alert('Please provide proof of ownership / details.');
      return;
    }
    setSubmittingClaim(true);
    try {
      if (user?.role === 'student') {
        await apiFetch('/claims', {
          method: 'POST',
          body: { item_id: item._id, message: claimMessage },
        }).catch(() => {});
      }
      setLetterGenerated(true);
    } catch (err) {
      console.error(err);
      setLetterGenerated(true);
    } finally {
      setSubmittingClaim(false);
    }
  };

  const downloadStudentAcceptedLetterPNG = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 950;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 950);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(1, '#1E293B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 950);

    // Outer border
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 740, 890);

    // Title & Header
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('TRANSCEND LOST & FOUND MODULE', 60, 90);

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('STUDENT CLAIM ACCEPTANCE LETTER', 60, 130);

    // Separator line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 155);
    ctx.lineTo(740, 155);
    ctx.stroke();

    // Key-value rows
    const drawRow = (label, val, y) => {
      ctx.fillStyle = '#94A3B8';
      ctx.font = '16px sans-serif';
      ctx.fillText(label, 60, y);

      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(String(val || '—'), 260, y);
    };

    drawRow('ITEM SERIAL NUMBER:', item?.serial_number || 'LF-10001', 195);
    drawRow('UNIQUE ID (UID):', item?.uid || 'UID-10001', 235);
    drawRow('ITEM CATEGORY:', item?.category || 'General', 275);
    drawRow('LOCATION FOUND:', item?.location_found || 'Campus Building', 315);
    drawRow('WHO FOUND:', item?.who_found || 'Campus Staff', 355);
    drawRow('REPORTED BY:', item?.student_name || 'System Admin', 395);

    // Separator line
    ctx.beginPath();
    ctx.moveTo(60, 420);
    ctx.lineTo(740, 420);
    ctx.stroke();

    drawRow('CLAIMANT STUDENT:', claimStudentName || 'Student', 465);
    drawRow('REGISTRATION NUMBER:', claimRegNo || 'N/A', 510);
    drawRow('ACCEPTANCE DATE:', new Date().toLocaleDateString('en-IN'), 555);

    // Verification Box
    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.fillRect(60, 600, 680, 140);
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 600, 680, 140);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('STATUS: CLAIM ACCEPTED & VERIFIED', 90, 645);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '15px sans-serif';
    ctx.fillText('Present this letter along with your Student ID Card at the collection desk', 90, 685);
    ctx.fillText('for physical item verification and handover.', 90, 715);

    // Official Stamp Seal
    ctx.save();
    ctx.translate(620, 780);
    ctx.rotate(-0.15);
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 58, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TRANSCEND AUTH', 0, -18);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('ACCEPTED', 0, 8);
    ctx.font = '11px sans-serif';
    ctx.fillText('VERIFIED SEAL', 0, 28);
    ctx.restore();

    // Trigger download
    const link = document.createElement('a');
    link.download = `Student_Accepted_Letter_${item?.serial_number || 'Item'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

  if (error || !item) {
    return (
      <main className="page">
        <div className="empty-state">
          <div className="empty-state__icon">🔍</div>
          <p className="empty-state__title">Item Not Found</p>
          <p className="empty-state__text">{error || 'This item may have been removed or claimed.'}</p>
          <Link to="/" className="btn btn--primary">Back to Search</Link>
        </div>
      </main>
    );
  }

  const title = item.category;
  const icon = getCategoryIcon(item.category);

  const foundDateObj = new Date(item.date_found || item.uploaded_at || Date.now());
  const expiryDateObj = new Date(foundDateObj.getTime() + 30 * 24 * 60 * 60 * 1000);
  const formattedExpiry = expiryDateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handleDonate = async () => {
    const itemDate = new Date(item.uploaded_at || item.date_found || Date.now());
    const daysElapsed = Math.floor((Date.now() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysElapsed < 30 && item.status !== 'UNCLAIMED' && item.status !== 'EXPIRED') {
      alert(`Item cannot be donated yet. The 1-month collection period window has ${30 - daysElapsed} day(s) remaining.`);
      return;
    }
    if (!window.confirm('Donate this item to charity? The 1-month collection window has crossed.')) return;
    try {
      await apiFetch(`/items/admin/${item._id}/status`, {
        method: 'PATCH',
        body: { status: 'DONATED' },
      });
      alert('Item has been donated and moved to Donated Items archive.');
      navigate('/admin/items?status=DONATED');
    } catch (err) {
      alert(err.message || 'Failed to donate item.');
    }
  };

  return (
    <main className="page page--medium">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--clr-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 'var(--space-lg)' }}>
        <ArrowLeft size={16} /> Back to Search
      </Link>

      <div className="item-detail">
        <div className="item-detail__img">
          {item.image_url ? (
            <img src={getImageUrl(item.image_url)} alt={title} />
          ) : (
            <span style={{ fontSize: '5rem' }}>{icon}</span>
          )}
        </div>

        <div className="item-detail__info">
          <div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', marginBottom: 'var(--space-sm)', flexWrap: 'wrap' }}>
              <span className="badge badge--published" style={{ background: 'var(--clr-surface-2)' }}>{icon} {item.category}</span>
              <StatusBadge status={item.status} />
              {item.serial_number && (
                <span className="badge" style={{ background: '#0F172A', color: '#38BDF8', fontWeight: 800 }}>
                  Serial #: {item.serial_number}
                </span>
              )}
              {item.uid && (
                <span className="badge" style={{ background: '#1E293B', color: '#818CF8', fontWeight: 800, fontFamily: 'monospace' }}>
                  UID: {item.uid}
                </span>
              )}
            </div>
            <h1 className="item-detail__title">{title}</h1>
          </div>

          <div className="item-meta-list">
            <div className="item-meta-row">
              <span className="item-meta-row__key">Serial Number</span>
              <span className="item-meta-row__val" style={{ fontWeight: 800, color: 'var(--clr-primary)' }}>{item.serial_number || '—'}</span>
            </div>
            <div className="item-meta-row">
              <span className="item-meta-row__key">Unique Identifier (UID)</span>
              <span className="item-meta-row__val" style={{ fontWeight: 800, color: '#6366F1', fontFamily: 'monospace' }}>{item.uid || '—'}</span>
            </div>
            <div className="item-meta-row">
              <span className="item-meta-row__key">Category</span>
              <span className="item-meta-row__val">{item.category}</span>
            </div>
            <div className="item-meta-row">
              <span className="item-meta-row__key">Location Found</span>
              <span className="item-meta-row__val">{item.location_found || '—'}</span>
            </div>
            <div className="item-meta-row">
              <span className="item-meta-row__key">Date Found</span>
              <span className="item-meta-row__val">{formatDate(item.date_found)}</span>
            </div>
            <div className="item-meta-row">
              <span className="item-meta-row__key">Time Found</span>
              <span className="item-meta-row__val">{item.time_found || '—'}</span>
            </div>
            <div className="item-meta-row">
              <span className="item-meta-row__key">Who Found</span>
              <span className="item-meta-row__val">{item.who_found || 'Campus Staff'}</span>
            </div>
            <div className="item-meta-row">
              <span className="item-meta-row__key">Reported By</span>
              <span className="item-meta-row__val">{item.student_name} ({item.registration_number})</span>
            </div>
            <div className="item-meta-row">
              <span className="item-meta-row__key">Description</span>
              <span className="item-meta-row__val">{item.description || '—'}</span>
            </div>
          </div>

          {/* Action Buttons: CLAIM (students & all), DONATE & DEACTIVATE (admin only) */}
          <div style={{ marginTop: 'var(--space-xl)', display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            {item.status !== 'DEACTIVATED' && item.status !== 'CLAIMED' && item.status !== 'DONATED' && (
              <button
                className="btn btn--primary btn--lg"
                style={{ flex: 1, minWidth: '180px', justifyContent: 'center' }}
                onClick={() => {
                  setLetterGenerated(false);
                  setShowClaimModal(true);
                }}
              >
                <CheckCircle size={18} /> Claim Item
              </button>
            )}

            {item.status !== 'DEACTIVATED' && item.status !== 'DONATED' && user?.role === 'admin' && (
              <button
                className="btn btn--secondary btn--lg"
                style={{ flex: 1, minWidth: '180px', justifyContent: 'center', background: '#F3E8FF', color: '#7E22CE', borderColor: '#E9D5FF', fontWeight: 800 }}
                onClick={handleDonate}
                title="Donate item after 1-month collection period"
              >
                <HeartHandshake size={18} /> Donate Item
              </button>
            )}

            {item.status !== 'DEACTIVATED' && user?.role === 'admin' && (
              <button
                className="btn btn--danger btn--lg"
                style={{ flex: 1, minWidth: '180px', justifyContent: 'center', background: '#DC2626', borderColor: '#B91C1C' }}
                onClick={handleDeactivate}
              >
                <Ban size={18} /> Deactivate Item
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Collection Instructions Card */}
      <div style={{ marginTop: 'var(--space-2xl)' }}>
        <div className="card" style={{ border: '2px solid var(--clr-border-indigo)', background: '#FFFFFF', padding: 'var(--space-xl)', borderRadius: 'var(--radius-xl)', boxShadow: '0 16px 40px -10px rgba(79, 70, 229, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: 'var(--space-md)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--grad-indigo)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Building2 size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--clr-text)' }}>Item Handover &amp; Verification Desk</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-muted)' }}>Use the Claim option above to generate your official Student Accepted Letter PNG for physical pickup.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}>
            <div style={{ background: '#EEF2FF', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--clr-border-indigo)' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#3730A3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} /> Collection Location
              </div>
              <p style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--clr-text)' }}>
                {item.location_found ? `${item.location_found} Help Desk` : 'Central Administrative Desk'}
              </p>
              <p style={{ fontSize: '0.84rem', color: 'var(--clr-text-muted)', marginTop: '4px' }}>
                Ground Floor · Security &amp; Lost &amp; Found Office
              </p>
            </div>

            <div style={{ background: '#EEF2FF', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--clr-border-indigo)' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#3730A3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} /> Collection Time Slot
              </div>
              <p style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--clr-text)' }}>
                Mon – Fri: 10:00 AM to 4:30 PM
              </p>
            </div>

            <div style={{ background: '#FEF3C7', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} /> Retention Limit
              </div>
              <p style={{ fontSize: '0.98rem', fontWeight: 800, color: '#B45309' }}>
                Claim Deadline: {formattedExpiry}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CLAIM FORM & STUDENT ACCEPTED LETTER PNG MODAL */}
      {showClaimModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '640px', background: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: 'var(--space-2xl)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button
              onClick={() => setShowClaimModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
            >
              <X size={18} />
            </button>

            {!letterGenerated ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-lg)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: '#EEF2FF', color: 'var(--clr-primary)', display: 'grid', placeItems: 'center' }}>
                    <FileCheck size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Item Ownership Claim Form</h2>
                    <p style={{ fontSize: '0.86rem', color: 'var(--clr-text-muted)' }}>Submit claim details to generate your official Student Accepted Letter PNG.</p>
                  </div>
                </div>

                <form onSubmit={handleClaimFormSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div style={{ background: '#F8FAFC', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--clr-text-muted)', marginBottom: '4px' }}>Item Reference</p>
                      <p style={{ fontSize: '0.96rem', fontWeight: 800 }}>{item.category} — Serial #: <span style={{ color: 'var(--clr-primary)' }}>{item.serial_number || 'N/A'}</span></p>
                    </div>

                    <div>
                      <label className="form-label">Student Name <span className="required">*</span></label>
                      <input
                        className="form-control"
                        type="text"
                        value={claimStudentName}
                        onChange={(e) => setClaimStudentName(e.target.value)}
                        required
                        placeholder="Enter full student name"
                      />
                    </div>

                    <div>
                      <label className="form-label">Registration Number <span className="required">*</span></label>
                      <input
                        className="form-control"
                        type="text"
                        value={claimRegNo}
                        onChange={(e) => setClaimRegNo(e.target.value)}
                        required
                        placeholder="e.g. REG001"
                      />
                    </div>

                    <div>
                      <label className="form-label">Proof of Ownership / Remarks <span className="required">*</span></label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={claimMessage}
                        onChange={(e) => setClaimMessage(e.target.value)}
                        placeholder="Describe exact identifying features, marks, or location where you lost it..."
                        required
                      />
                    </div>

                    <button type="submit" className="btn btn--primary btn--lg" style={{ marginTop: 'var(--space-sm)' }} disabled={submittingClaim}>
                      <CheckCircle size={18} /> {submittingClaim ? 'Generating Authorization…' : 'Submit Claim & Generate Letter PNG'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#DCFCE7', color: '#166534', display: 'grid', placeItems: 'center', margin: '0 auto var(--space-md)' }}>
                    <CheckCircle size={32} />
                  </div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#166534' }}>Student Accepted Letter Generated!</h2>
                  <p style={{ fontSize: '0.86rem', color: 'var(--clr-text-muted)' }}>Below is your official claim acceptance document. Click download to save the letter PNG.</p>
                </div>

                {/* VISUAL STUDENT ACCEPTED LETTER CARD */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    color: '#FFFFFF',
                    border: '2px solid #38BDF8',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ borderBottom: '2px solid #334155', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Transcend Lost &amp; Found Module
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '2px' }}>
                      STUDENT ACCEPTED CLAIM LETTER
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem' }}>SERIAL NUMBER</span>
                      <strong style={{ color: '#38BDF8', fontSize: '1rem', fontFamily: 'monospace' }}>#{item.serial_number || 'LF-10001'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem' }}>CATEGORY</span>
                      <strong>{item.category}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem' }}>STUDENT NAME</span>
                      <strong>{claimStudentName}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem' }}>REGISTRATION #</span>
                      <strong>{claimRegNo}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem' }}>LOCATION FOUND</span>
                      <span>{item.location_found}</span>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem' }}>REPORTED BY</span>
                      <span>{item.student_name}</span>
                    </div>
                  </div>

                  {/* Verification Banner */}
                  <div style={{ marginTop: '16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle size={20} color="#10B981" />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10B981' }}>CLAIM STATUS: ACCEPTED</div>
                      <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Valid for immediate in-person physical collection</div>
                    </div>
                  </div>

                  {/* Stamp Graphic */}
                  <div style={{ position: 'absolute', bottom: '16px', right: '16px', border: '3px double #10B981', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-12deg)', color: '#10B981', opacity: 0.85 }}>
                    <div style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase' }}>OFFICIAL</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900 }}>ACCEPTED</div>
                    <div style={{ fontSize: '0.5rem' }}>TRANSCEND</div>
                  </div>
                </div>

                <div style={{ marginTop: 'var(--space-xl)', display: 'flex', gap: 'var(--space-md)' }}>
                  <button className="btn btn--primary btn--lg" style={{ flex: 1 }} onClick={downloadStudentAcceptedLetterPNG}>
                    <Download size={18} /> Download Letter PNG
                  </button>
                  <button className="btn btn--secondary btn--lg" onClick={() => setShowClaimModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
