import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch, formatDate, getCategoryIcon, getImageUrl } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import StatusBadge from '../components/StatusBadge';
import { Trash2, CheckCircle, RefreshCw, PlusCircle, Filter, ChevronDown, Check, Ban, Sparkles, HeartHandshake, Archive, Tag } from 'lucide-react';

const CATEGORIES = [
  'Electronics', 'Clothing', 'Books', 'ID / Cards',
  'Accessories', 'Bags', 'Keys', 'Stationery', 'Other',
];

const LOCATIONS = [
  'Library', 'Cafeteria', 'Classroom', 'Hostel',
  'Parking', 'Sports Area', 'Administrative Block', 'Other',
];

const STATUSES = [
  'PUBLISHED', 'UNCLAIMED', 'CLAIMED', 'RETURNED', 'EXPIRED', 'DEACTIVATED', 'DONATED'
];

export default function AdminItems() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Multi-select filter states
  const [selectedStatuses, setSelectedStatuses] = useState(() => {
    const s = searchParams.get('status');
    return s ? s.split(',') : [];
  });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedReporters, setSelectedReporters] = useState([]);
  const [selectedSerials, setSelectedSerials] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Dropdown popover toggles ('status', 'category', 'location', 'reporter', 'serial')
  const [openDropdown, setOpenDropdown] = useState(null);

  // Sync url param if navigation passes status=DEACTIVATED or status=DONATED
  useEffect(() => {
    const s = searchParams.get('status');
    if (s) {
      setSelectedStatuses(s.split(','));
    }
  }, [searchParams]);

  const fetchItems = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','));
      if (selectedCategories.length > 0) params.set('category', selectedCategories.join(','));
      if (selectedLocations.length > 0) params.set('location_found', selectedLocations.join(','));
      if (selectedReporters.length > 0) params.set('reported_by', selectedReporters.join(','));
      if (selectedSerials.length > 0) params.set('serial_number', selectedSerials.join(','));
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);

      const data = await apiFetch(`/items/admin/all?${params.toString()}`);
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
  }, [selectedStatuses, selectedCategories, selectedLocations, selectedReporters, selectedSerials, dateFrom, dateTo]);

  const toggleMultiSelect = (item, currentList, setList) => {
    if (currentList.includes(item)) {
      setList(currentList.filter(i => i !== item));
    } else {
      setList([...currentList, item]);
    }
  };

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

  const handleDonateClick = (itemObj) => {
    const itemDt = new Date(itemObj.uploaded_at || itemObj.date_found || Date.now());
    const days = Math.floor((Date.now() - itemDt.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 30 && itemObj.status !== 'UNCLAIMED' && itemObj.status !== 'EXPIRED') {
      alert(`Item cannot be donated yet. The 1-month collection period window has ${30 - days} day(s) remaining.`);
      return;
    }
    if (!window.confirm(`Donate item #${itemObj.serial_number || ''}? 1-Month collection window has elapsed. It will move to Donated Items.`)) return;
    handleStatusChange(itemObj._id, 'DONATED');
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

  const resetAllFilters = () => {
    setSelectedStatuses([]);
    setSelectedCategories([]);
    setSelectedLocations([]);
    setSelectedReporters([]);
    setSelectedSerials([]);
    setDateFrom('');
    setDateTo('');
    setSearchParams({});
  };

  const availableReporters = Array.from(new Set(items.map(i => i.student_name).filter(Boolean)));
  const availableSerials = items.map((i, idx) => ({
    serial: i.serial_number || `LF-${10001 + idx}`,
    uid: i.uid || `UID-${(10001 + idx).toString(16).toUpperCase()}`
  }));

  const isDeactivatedTab = selectedStatuses.length === 1 && selectedStatuses[0] === 'DEACTIVATED';
  const isDonatedTab = selectedStatuses.length === 1 && selectedStatuses[0] === 'DONATED';

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="page-header__eyebrow">
              {isDonatedTab ? '🎁 Donated Items Archive' : isDeactivatedTab ? '🚫 Deactivated Items Archive' : '📦 Inventory Management'}
            </div>
            <h1 className="page-header__title">
              {isDonatedTab ? 'Donated Items' : isDeactivatedTab ? 'Deactivated Items' : 'Manage Inventory'}
            </h1>
          </div>
          <Link to="/admin/add-item" className="btn btn--primary btn--lg">
            <PlusCircle size={18} /> Upload Found Item
          </Link>
        </div>

        {/* ADMIN MULTI-SELECT FILTER BAR */}
        <div className="filters-card" style={{ marginBottom: 'var(--space-xl)', background: '#FFFFFF', padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--clr-primary-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={16} /> Admin Multi-Select Filters
            </span>
            {(selectedStatuses.length > 0 || selectedCategories.length > 0 || selectedLocations.length > 0 || selectedReporters.length > 0 || selectedSerials.length > 0 || dateFrom || dateTo) && (
              <button className="btn btn--secondary btn--sm" onClick={resetAllFilters}>
                <RefreshCw size={13} /> Reset Filters
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', position: 'relative' }}>
            {/* 1. Serial # & UID Filter Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="form-control"
                style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: selectedSerials.length ? '#EEF2FF' : '#F8FAFC', fontWeight: selectedSerials.length ? 700 : 400 }}
                onClick={() => setOpenDropdown(openDropdown === 'serial' ? null : 'serial')}
              >
                <span>Serial / UID ({selectedSerials.length ? selectedSerials.length : 'All'})</span>
                <ChevronDown size={16} />
              </button>
              {openDropdown === 'serial' && (
                <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 100, background: '#FFF', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', padding: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', maxHeight: '220px', overflowY: 'auto' }}>
                  {availableSerials.length === 0 ? (
                    <div style={{ padding: '8px', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>No items loaded</div>
                  ) : (
                    availableSerials.map((itemObj) => (
                      <label key={itemObj.serial} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', fontSize: '0.84rem', cursor: 'pointer', borderRadius: '4px' }}>
                        <input
                          type="checkbox"
                          checked={selectedSerials.includes(itemObj.serial)}
                          onChange={() => toggleMultiSelect(itemObj.serial, selectedSerials, setSelectedSerials)}
                        />
                        <span style={{ fontWeight: 700, color: 'var(--clr-primary)' }}>#{itemObj.serial}</span>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>({itemObj.uid})</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 2. Status Multi-Select */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="form-control"
                style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#F8FAFC' }}
                onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              >
                <span>Status ({selectedStatuses.length ? selectedStatuses.length : 'All'})</span>
                <ChevronDown size={16} />
              </button>
              {openDropdown === 'status' && (
                <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 100, background: '#FFF', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', padding: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', maxHeight: '220px', overflowY: 'auto' }}>
                  {STATUSES.map((st) => (
                    <label key={st} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', fontSize: '0.84rem', cursor: 'pointer', borderRadius: '4px' }}>
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(st)}
                        onChange={() => toggleMultiSelect(st, selectedStatuses, setSelectedStatuses)}
                      />
                      <StatusBadge status={st} />
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Category Multi-Select */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="form-control"
                style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#F8FAFC' }}
                onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
              >
                <span>Category ({selectedCategories.length ? selectedCategories.length : 'All'})</span>
                <ChevronDown size={16} />
              </button>
              {openDropdown === 'category' && (
                <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 100, background: '#FFF', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', padding: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', maxHeight: '220px', overflowY: 'auto' }}>
                  {CATEGORIES.map((cat) => (
                    <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', fontSize: '0.84rem', cursor: 'pointer', borderRadius: '4px' }}>
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleMultiSelect(cat, selectedCategories, setSelectedCategories)}
                      />
                      {getCategoryIcon(cat)} {cat}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Location Multi-Select */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="form-control"
                style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#F8FAFC' }}
                onClick={() => setOpenDropdown(openDropdown === 'location' ? null : 'location')}
              >
                <span>Location ({selectedLocations.length ? selectedLocations.length : 'All'})</span>
                <ChevronDown size={16} />
              </button>
              {openDropdown === 'location' && (
                <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 100, background: '#FFF', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', padding: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', maxHeight: '220px', overflowY: 'auto' }}>
                  {LOCATIONS.map((loc) => (
                    <label key={loc} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', fontSize: '0.84rem', cursor: 'pointer', borderRadius: '4px' }}>
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(loc)}
                        onChange={() => toggleMultiSelect(loc, selectedLocations, setSelectedLocations)}
                      />
                      📍 {loc}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Reported By Multi-Select */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="form-control"
                style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#F8FAFC' }}
                onClick={() => setOpenDropdown(openDropdown === 'reporter' ? null : 'reporter')}
              >
                <span>Reported By ({selectedReporters.length ? selectedReporters.length : 'All'})</span>
                <ChevronDown size={16} />
              </button>
              {openDropdown === 'reporter' && (
                <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 100, background: '#FFF', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', padding: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', maxHeight: '220px', overflowY: 'auto' }}>
                  {availableReporters.length === 0 ? (
                    <div style={{ padding: '8px', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>No reporters loaded</div>
                  ) : (
                    availableReporters.map((rep) => (
                      <label key={rep} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', fontSize: '0.84rem', cursor: 'pointer', borderRadius: '4px' }}>
                        <input
                          type="checkbox"
                          checked={selectedReporters.includes(rep)}
                          onChange={() => toggleMultiSelect(rep, selectedReporters, setSelectedReporters)}
                        />
                        👤 {rep}
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
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
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state" style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: 'var(--space-3xl)', border: '1.5px solid var(--clr-border)' }}>
            <div className="empty-state__icon">📦</div>
            <p className="empty-state__title">No items found</p>
            <p className="empty-state__text">No items match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Photo</th>
                  <th style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setOpenDropdown(openDropdown === 'serial' ? null : 'serial')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Serial # &amp; UID &amp; Category</span>
                      <ChevronDown size={14} />
                    </div>

                    {openDropdown === 'serial' && (
                      <div
                        style={{ position: 'absolute', top: '100%', left: 0, minWidth: '220px', zIndex: 100, background: '#FFF', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', padding: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', textTransform: 'none', fontWeight: 'normal' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--clr-primary)', marginBottom: '6px' }}>Filter by Serial # / UID:</div>
                        {availableSerials.map((itemObj) => (
                          <label key={itemObj.serial} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', fontSize: '0.82rem', cursor: 'pointer', borderRadius: '4px' }}>
                            <input
                              type="checkbox"
                              checked={selectedSerials.includes(itemObj.serial)}
                              onChange={() => toggleMultiSelect(itemObj.serial, selectedSerials, setSelectedSerials)}
                            />
                            <span style={{ fontWeight: 700, color: 'var(--clr-primary)' }}>#{itemObj.serial}</span>
                            <span style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'monospace' }}>({itemObj.uid})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </th>
                  <th>Who Found</th>
                  <th>Location</th>
                  <th>Reported By</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const title = item.category;
                  const icon = getCategoryIcon(item.category);
                  const serialNum = item.serial_number || `LF-${10001 + idx}`;
                  const uidNum = item.uid || `UID-${(10001 + idx).toString(16).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;

                  return (
                    <tr key={item._id || idx}>
                      <td>
                        {item.image_url ? (
                          <img src={getImageUrl(item.image_url)} alt={title} className="table-img" />
                        ) : (
                          <span style={{ fontSize: '1.8rem' }}>{icon}</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <Link to={`/item/${item._id}`} style={{ fontWeight: 800, color: 'var(--clr-primary)', fontSize: '0.9rem' }}>
                            #{serialNum}
                          </Link>
                          <span style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace', fontWeight: 700 }}>
                            UID: {uidNum}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--clr-text)' }}>{title}</span>
                        </div>
                      </td>
                      <td>
                        <strong>{item.who_found || 'Campus Staff'}</strong>
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
                          <Link to={`/item/${item._id}`} className="btn btn--primary btn--sm">
                            View &amp; Claim
                          </Link>

                          {item.status === 'PUBLISHED' && (
                            <button
                              className="btn btn--secondary btn--sm"
                              onClick={() => handleStatusChange(item._id, 'UNCLAIMED')}
                              title="Mark item as unclaimed"
                            >
                              <Archive size={14} /> Unclaim
                            </button>
                          )}

                          {item.status !== 'DONATED' && item.status !== 'DEACTIVATED' && (
                            <button
                              className="btn btn--secondary btn--sm"
                              style={
                                (Math.floor((Date.now() - new Date(item.uploaded_at || item.date_found || Date.now()).getTime()) / (1000 * 60 * 60 * 24)) >= 30 || item.status === 'UNCLAIMED' || item.status === 'EXPIRED')
                                  ? { background: '#F3E8FF', color: '#7E22CE', borderColor: '#E9D5FF', fontWeight: 800 }
                                  : { opacity: 0.75, background: '#F1F5F9', color: '#475569', borderColor: '#CBD5E1' }
                              }
                              onClick={() => handleDonateClick(item)}
                              title={
                                (Math.floor((Date.now() - new Date(item.uploaded_at || item.date_found || Date.now()).getTime()) / (1000 * 60 * 60 * 24)) >= 30 || item.status === 'UNCLAIMED' || item.status === 'EXPIRED')
                                  ? "1-Month collection window elapsed — Click to Donate"
                                  : `1-Month collection window active (${30 - Math.floor((Date.now() - new Date(item.uploaded_at || item.date_found || Date.now()).getTime()) / (1000 * 60 * 60 * 24))} days remaining)`
                              }
                            >
                              <HeartHandshake size={14} /> Donate
                            </button>
                          )}

                          {item.status !== 'DEACTIVATED' ? (
                            <button
                              className="btn btn--danger btn--sm"
                              onClick={() => handleStatusChange(item._id, 'DEACTIVATED')}
                              title="Deactivate item"
                            >
                              <Ban size={14} /> Deactivate
                            </button>
                          ) : (
                            <button
                              className="btn btn--success btn--sm"
                              onClick={() => handleStatusChange(item._id, 'PUBLISHED')}
                              title="Reactivate item"
                            >
                              <CheckCircle size={14} /> Reactivate
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
