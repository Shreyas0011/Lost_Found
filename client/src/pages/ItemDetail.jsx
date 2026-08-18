import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch, formatDate, getCategoryIcon, getImageUrl } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { MapPin, Building2, Clock, Calendar, ShieldAlert, ArrowLeft } from 'lucide-react';

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
            <img src={getImageUrl(item.image_url)} alt={title} />
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

        </div>
      </div>

      {/* Collection Instructions & 1-Month Period Card */}
      <div style={{ marginTop: 'var(--space-2xl)' }}>
        <div className="card" style={{ border: '2px solid var(--clr-border-indigo)', background: '#FFFFFF', padding: 'var(--space-xl)', borderRadius: 'var(--radius-xl)', boxShadow: '0 16px 40px -10px rgba(79, 70, 229, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: 'var(--space-md)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--grad-indigo)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Building2 size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--clr-text)' }}>How to Collect Your Item</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-muted)' }}>If this item belongs to you, please visit the designated building desk in person with valid identification.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}>
            {/* Pickup Location */}
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

            {/* Collection Hours */}
            <div style={{ background: '#EEF2FF', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--clr-border-indigo)' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#3730A3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} /> Collection Time Slot
              </div>
              <p style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--clr-text)' }}>
                Mon – Fri: 10:00 AM to 4:30 PM
              </p>
              <p style={{ fontSize: '0.84rem', color: 'var(--clr-text-muted)', marginTop: '4px' }}>
                Closed on weekends &amp; official holidays
              </p>
            </div>

            {/* 1-Month Retention Period */}
            <div style={{ background: '#FEF3C7', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} /> 1-Month Retention Limit
              </div>
              <p style={{ fontSize: '0.98rem', fontWeight: 800, color: '#B45309' }}>
                Claim Deadline: {formattedExpiry}
              </p>
              <p style={{ fontSize: '0.84rem', color: '#92400E', marginTop: '4px' }}>
                30 days from date logged ({formatDate(item.date_found)}). Unclaimed items will be disposed/donated.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--clr-text-muted)' }}>
            <ShieldAlert size={20} color="var(--clr-primary)" style={{ flexShrink: 0 }} />
            <span><strong>Requirement to Collect:</strong> Please bring a valid <strong>Student ID Card</strong> for in-person identity verification at the desk.</span>
          </div>
        </div>
      </div>
    </main>
  );
}
