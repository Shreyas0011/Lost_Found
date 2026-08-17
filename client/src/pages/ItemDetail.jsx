import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch, formatDate, getCategoryIcon } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { Lock, ArrowLeft } from 'lucide-react';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState('');

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

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setClaimError('');

    if (!claimMessage.trim()) {
      setClaimError('Please provide a message explaining why this item belongs to you.');
      return;
    }

    setClaimSubmitting(true);
    try {
      const data = await apiFetch('/claims', {
        method: 'POST',
        body: { item_id: item._id, message: claimMessage },
      });

      navigate(`/chat/${data.claim._id}`);
    } catch (err) {
      setClaimError(err.message || 'Failed to submit claim request.');
    } finally {
      setClaimSubmitting(false);
    }
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

  const title = [item.color, item.brand, item.category].filter(Boolean).join(' ') || item.category;
  const icon = getCategoryIcon(item.category);

  return (
    <main className="page page--medium">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--clr-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 'var(--space-lg)' }}>
        <ArrowLeft size={16} /> Back to Search
      </Link>

      <div className="item-detail">
        <div className="item-detail__img">
          {item.image_url ? (
            <img src={item.image_url} alt={title} />
          ) : (
            <span style={{ fontSize: '5rem' }}>{icon}</span>
          )}
        </div>

        <div className="item-detail__info">
          <div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
              <span className="badge badge--published" style={{ background: 'var(--clr-surface-2)' }}>{icon} {item.category}</span>
              <StatusBadge status={item.status} />
            </div>
            <h1 className="item-detail__title">{title}</h1>
          </div>

          <div className="item-meta-list">
            <div className="item-meta-row">
              <span className="item-meta-row__key">Location</span>
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
              <span className="item-meta-row__key">Color</span>
              <span className="item-meta-row__val">{item.color || '—'}</span>
            </div>
            <div className="item-meta-row">
              <span className="item-meta-row__key">Brand</span>
              <span className="item-meta-row__val">{item.brand || '—'}</span>
            </div>
            <div className="item-meta-row">
              <span className="item-meta-row__key">Size</span>
              <span className="item-meta-row__val">{item.size || '—'}</span>
            </div>
            <div className="item-meta-row">
              <span className="item-meta-row__key">Description</span>
              <span className="item-meta-row__val">{item.description || '—'}</span>
            </div>
          </div>

          {/* Action / Claim button section */}
          <div style={{ marginTop: 'var(--space-md)' }}>
            {item.status !== 'PUBLISHED' ? (
              <div style={{ padding: 'var(--space-md)', background: 'var(--clr-surface-2)', borderRadius: 'var(--radius-md)', color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
                This item is currently not accepting claims ({item.status}).
              </div>
            ) : !user || user.role !== 'student' ? (
              <div style={{ padding: 'var(--space-md)', background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--clr-text-muted)', marginBottom: 'var(--space-md)' }}>
                  Is this your item? Verify your student identity to submit an ownership claim.
                </p>
                <Link to={`/login?redirect=/item/${item._id}`} className="btn btn--primary">
                  Verify to Claim
                </Link>
              </div>
            ) : (
              <button className="btn btn--primary btn--lg" onClick={() => setShowClaimForm(!showClaimForm)}>
                <Lock size={18} /> {showClaimForm ? 'Close Claim Form' : 'Request Ownership'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Claim Form */}
      {showClaimForm && (
        <div style={{ marginTop: 'var(--space-2xl)' }}>
          <div className="claim-panel">
            <h2>🔐 Request Ownership</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-muted)', marginBottom: 'var(--space-lg)' }}>
              Describe why you believe this item belongs to you. Include identifying marks, contents, tear/scratches, or exact location lost.
            </p>

            <form onSubmit={handleClaimSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Why do you believe this item is yours? <span className="required">*</span></label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Describe unique characteristics, inside contents, serial numbers, specific tears/wear..."
                  value={claimMessage}
                  onChange={(e) => setClaimMessage(e.target.value)}
                  required
                />
              </div>

              {claimError && (
                <div style={{ padding: 'var(--space-md)', background: '#FFE4E6', border: '1px solid #FECDD3', borderRadius: 'var(--radius-md)', color: '#E11D48', fontSize: '0.85rem' }}>
                  {claimError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <button type="submit" className="btn btn--primary" disabled={claimSubmitting}>
                  {claimSubmitting ? 'Submitting Claim…' : 'Submit Claim'}
                </button>
                <button type="button" className="btn btn--secondary" onClick={() => setShowClaimForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
