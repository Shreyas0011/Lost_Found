import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch, getFormFields, DEFAULT_FORM_FIELDS } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import { Camera, X, UploadCloud, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function AdminAddItem() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formSchema, setFormSchema] = useState(DEFAULT_FORM_FIELDS);
  const [category, setCategory] = useState('');
  const [locationFound, setLocationFound] = useState('');
  const [whoFound, setWhoFound] = useState('');
  const [dateFound, setDateFound] = useState(new Date().toISOString().split('T')[0]);
  const [timeFound, setTimeFound] = useState('');
  const [description, setDescription] = useState('');
  const [customValues, setCustomValues] = useState({});

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    async function fetchSchema() {
      const data = await getFormFields();
      if (data) setFormSchema(data);
    }
    fetchSchema();
  }, []);

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

  const handleCustomChange = (fieldId, val) => {
    setCustomValues((prev) => ({ ...prev, [fieldId]: val }));
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
      formData.append('who_found', whoFound);
      formData.append('date_found', dateFound);
      formData.append('time_found', timeFound);
      formData.append('description', description);
      if (Object.keys(customValues).length > 0) {
        formData.append('custom_fields', JSON.stringify(customValues));
      }
      if (file) formData.append('image', file);

      const res = await apiFetch('/items', {
        method: 'POST',
        body: formData,
      });

      // Auto-publish item so students can view & claim it immediately
      if (res?.item?._id || res?.item?.id) {
        const itemId = res.item._id || res.item.id;
        await apiFetch(`/items/admin/${itemId}/status`, {
          method: 'PATCH',
          body: { status: 'PUBLISHED' },
        });
      }

      navigate('/admin/items');
    } catch (err) {
      setError(err.message || 'Failed to upload found item.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return null;

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <Link to="/admin/items" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--clr-primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>
          <ArrowLeft size={16} /> Back to Inventory
        </Link>

        <div className="page-header">
          <div className="page-header__eyebrow">➕ Admin Portal</div>
          <h1 className="page-header__title">Upload Found Item</h1>
          <p className="page-header__sub">Upload photos and details of found items. Published items will be visible to students for ownership claims.</p>
        </div>

        <div className="card card--elevated" style={{ maxWidth: '820px', background: '#FFFFFF' }}>
          <form onSubmit={handleSubmit}>
            {/* File Upload Zone */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <label className="form-label" style={{ marginBottom: 'var(--space-sm)', display: 'block', fontSize: '1rem', fontWeight: 800 }}>
                Item Photo Upload <span className="required">*</span>
              </label>

              {!preview ? (
                <div className="file-upload" style={{ background: '#EEF2FF', border: '2px dashed var(--clr-border-indigo)', padding: 'var(--space-2xl)' }}>
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                  <div className="file-upload__icon"><Camera size={42} color="var(--clr-primary)" /></div>
                  <p className="file-upload__text" style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '12px' }}>
                    Click or drag &amp; drop item photo here
                  </p>
                  <p className="file-upload__hint" style={{ color: 'var(--clr-text-muted)' }}>JPEG, PNG, WebP · Max 5MB</p>
                </div>
              ) : (
                <div className="file-preview" style={{ height: '300px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative' }}>
                  <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" className="file-preview__remove" onClick={removeFile} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            <hr className="divider" style={{ margin: 'var(--space-xl) 0' }} />

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label">Category <span className="required">*</span></label>
                  <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)} required>
                    <option value="">Select category</option>
                    {(formSchema.categories || []).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Location Found <span className="required">*</span></label>
                  <select className="form-control" value={locationFound} onChange={(e) => setLocationFound(e.target.value)} required>
                    <option value="">Select location</option>
                    {(formSchema.locations || []).map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Who Found the Item?</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. Student name, Security guard, Staff member..."
                  value={whoFound}
                  onChange={(e) => setWhoFound(e.target.value)}
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label">Date Found <span className="required">*</span></label>
                  <input className="form-control" type="date" value={dateFound} onChange={(e) => setDateFound(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Time Found</label>
                  <input className="form-control" type="time" value={timeFound} onChange={(e) => setTimeFound(e.target.value)} />
                </div>
              </div>

              {/* DYNAMIC SUPERADMIN CUSTOM FIELDS */}
              {(formSchema.customFields || []).length > 0 && (
                <div style={{ background: '#FAF5FF', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid #E9D5FF' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#6B21A8', marginBottom: 'var(--space-sm)' }}>
                    ⚡ SuperAdmin Configured Custom Fields
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
                    {formSchema.customFields.map((field) => (
                      <div key={field.id} className="form-group">
                        <label className="form-label">
                          {field.name} {field.required && <span className="required">*</span>}
                        </label>
                        <input
                          type={field.type || 'text'}
                          className="form-control"
                          placeholder={field.placeholder || ''}
                          value={customValues[field.id] || ''}
                          onChange={(e) => handleCustomChange(field.id, e.target.value)}
                          required={field.required}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Description / Remarks</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Describe unique marks, condition, specific desk or location details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {error && (
                <div style={{ padding: 'var(--space-md)', background: '#FFE4E6', border: '1px solid #FECDD3', borderRadius: 'var(--radius-md)', color: '#E11D48', fontSize: '0.88rem', fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                <button type="submit" className="btn btn--primary btn--lg" disabled={submitting}>
                  <CheckCircle2 size={18} /> {submitting ? 'Uploading Item…' : 'Upload & Publish Item'}
                </button>
                <button type="button" className="btn btn--secondary btn--lg" onClick={() => navigate('/admin/items')}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

