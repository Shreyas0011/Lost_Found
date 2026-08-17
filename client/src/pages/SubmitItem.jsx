import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Camera, X, UploadCloud, UserCheck } from 'lucide-react';

export default function SubmitItem() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState('');
  const [locationFound, setLocationFound] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [dateFound, setDateFound] = useState(new Date().toISOString().split('T')[0]);
  const [timeFound, setTimeFound] = useState('');
  const [description, setDescription] = useState('');

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/login?redirect=/submit');
    }
  }, [user, navigate]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit.');
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!category || !locationFound || !dateFound) {
      setError('Please fill in Category, Location Found, and Date Found.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('location_found', locationFound);
      formData.append('brand', brand);
      formData.append('color', color);
      formData.append('size', size);
      formData.append('date_found', dateFound);
      formData.append('time_found', timeFound);
      formData.append('description', description);
      if (file) formData.append('image', file);

      await apiFetch('/items', {
        method: 'POST',
        body: formData,
      });

      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to submit found item.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <main className="page page--medium">
      <div className="page-header">
        <div className="page-header__eyebrow">📦 Found Something?</div>
        <h1 className="page-header__title">Report a Found Item</h1>
        <p className="page-header__sub">Fill in the details below. An admin will review and publish your submission to the registry.</p>
      </div>

      <div className="card card--elevated" style={{ maxWidth: '780px' }}>
        <form onSubmit={handleSubmit}>
          {/* File Upload Zone */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <label className="form-label" style={{ marginBottom: 'var(--space-sm)', display: 'block' }}>
              Item Photo
            </label>

            {!preview ? (
              <div className="file-upload">
                <input type="file" accept="image/*" onChange={handleFileChange} />
                <div className="file-upload__icon"><Camera size={36} color="var(--clr-primary)" /></div>
                <p className="file-upload__text">Drag &amp; drop or click to upload</p>
                <p className="file-upload__hint">JPEG, PNG, WebP · Max 5MB</p>
              </div>
            ) : (
              <div className="file-preview">
                <img src={preview} alt="Preview" />
                <button type="button" className="file-preview__remove" onClick={removeFile}>
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <hr className="divider" />

          {/* Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category <span className="required">*</span></label>
                <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)} required>
                  <option value="">Select category</option>
                  <option>Electronics</option><option>Clothing</option><option>Books</option>
                  <option>ID / Cards</option><option>Accessories</option><option>Bags</option>
                  <option>Keys</option><option>Stationery</option><option>Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Location Found <span className="required">*</span></label>
                <select className="form-control" value={locationFound} onChange={(e) => setLocationFound(e.target.value)} required>
                  <option value="">Select location</option>
                  <option>Library</option><option>Cafeteria</option><option>Classroom</option>
                  <option>Hostel</option><option>Parking</option><option>Sports Area</option>
                  <option>Administrative Block</option><option>Other</option>
                </select>
              </div>
            </div>

            <div className="form-row form-row--3">
              <div className="form-group">
                <label className="form-label">Brand</label>
                <input className="form-control" type="text" placeholder="e.g. Nike, Apple" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <input className="form-control" type="text" placeholder="e.g. Black, Red" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Size</label>
                <input className="form-control" type="text" placeholder="e.g. Medium, 15-inch" value={size} onChange={(e) => setSize(e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date Found <span className="required">*</span></label>
                <input className="form-control" type="date" value={dateFound} onChange={(e) => setDateFound(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Time Found</label>
                <input className="form-control" type="time" value={timeFound} onChange={(e) => setTimeFound(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Describe identifying marks, condition, specific details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Submitter read-only badge */}
            <div className="card" style={{ background: 'var(--clr-surface-2)', padding: 'var(--space-md)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--clr-primary-dark)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-xs)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={14} /> Submitter Verification Details
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-xl)', fontSize: '0.9rem', fontWeight: 500 }}>
                <span>👤 {user.name}</span>
                <span style={{ color: 'var(--clr-text-muted)' }}>🆔 {user.registration_number}</span>
              </div>
            </div>

            {error && (
              <div style={{ padding: 'var(--space-md)', background: '#FFE4E6', border: '1px solid #FECDD3', borderRadius: 'var(--radius-md)', color: '#E11D48', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button type="submit" className="btn btn--primary btn--lg" disabled={submitting}>
                {submitting ? 'Submitting Item…' : 'Submit Found Item'}
              </button>
              <button type="button" className="btn btn--secondary btn--lg" onClick={() => navigate('/')}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
