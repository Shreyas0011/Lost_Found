import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch, formatDate, getCategoryIcon, getImageUrl, getFormFields, DEFAULT_FORM_FIELDS } from '../services/api';
import { Search, Calendar, MapPin, ArrowRight, Sparkles, RefreshCw, Layers, Edit3, Save, X } from 'lucide-react';

const STATUSES = [
  'PUBLISHED', 'UNCLAIMED', 'CLAIMED', 'RETURNED', 'EXPIRED', 'DEACTIVATED', 'DONATED'
];

export default function StudentSearch() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [categories, setCategories] = useState(DEFAULT_FORM_FIELDS.categories);
  const [locations, setLocations] = useState(DEFAULT_FORM_FIELDS.locations);

  useEffect(() => {
    async function loadSchema() {
      const data = await getFormFields();
      if (data) {
        if (data.categories) setCategories(data.categories);
        if (data.locations) setLocations(data.locations);
      }
    }
    loadSchema();
  }, []);

  // SuperAdmin Full Item Edit Modal state
  const [editModalItem, setEditModalItem] = useState(null);
  const [editSerial, setEditSerial] = useState('');
  const [editUid, setEditUid] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editWhoFound, setEditWhoFound] = useState('');
  const [editLocationFound, setEditLocationFound] = useState('');
  const [editDateFound, setEditDateFound] = useState('');
  const [editTimeFound, setEditTimeFound] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStudentName, setEditStudentName] = useState('');
  const [editRegNo, setEditRegNo] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const navigate = useNavigate();

  const openEditModal = (itemObj) => {
    setEditModalItem(itemObj);
    setEditSerial(itemObj.serial_number || '');
    setEditUid(itemObj.uid || '');
    setEditCategory(itemObj.category || 'Electronics');
    setEditWhoFound(itemObj.who_found || '');
    setEditLocationFound(itemObj.location_found || 'Library');
    setEditDateFound(itemObj.date_found ? new Date(itemObj.date_found).toISOString().split('T')[0] : '');
    setEditTimeFound(itemObj.time_found || '');
    setEditDescription(itemObj.description || '');
    setEditStudentName(itemObj.student_name || '');
    setEditRegNo(itemObj.registration_number || '');
    setEditStatus(itemObj.status || 'PUBLISHED');
    setEditNotes(itemObj.handover_notes || '');
    setEditImageFile(null);
    setEditImagePreview(itemObj.image_url ? getImageUrl(itemObj.image_url) : '');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmittingEdit(true);
    try {
      const formData = new FormData();
      formData.append('serial_number', editSerial);
      formData.append('uid', editUid);
      formData.append('category', editCategory);
      formData.append('who_found', editWhoFound);
      formData.append('location_found', editLocationFound);
      if (editDateFound) formData.append('date_found', editDateFound);
      formData.append('time_found', editTimeFound);
      formData.append('description', editDescription);
      formData.append('student_name', editStudentName);
      formData.append('registration_number', editRegNo);
      formData.append('status', editStatus);
      formData.append('handover_notes', editNotes);
      if (editImageFile) formData.append('image', editImageFile);

      await apiFetch(`/items/admin/${editModalItem._id || editModalItem.id}/edit`, {
        method: 'PUT',
        body: formData,
      });

      alert('Item details updated successfully on website by SuperAdmin!');
      setEditModalItem(null);
      fetchItems();
    } catch (err) {
      alert(err.message || 'Failed to update item details.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      if (location) params.set('location_found', location);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);

      const data = await apiFetch(`/items?${params.toString()}`);
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category, location, dateFrom, dateTo]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const clearFilters = () => {
    setQ('');
    setCategory('');
    setLocation('');
    setDateFrom('');
    setDateTo('');
    fetchItems();
  };

  return (
    <main className="page">
      {/* Header */}
      <header className="page-header" style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto var(--space-2xl)' }}>
        <div className="page-header__eyebrow">
          <Sparkles size={14} /> Official Item Registry
        </div>
        <h1 className="page-header__title">Search Lost &amp; Found</h1>
        <p className="page-header__sub">Browse published property found across campus buildings. Recognized an item belonging to you? Click on the item to view details and claim.</p>
      </header>

      {/* Capsule Search Bar */}
      <div style={{ maxWidth: '720px', margin: '0 auto var(--space-2xl)' }}>
        <form onSubmit={handleSearchSubmit} className="search-bar">
          <span style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', color: 'var(--clr-primary)' }}>
            <Search size={22} />
          </span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by serial number, category, description, or location…"
          />
          <button type="submit" className="btn btn--primary" style={{ borderRadius: 'var(--radius-full)', padding: '10px 24px' }}>
            Search Registry
          </button>
        </form>
      </div>

      {/* Filter Container Card */}
      <div className="filters-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)', fontSize: '0.86rem', fontWeight: 700, color: 'var(--clr-primary-dark)' }}>
          <Layers size={16} /> Filter Results
        </div>
        <div className="filters">
          <div className="filter-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Location Found</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Date From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>

          <div className="filter-group">
            <label>Date To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>

          <div className="filter-group" style={{ justifyContent: 'flex-end', alignItems: 'flex-end' }}>
            <button type="button" className="btn btn--secondary btn--sm" onClick={clearFilters}>
              <RefreshCw size={13} /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
        <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.94rem', fontWeight: 600 }}>
          Showing {items.length} published item{items.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Item Cards Grid */}
      {loading ? (
        <div className="loading-overlay"><div className="spinner"></div></div>
      ) : items.length === 0 ? (
        <div className="empty-state" style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', border: '1px solid var(--clr-border)', padding: 'var(--space-3xl)' }}>
          <div className="empty-state__icon">📦</div>
          <p className="empty-state__title">No items found</p>
          <p className="empty-state__text">Try adjusting your search criteria or resetting filters.</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => {
            const title = item.category;
            const icon = getCategoryIcon(item.category);
            return (
              <div
                key={item._id || item.id}
                className="item-card"
                onClick={() => navigate(`/item/${item._id || item.id}`)}
              >
                <div className="item-card__img">
                  {item.image_url ? (
                    <img src={getImageUrl(item.image_url)} alt={title} loading="lazy" />
                  ) : (
                    <span style={{ fontSize: '3.8rem' }}>{icon}</span>
                  )}
                  <div className="item-card__category-tag">
                    {icon} {item.category}
                  </div>
                  {item.serial_number && (
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: 'var(--radius-full)', letterSpacing: '0.05em', display: 'flex', gap: '6px' }}>
                      <span>#{item.serial_number}</span>
                      {item.uid && <span style={{ opacity: 0.85, fontFamily: 'monospace' }}>| {item.uid}</span>}
                    </div>
                  )}
                </div>

                <div className="item-card__body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <p className="item-card__title" style={{ margin: 0 }}>{title}</p>
                  </div>
                  {(user?.role === 'admin' || user?.role === 'superadmin') && item.who_found && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: '8px' }}>
                      Found by: <strong>{item.who_found}</strong>
                    </p>
                  )}
                  <div className="item-card__meta">
                    <span><MapPin size={15} color="var(--clr-primary)" /> {item.location_found}</span>
                    <span><Calendar size={15} color="var(--clr-text-dim)" /> Found {formatDate(item.date_found)}</span>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 'var(--space-sm)', display: 'flex', gap: '8px' }}>
                    <button className="btn btn--primary btn--sm" style={{ flex: 1, justifyContent: 'space-between' }}>
                      <span>View &amp; Claim Item</span>
                      <ArrowRight size={14} />
                    </button>
                    {user?.role === 'superadmin' && (
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        style={{ background: '#FAF5FF', color: '#7E22CE', borderColor: '#E9D5FF', fontWeight: 800, whiteSpace: 'nowrap' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(item);
                        }}
                        title="SuperAdmin Edit Fields"
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUPERADMIN FULL ITEM EDIT MODAL */}
      {editModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '640px', background: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: 'var(--space-2xl)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button
              onClick={() => setEditModalItem(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: 'var(--space-lg)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: '#FAF5FF', color: '#7E22CE', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Edit3 size={26} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>SuperAdmin Website Item Editor</h2>
                <p style={{ fontSize: '0.86rem', color: 'var(--clr-text-muted)' }}>Modify any metadata field, serial numbers, reporters, or photos directly on the website.</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div>
                  <label className="form-label">Serial Number <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={editSerial}
                    onChange={(e) => setEditSerial(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Unique UID <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={editUid}
                    onChange={(e) => setEditUid(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div>
                  <label className="form-label">Category <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Location Found <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={editLocationFound}
                    onChange={(e) => setEditLocationFound(e.target.value)}
                  >
                    {LOCATIONS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div>
                  <label className="form-label">Who Found It</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Campus Staff / Security"
                    value={editWhoFound}
                    onChange={(e) => setEditWhoFound(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Status <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div>
                  <label className="form-label">Reported By Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={editStudentName}
                    onChange={(e) => setEditStudentName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Reported By Reg No <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={editRegNo}
                    onChange={(e) => setEditRegNo(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Item Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Replace Item Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setEditImageFile(file);
                      setEditImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>

              {editImagePreview && (
                <div style={{ border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', padding: '8px', textAlign: 'center', background: '#0F172A' }}>
                  <img src={editImagePreview} alt="Item Preview" style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              )}

              <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-md)' }}>
                <button type="submit" className="btn btn--primary btn--lg" style={{ flex: 1, background: 'linear-gradient(135deg, #4338CA 0%, #7E22CE 100%)', borderColor: '#A855F7' }} disabled={submittingEdit}>
                  <Save size={18} /> {submittingEdit ? 'Saving Updates…' : 'Save Full Website Overrides'}
                </button>
                <button type="button" className="btn btn--secondary btn--lg" onClick={() => setEditModalItem(null)}>
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
