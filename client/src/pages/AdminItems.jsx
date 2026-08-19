import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch, formatDate, getCategoryIcon, getImageUrl } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import StatusBadge from '../components/StatusBadge';
import { Trash2, CheckCircle, RefreshCw, PlusCircle, Filter, ChevronDown, Check, Ban, Sparkles, HeartHandshake, Archive, Tag, FileText, FileCheck, Upload, X, Eye, Edit3, Save, AlertCircle } from 'lucide-react';

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
  const { user } = useAuth();
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

  // Custom Donate Modal state
  const [donateModalItem, setDonateModalItem] = useState(null);

  // Custom Delete Modal state
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Physical Form Modal state
  const [uploadFormModalItem, setUploadFormModalItem] = useState(null);
  const [formFile, setFormFile] = useState(null);
  const [formFilePreview, setFormFilePreview] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStudentName, setFormStudentName] = useState('');
  const [formRegNo, setFormRegNo] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [submittingForm, setSubmittingForm] = useState(false);

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

  const openFormUploadModal = (itemObj) => {
    setUploadFormModalItem(itemObj);
    setFormFile(null);
    setFormFilePreview(itemObj.handover_form_url ? getImageUrl(itemObj.handover_form_url) : '');
    setFormNotes(itemObj.handover_notes || '');
    setFormStudentName(itemObj.handover_student_name || '');
    setFormRegNo(itemObj.handover_reg_number || '');
    setFormPhone(itemObj.handover_phone || '');
    setFormDepartment(itemObj.handover_department || '');
  };

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

      alert('Item details updated successfully on backend by SuperAdmin!');
      setEditModalItem(null);
      fetchItems();
    } catch (err) {
      alert(err.message || 'Failed to update item details.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleHandoverFormSubmit = async (e) => {
    e.preventDefault();
    if (!formStudentName.trim() || !formRegNo.trim()) {
      alert('Please enter Student Name and Registration/Roll Number.');
      return;
    }
    if (!formFile && !uploadFormModalItem.handover_form_url) {
      alert('Please select a scanned/photographed physical handover form file.');
      return;
    }
    setSubmittingForm(true);
    try {
      const formData = new FormData();
      if (formFile) formData.append('handover_form', formFile);
      formData.append('handover_notes', formNotes);
      formData.append('handover_student_name', formStudentName);
      formData.append('handover_reg_number', formRegNo);
      formData.append('handover_phone', formPhone);
      formData.append('handover_department', formDepartment);

      await apiFetch(`/items/admin/${uploadFormModalItem._id || uploadFormModalItem.id}/handover-form`, {
        method: 'POST',
        body: formData,
      });

      alert('Physical handover form proof & recipient student details saved successfully!');
      setUploadFormModalItem(null);
      fetchItems();
    } catch (err) {
      alert(err.message || 'Failed to upload physical handover form.');
    } finally {
      setSubmittingForm(false);
    }
  };

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

  const handleDelete = (itemObj) => {
    setDeleteModalItem(itemObj);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalItem) return;
    setSubmittingDelete(true);
    try {
      const id = deleteModalItem._id || deleteModalItem.id;
      await apiFetch(`/items/admin/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => (i._id || i.id) !== id));
      setDeleteModalItem(null);
    } catch (err) {
      alert(err.message || 'Failed to delete item.');
    } finally {
      setSubmittingDelete(false);
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

        {/* CLICK-OUTSIDE BACKDROP OVERLAY FOR DROPDOWNS */}
        {openDropdown && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 990, cursor: 'default' }}
            onClick={() => setOpenDropdown(null)}
          />
        )}

        {/* ADMIN MULTI-SELECT FILTER BAR */}
        <div className="filters-card" style={{ position: 'relative', zIndex: 100, marginBottom: 'var(--space-xl)', background: '#FFFFFF', padding: 'var(--space-lg)' }}>
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
            <div style={{ position: 'relative', zIndex: openDropdown === 'serial' ? 1000 : 1 }}>
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
                <div style={{ position: 'absolute', top: '105%', left: 0, minWidth: '100%', width: 'max-content', maxWidth: '280px', zIndex: 1001, background: '#FFF', border: '1.5px solid var(--clr-border-indigo)', borderRadius: 'var(--radius-md)', padding: '8px', boxShadow: '0 14px 35px -5px rgba(15, 23, 42, 0.25)', maxHeight: '240px', overflowY: 'auto' }}>
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
            <div style={{ position: 'relative', zIndex: openDropdown === 'status' ? 1000 : 1 }}>
              <button
                type="button"
                className="form-control"
                style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: selectedStatuses.length ? '#EEF2FF' : '#F8FAFC', fontWeight: selectedStatuses.length ? 700 : 400 }}
                onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              >
                <span>Status ({selectedStatuses.length ? selectedStatuses.length : 'All'})</span>
                <ChevronDown size={16} />
              </button>
              {openDropdown === 'status' && (
                <div style={{ position: 'absolute', top: '105%', left: 0, minWidth: '100%', width: 'max-content', maxWidth: '240px', zIndex: 1001, background: '#FFF', border: '1.5px solid var(--clr-border-indigo)', borderRadius: 'var(--radius-md)', padding: '8px', boxShadow: '0 14px 35px -5px rgba(15, 23, 42, 0.25)', maxHeight: '240px', overflowY: 'auto' }}>
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
            <div style={{ position: 'relative', zIndex: openDropdown === 'category' ? 1000 : 1 }}>
              <button
                type="button"
                className="form-control"
                style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: selectedCategories.length ? '#EEF2FF' : '#F8FAFC', fontWeight: selectedCategories.length ? 700 : 400 }}
                onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
              >
                <span>Category ({selectedCategories.length ? selectedCategories.length : 'All'})</span>
                <ChevronDown size={16} />
              </button>
              {openDropdown === 'category' && (
                <div style={{ position: 'absolute', top: '105%', left: 0, minWidth: '100%', width: 'max-content', maxWidth: '240px', zIndex: 1001, background: '#FFF', border: '1.5px solid var(--clr-border-indigo)', borderRadius: 'var(--radius-md)', padding: '8px', boxShadow: '0 14px 35px -5px rgba(15, 23, 42, 0.25)', maxHeight: '240px', overflowY: 'auto' }}>
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
            <div style={{ position: 'relative', zIndex: openDropdown === 'location' ? 1000 : 1 }}>
              <button
                type="button"
                className="form-control"
                style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: selectedLocations.length ? '#EEF2FF' : '#F8FAFC', fontWeight: selectedLocations.length ? 700 : 400 }}
                onClick={() => setOpenDropdown(openDropdown === 'location' ? null : 'location')}
              >
                <span>Location ({selectedLocations.length ? selectedLocations.length : 'All'})</span>
                <ChevronDown size={16} />
              </button>
              {openDropdown === 'location' && (
                <div style={{ position: 'absolute', top: '105%', left: 0, minWidth: '100%', width: 'max-content', maxWidth: '240px', zIndex: 1001, background: '#FFF', border: '1.5px solid var(--clr-border-indigo)', borderRadius: 'var(--radius-md)', padding: '8px', boxShadow: '0 14px 35px -5px rgba(15, 23, 42, 0.25)', maxHeight: '240px', overflowY: 'auto' }}>
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
            <div style={{ position: 'relative', zIndex: openDropdown === 'reporter' ? 1000 : 1 }}>
              <button
                type="button"
                className="form-control"
                style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: selectedReporters.length ? '#EEF2FF' : '#F8FAFC', fontWeight: selectedReporters.length ? 700 : 400 }}
                onClick={() => setOpenDropdown(openDropdown === 'reporter' ? null : 'reporter')}
              >
                <span>Reported By ({selectedReporters.length ? selectedReporters.length : 'All'})</span>
                <ChevronDown size={16} />
              </button>
              {openDropdown === 'reporter' && (
                <div style={{ position: 'absolute', top: '105%', left: 0, minWidth: '100%', width: 'max-content', maxWidth: '260px', zIndex: 1001, background: '#FFF', border: '1.5px solid var(--clr-border-indigo)', borderRadius: 'var(--radius-md)', padding: '8px', boxShadow: '0 14px 35px -5px rgba(15, 23, 42, 0.25)', maxHeight: '240px', overflowY: 'auto' }}>
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
                  <th>Serial # &amp; UID &amp; Category</th>
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
                            View
                          </Link>

                          {/* SUPERADMIN FULL ITEM EDIT BUTTON */}
                          <button
                            className="btn btn--secondary btn--sm"
                            style={{ background: '#FAF5FF', color: '#7E22CE', borderColor: '#E9D5FF', fontWeight: 800 }}
                            onClick={() => openEditModal(item)}
                            title="Edit all metadata fields of this item"
                          >
                            <Edit3 size={14} /> Edit
                          </button>

                          {/* UPLOAD PHYSICAL HANDOVER FORM BUTTON */}
                          <button
                            className="btn btn--secondary btn--sm"
                            style={
                              item.handover_form_url
                                ? { background: '#DCFCE7', color: '#15803D', borderColor: '#86EFAC', fontWeight: 800 }
                                : { background: '#EEF2FF', color: '#4338CA', borderColor: '#C7D2FE', fontWeight: 800 }
                            }
                            onClick={() => openFormUploadModal(item)}
                            title="Upload physical handover form filled by student"
                          >
                            {item.handover_form_url ? <FileCheck size={14} /> : <FileText size={14} />}
                            {item.handover_form_url ? 'Form Proof' : 'Upload Form'}
                          </button>

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
                            onClick={() => handleDelete(item)}
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

      {/* PHYSICAL HANDOVER FORM UPLOAD MODAL */}
      {uploadFormModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '580px', background: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: 'var(--space-2xl)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button
              onClick={() => setUploadFormModalItem(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: 'var(--space-lg)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: '#EEF2FF', color: '#4F46E5', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <FileText size={26} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Upload Physical Handover Form &amp; Student Details</h2>
                <p style={{ fontSize: '0.86rem', color: 'var(--clr-text-muted)' }}>Record recipient student information and upload scanned copy of physical paper form.</p>
              </div>
            </div>

            <form onSubmit={handleHandoverFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ background: '#F8FAFC', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--clr-text-muted)', marginBottom: '4px' }}>Item Reference</p>
                <p style={{ fontSize: '0.96rem', fontWeight: 800 }}>
                  #{uploadFormModalItem.serial_number || 'N/A'} — {uploadFormModalItem.category}
                </p>
                <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
                  Location Found: {uploadFormModalItem.location_found}
                </p>
              </div>

              {/* RECIPIENT STUDENT DETAILS (FILLED BY ADMIN) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div>
                  <label className="form-label">Student Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Full name of student recipient"
                    value={formStudentName}
                    onChange={(e) => setFormStudentName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Registration / Roll Number <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 21BCE1042 / Roll No"
                    value={formRegNo}
                    onChange={(e) => setFormRegNo(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div>
                  <label className="form-label">Contact / Phone Number <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. +91 9876543210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Department / Hostel / Branch</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. CSE / Hostel Block A"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Select Scanned/Photographed Physical Form <span className="required">*</span></label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="form-control"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormFile(file);
                      setFormFilePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>

              {formFilePreview && (
                <div style={{ border: '1.5px solid var(--clr-border-indigo)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '220px', background: '#0F172A', textAlign: 'center', padding: '10px' }}>
                  <img src={formFilePreview} alt="Handover Form Preview" style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              )}

              <div>
                <label className="form-label">Handover Verification Notes / Remarks</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Verified student ID card, student signed physical handover form at help desk..."
                />
              </div>

              <div style={{ marginTop: 'var(--space-sm)', display: 'flex', gap: 'var(--space-md)' }}>
                <button type="submit" className="btn btn--primary btn--lg" style={{ flex: 1 }} disabled={submittingForm}>
                  <Upload size={18} /> {submittingForm ? 'Saving Details & Form Proof…' : 'Save Proof & Complete Handover'}
                </button>
                <button type="button" className="btn btn--secondary btn--lg" onClick={() => setUploadFormModalItem(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
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
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>SuperAdmin Full Item Editor</h2>
                <p style={{ fontSize: '0.86rem', color: 'var(--clr-text-muted)' }}>Modify any metadata field, serial numbers, reporters, or photos for this item.</p>
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
                  <Save size={18} /> {submittingEdit ? 'Saving Updates…' : 'Save Full Item Overrides'}
                </button>
                <button type="button" className="btn btn--secondary btn--lg" onClick={() => setEditModalItem(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BEAUTIFUL CUSTOM POPUP DIALOGUE BOX FOR DONATE ITEM */}
      {donateModalItem && (() => {
        const itemDt = new Date(donateModalItem.uploaded_at || donateModalItem.date_found || Date.now());
        const days = Math.floor((Date.now() - itemDt.getTime()) / (1000 * 60 * 60 * 24));
        const remDays = Math.max(0, 30 - days);
        const isEligible = days >= 30 || donateModalItem.status === 'UNCLAIMED' || donateModalItem.status === 'EXPIRED';

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'grid', placeItems: 'center', padding: '20px' }}>
            <div className="card" style={{ width: '100%', maxWidth: '540px', background: '#FFFFFF', borderRadius: '24px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', position: 'relative', border: '2px solid #E2E8F0' }}>
              <button
                onClick={() => setDonateModalItem(null)}
                style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#64748B' }}
              >
                <X size={18} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: isEligible ? '#F3E8FF' : '#FEF3C7', color: isEligible ? '#7E22CE' : '#D97706', display: 'grid', placeItems: 'center', margin: '0 auto 14px', border: `3px solid ${isEligible ? '#E9D5FF' : '#FDE68A'}` }}>
                  {isEligible ? <HeartHandshake size={32} /> : <AlertCircle size={32} />}
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--clr-text)', margin: 0 }}>
                  {isEligible ? 'Donate Item to Charity' : 'Collection Period Window Active'}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginTop: '4px' }}>
                  Campus Lost &amp; Found 30-Day Retention Policy
                </p>
              </div>

              {/* PROMINENT DIALOGUE MESSAGE BOX */}
              <div style={{ background: isEligible ? '#F3E8FF' : '#FFFBEB', border: `2px solid ${isEligible ? '#C084FC' : '#F59E0B'}`, padding: '18px 20px', borderRadius: '16px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: isEligible ? '#6B21A8' : '#92400E', lineHeight: 1.45 }}>
                  {isEligible
                    ? 'The 1-month collection window has elapsed. Confirm donating this item to charity?'
                    : `Item cannot be donated yet. The 1-month collection period window has ${remDays} day(s) remaining.`}
                </p>
              </div>

              {/* ITEM RETENTION TIMELINE CARD */}
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                  <span>#{donateModalItem.serial_number || 'N/A'} — {donateModalItem.category}</span>
                  <span className={`badge ${isEligible ? 'badge--donated' : 'badge--pending'}`}>
                    {isEligible ? 'Eligible for Donation' : `${remDays} Days Left`}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 10px 0' }}>
                  Found at {donateModalItem.location_found} on {formatDate(donateModalItem.date_found)} ({days} days in inventory)
                </p>

                {/* Progress Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
                  <span>Retention Progress</span>
                  <span>{Math.min(100, Math.round((days / 30) * 100))}% (30 Days Target)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (days / 30) * 100)}%`, height: '100%', background: isEligible ? '#8B5CF6' : '#F59E0B', borderRadius: '999px', transition: 'width 0.5s ease' }}></div>
                </div>
              </div>

              {/* BUTTON ACTIONS */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {isEligible ? (
                  <>
                    <button
                      className="btn btn--primary btn--lg"
                      style={{ flex: 1, background: 'linear-gradient(135deg, #7E22CE 0%, #6B21A8 100%)', borderColor: '#A855F7', justifyContent: 'center' }}
                      onClick={() => {
                        handleStatusChange(donateModalItem._id || donateModalItem.id, 'DONATED');
                        setDonateModalItem(null);
                      }}
                    >
                      <HeartHandshake size={18} /> Confirm Donation
                    </button>
                    <button className="btn btn--secondary btn--lg" style={{ justifyContent: 'center' }} onClick={() => setDonateModalItem(null)}>
                      Cancel
                    </button>
                  </>
                ) : user?.role === 'superadmin' ? (
                  <>
                    <button
                      className="btn btn--primary btn--lg"
                      style={{ flex: 1, background: 'linear-gradient(135deg, #4338CA 0%, #7E22CE 100%)', borderColor: '#A855F7', justifyContent: 'center' }}
                      onClick={() => {
                        handleStatusChange(donateModalItem._id || donateModalItem.id, 'DONATED');
                        setDonateModalItem(null);
                      }}
                    >
                      <HeartHandshake size={18} /> ⚡ SuperAdmin Force Donate
                    </button>
                    <button className="btn btn--secondary btn--lg" style={{ justifyContent: 'center' }} onClick={() => setDonateModalItem(null)}>
                      OK
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn--primary btn--lg"
                    style={{ flex: 1, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', justifyContent: 'center' }}
                    onClick={() => setDonateModalItem(null)}
                  >
                    OK
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* BEAUTIFUL CUSTOM DELETE ITEM POPUP DIALOGUE BOX */}
      {deleteModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'grid', placeItems: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', background: '#FFFFFF', borderRadius: '24px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(225,29,72,0.25)', position: 'relative', border: '2px solid #FECDD3' }}>
            <button
              onClick={() => setDeleteModalItem(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#64748B' }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FFE4E6', color: '#E11D48', display: 'grid', placeItems: 'center', margin: '0 auto 14px', border: '3px solid #FECDD3' }}>
                <Trash2 size={32} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#9F1239', margin: 0 }}>
                Delete Item Permanently?
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginTop: '4px' }}>
                This action is irreversible and will purge the item record.
              </p>
            </div>

            {/* PROMINENT DIALOGUE WARNING BOX */}
            <div style={{ background: '#FFF1F2', border: '2px solid #FDA4AF', padding: '18px 20px', borderRadius: '16px', marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#9F1239', lineHeight: 1.45 }}>
                Are you sure you want to permanently delete #{deleteModalItem.serial_number || 'N/A'}?
              </p>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: '#BE123C' }}>
                This will delete the item photo, metadata, and history permanently from the system.
              </p>
            </div>

            {/* ITEM SUMMARY CARD */}
            <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
              <p style={{ fontSize: '0.92rem', fontWeight: 800, color: '#334155', margin: 0 }}>
                #{deleteModalItem.serial_number || 'N/A'} — {deleteModalItem.category}
              </p>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0 0' }}>
                Location Found: {deleteModalItem.location_found} · Reported By: {deleteModalItem.student_name || 'Campus Staff'}
              </p>
            </div>

            {/* BUTTON ACTIONS */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn--lg"
                style={{ flex: 1, background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)', color: '#FFFFFF', border: 'none', fontWeight: 800, justifyContent: 'center' }}
                onClick={handleConfirmDelete}
                disabled={submittingDelete}
              >
                <Trash2 size={18} /> {submittingDelete ? 'Deleting…' : 'Yes, Delete Permanently'}
              </button>
              <button
                className="btn btn--secondary btn--lg"
                style={{ justifyContent: 'center' }}
                onClick={() => setDeleteModalItem(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
