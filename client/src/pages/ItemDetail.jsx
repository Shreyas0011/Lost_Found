import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch, formatDate, getCategoryIcon, getImageUrl } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { MapPin, Building2, Clock, Calendar, ShieldAlert, ArrowLeft, Ban, CheckCircle, Download, X, FileCheck, FileText, Upload, Eye, User, HeartHandshake, Edit3, Save, AlertCircle } from 'lucide-react';

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

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Donate Modal state
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [submittingDonate, setSubmittingDonate] = useState(false);

  // Handover Form Modal state (Admin)
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverFile, setHandoverFile] = useState(null);
  const [handoverFilePreview, setHandoverFilePreview] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [submittingHandover, setSubmittingHandover] = useState(false);

  // SuperAdmin Full Item Edit Modal state
  const [showEditModal, setShowEditModal] = useState(false);
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

  const openEditModal = () => {
    if (!item) return;
    setEditSerial(item.serial_number || '');
    setEditUid(item.uid || '');
    setEditCategory(item.category || 'Electronics');
    setEditWhoFound(item.who_found || '');
    setEditLocationFound(item.location_found || 'Library');
    setEditDateFound(item.date_found ? new Date(item.date_found).toISOString().split('T')[0] : '');
    setEditTimeFound(item.time_found || '');
    setEditDescription(item.description || '');
    setEditStudentName(item.student_name || '');
    setEditRegNo(item.registration_number || '');
    setEditStatus(item.status || 'PUBLISHED');
    setEditNotes(item.handover_notes || '');
    setEditImageFile(null);
    setEditImagePreview(item.image_url ? getImageUrl(item.image_url) : '');
    setShowEditModal(true);
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

      await apiFetch(`/items/admin/${item._id}/edit`, {
        method: 'PUT',
        body: formData,
      });

      alert('Item details updated successfully on website by SuperAdmin!');
      setShowEditModal(false);
      fetchDetail();
    } catch (err) {
      alert(err.message || 'Failed to update item details.');
    } finally {
      setSubmittingEdit(false);
    }
  };

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

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const openHandoverModal = () => {
    setHandoverFile(null);
    setHandoverFilePreview(item?.handover_form_url ? getImageUrl(item.handover_form_url) : '');
    setHandoverNotes(item?.handover_notes || '');
    setHandoverStudentName(item?.handover_student_name || '');
    setHandoverRegNo(item?.handover_reg_number || '');
    setHandoverPhone(item?.handover_phone || '');
    setHandoverDepartment(item?.handover_department || '');
    setShowHandoverModal(true);
  };

  const handleHandoverFormSubmit = async (e) => {
    e.preventDefault();
    if (!handoverStudentName.trim() || !handoverRegNo.trim()) {
      toast.error('Please enter Student Name and Registration/Roll Number.');
      return;
    }
    if (!handoverFile && !item?.handover_form_url) {
      toast.error('Please select a scanned/photographed physical handover form file.');
      return;
    }
    setSubmittingHandover(true);
    try {
      const formData = new FormData();
      if (handoverFile) formData.append('handover_form', handoverFile);
      formData.append('handover_notes', handoverNotes);
      formData.append('handover_student_name', handoverStudentName);
      formData.append('handover_reg_number', handoverRegNo);
      formData.append('handover_phone', handoverPhone);
      formData.append('handover_department', handoverDepartment);

      await apiFetch(`/items/admin/${item._id}/handover-form`, {
        method: 'POST',
        body: formData,
      });

      toast.success('Physical handover form proof & recipient student details saved successfully!');
      setShowHandoverModal(false);
      fetchDetail();
    } catch (err) {
      toast.error(err.message || 'Failed to upload physical handover form.');
    } finally {
      setSubmittingHandover(false);
    }
  };

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

  if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

  if (error || !item) {
    return (
      <main className="page">
        <div className="empty-state">
          <div className="empty-state__icon">🔍</div>
          <p className="empty-state__title">Item Not Found</p>
          <p className="empty-state__text">{error || 'This item may have been removed or claimed.'}</p>
          {user?.role === 'admin' || user?.role === 'superadmin' ? (
            <Link to="/admin/items" className="btn btn--primary">Back to Manage Inventory</Link>
          ) : (
            <Link to="/" className="btn btn--primary">Back to Search</Link>
          )}
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

  const itemDateObj = item ? new Date(item.uploaded_at || item.date_found || Date.now()) : new Date();
  const daysElapsed = item ? Math.floor((Date.now() - itemDateObj.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const daysRemaining = Math.max(0, 30 - daysElapsed);
  const isEligibleForDonate = daysElapsed >= 30 || item?.status === 'UNCLAIMED' || item?.status === 'EXPIRED';

  const handleConfirmDonate = async () => {
    setSubmittingDonate(true);
    try {
      await apiFetch(`/items/admin/${item._id}/status`, {
        method: 'PATCH',
        body: { status: 'DONATED' },
      });
      setShowDonateModal(false);
      navigate('/admin/items?status=DONATED');
    } catch (err) {
      alert(err.message || 'Failed to donate item.');
    } finally {
      setSubmittingDonate(false);
    }
  };

  const isAdminOrSuper = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <main className="page page--medium">
      {isAdminOrSuper ? (
        <Link to="/admin/items" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--clr-primary)', fontWeight: 700, fontSize: '0.92rem', marginBottom: 'var(--space-lg)' }}>
          <ArrowLeft size={16} /> Back to Manage Inventory
        </Link>
      ) : (
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--clr-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 'var(--space-lg)' }}>
          <ArrowLeft size={16} /> Back to Search
        </Link>
      )}

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
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <>
                <div className="item-meta-row">
                  <span className="item-meta-row__key">Who Found</span>
                  <span className="item-meta-row__val">{item.who_found || 'Campus Staff'}</span>
                </div>
                <div className="item-meta-row">
                  <span className="item-meta-row__key">Reported By</span>
                  <span className="item-meta-row__val">{item.student_name} ({item.registration_number})</span>
                </div>
              </>
            )}
            <div className="item-meta-row">
              <span className="item-meta-row__key">Description</span>
              <span className="item-meta-row__val">{item.description || '—'}</span>
            </div>
          </div>

          {/* Action Buttons: CLAIM & FORM UPLOAD, DONATE, DEACTIVATE (admin/superadmin) */}
          <div style={{ marginTop: 'var(--space-xl)', display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <button
                className="btn btn--secondary btn--lg"
                style={{ flex: 1, minWidth: '180px', justifyContent: 'center', background: item.status === 'CLAIMED' ? '#DCFCE7' : '#EEF2FF', color: item.status === 'CLAIMED' ? '#15803D' : '#4338CA', borderColor: item.status === 'CLAIMED' ? '#86EFAC' : '#C7D2FE', fontWeight: 800 }}
                onClick={openHandoverModal}
                title="Claim item, enter student recipient details & upload physical form"
              >
                <FileText size={18} /> {item.status === 'CLAIMED' ? 'View/Update Claim Form Proof' : 'Claim Item & Upload Form'}
              </button>
            )}

            {item.status !== 'DEACTIVATED' && item.status !== 'DONATED' && (user?.role === 'admin' || user?.role === 'superadmin') && (
              <button
                className="btn btn--secondary btn--lg"
                style={{ flex: 1, minWidth: '180px', justifyContent: 'center', background: '#F3E8FF', color: '#7E22CE', borderColor: '#E9D5FF', fontWeight: 800 }}
                onClick={() => setShowDonateModal(true)}
                title="Donate item after 1-month collection period"
              >
                <HeartHandshake size={18} /> Donate Item
              </button>
            )}

            {item.status !== 'DEACTIVATED' && (user?.role === 'admin' || user?.role === 'superadmin') && (
              <button
                className="btn btn--danger-solid btn--lg"
                style={{ flex: 1, minWidth: '180px', justifyContent: 'center' }}
                onClick={handleDeactivate}
              >
                <Ban size={18} color="#FFFFFF" /> Deactivate Item
              </button>
            )}
          </div>
        </div>
      </div>

      {/* UPLOADED PHYSICAL HANDOVER FORM PROOF CARD (ADMIN / SUPERADMIN ONLY) */}
      {item.handover_form_url && (user?.role === 'admin' || user?.role === 'superadmin') && (
        <div className="card" style={{ marginTop: 'var(--space-2xl)', border: '2px solid #818CF8', background: '#F8FAFC', padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: '#EEF2FF', color: '#4F46E5', display: 'grid', placeItems: 'center' }}>
                <FileCheck size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--clr-text)' }}>Uploaded Physical Handover Form &amp; Recipient Details</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>Official paper form filled &amp; signed by student upon item pickup.</p>
              </div>
            </div>
            <span className="badge badge--published">Verified Handover Document</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-lg)', alignItems: 'center', marginTop: 'var(--space-md)' }}>
            <div>
              {item.handover_form_url.toLowerCase().includes('.pdf') || item.handover_form_url.startsWith('data:application/pdf') ? (
                <div style={{ border: '1.5px solid #FCA5A5', background: '#FEF2F2', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: '#FEE2E2', color: '#DC2626', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <FileText size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#991B1B' }}>Physical Handover Form (PDF)</div>
                      <div style={{ fontSize: '0.78rem', color: '#B91C1C' }}>Scanned document proof attached</div>
                    </div>
                  </div>
                  <a href={getImageUrl(item.handover_form_url)} target="_blank" rel="noreferrer" className="btn btn--primary btn--sm" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                    Open PDF Document ↗
                  </a>
                </div>
              ) : (
                <div style={{ border: '1.5px solid var(--clr-border-indigo)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '250px', background: '#0F172A', textAlign: 'center', padding: '10px' }}>
                  <a href={getImageUrl(item.handover_form_url)} target="_blank" rel="noreferrer">
                    <img src={getImageUrl(item.handover_form_url)} alt="Physical Handover Form Proof" style={{ maxHeight: '230px', maxWidth: '100%', objectFit: 'contain' }} />
                  </a>
                </div>
              )}
            </div>

            <div>
              <div style={{ background: '#FFFFFF', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--clr-border-indigo)' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4338CA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Handover Recipient Details</p>
                <p style={{ fontSize: '0.92rem', color: 'var(--clr-text)', marginBottom: '4px' }}>
                  Student Name: <strong>{item.handover_student_name || '—'}</strong>
                </p>
                <p style={{ fontSize: '0.92rem', color: 'var(--clr-text)', marginBottom: '4px' }}>
                  Reg / Roll #: <strong>{item.handover_reg_number || '—'}</strong>
                </p>
                {item.handover_phone && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--clr-text)', marginBottom: '4px' }}>
                    Contact Phone: <strong>{item.handover_phone}</strong>
                  </p>
                )}
                {item.handover_department && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--clr-text)', marginBottom: '4px' }}>
                    Dept / Hostel: <strong>{item.handover_department}</strong>
                  </p>
                )}
                <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-muted)', marginTop: '6px', borderTop: '1px solid var(--clr-border)', paddingTop: '6px' }}>
                  Handover Date: <strong>{formatDate(item.handover_date)}</strong>
                </p>
                {item.handover_notes && (
                  <p style={{ fontSize: '0.86rem', color: 'var(--clr-text-dim)', marginTop: '4px' }}>
                    Remarks: <em>{item.handover_notes}</em>
                  </p>
                )}
              </div>

              <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-md)' }}>
                <a href={getImageUrl(item.handover_form_url)} target="_blank" rel="noreferrer" className="btn btn--primary btn--sm">
                  <Eye size={15} /> Inspect Full Form Document
                </a>
                <button className="btn btn--secondary btn--sm" onClick={openHandoverModal}>
                  <FileText size={15} /> Edit Handover Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collection Instructions Card */}
      <div style={{ marginTop: 'var(--space-2xl)' }}>
        <div className="card" style={{ border: '2px solid var(--clr-border-indigo)', background: '#FFFFFF', padding: 'var(--space-xl)', borderRadius: 'var(--radius-xl)', boxShadow: '0 16px 40px -10px rgba(79, 70, 229, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: 'var(--space-md)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--grad-indigo)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Building2 size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--clr-text)' }}>Item Handover &amp; Physical Form Notice</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-muted)' }}>Instructions for physical verification and counter form pickup.</p>
            </div>
          </div>

          {/* DISPLAY MESSAGE & PHYSICAL PAPER FORM INSTRUCTION */}
          <div style={{ background: '#EFF6FF', border: '2px solid #3B82F6', padding: '18px 22px', borderRadius: 'var(--radius-lg)', marginTop: 'var(--space-md)', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <ShieldAlert size={28} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1E40AF' }}>
                Please bring your ID card as a proof to collect the lost item
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: '#1E3A8A', fontWeight: 600, lineHeight: 1.5 }}>
                📝 <strong>No online form is required to be filled on this website.</strong> When you visit the help desk counter, you will be handed a physical paper form that has to be filled out manually before taking your item.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)' }}>
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

      {/* PHYSICAL HANDOVER FORM UPLOAD MODAL (ADMIN ONLY) */}
      {showHandoverModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '640px', background: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: 'var(--space-2xl)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button
              onClick={() => setShowHandoverModal(false)}
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
                  #{item.serial_number || 'N/A'} — {item.category}
                </p>
                <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
                  Location Found: {item.location_found}
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
                    value={handoverStudentName}
                    onChange={(e) => setHandoverStudentName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Registration / Roll Number <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 21BCE1042 / Roll No"
                    value={handoverRegNo}
                    onChange={(e) => setHandoverRegNo(e.target.value)}
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
                    value={handoverPhone}
                    onChange={(e) => setHandoverPhone(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Department / Hostel / Branch</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. CSE / Hostel Block A"
                    value={handoverDepartment}
                    onChange={(e) => setHandoverDepartment(e.target.value)}
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
                      setHandoverFile(file);
                      setHandoverFilePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>

              {handoverFilePreview && (
                <div>
                  {((handoverFile && (handoverFile.type.includes('pdf') || handoverFile.name.endsWith('.pdf'))) || (typeof handoverFilePreview === 'string' && handoverFilePreview.toLowerCase().includes('.pdf'))) ? (
                    <div style={{ border: '1.5px solid #FCA5A5', background: '#FEF2F2', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: '#FEE2E2', color: '#DC2626', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <FileText size={24} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#991B1B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {handoverFile ? handoverFile.name : 'Physical_Handover_Form.pdf'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#B91C1C', fontWeight: 600 }}>
                          PDF Document Attached · {handoverFile ? `${(handoverFile.size / 1024).toFixed(1)} KB` : 'Attached'}
                        </div>
                      </div>
                      <span className="badge badge--published" style={{ background: '#DCFCE7', color: '#15803D', borderColor: '#86EFAC' }}>
                        PDF Ready
                      </span>
                    </div>
                  ) : (
                    <div style={{ border: '1.5px solid var(--clr-border-indigo)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '220px', background: '#0F172A', textAlign: 'center', padding: '10px' }}>
                      <img src={handoverFilePreview} alt="Handover Form Preview" style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="form-label">Handover Verification Notes / Remarks</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="e.g. Verified student ID card, student signed physical handover form at help desk..."
                />
              </div>

              <div style={{ marginTop: 'var(--space-sm)', display: 'flex', gap: 'var(--space-md)' }}>
                <button type="submit" className="btn btn--primary btn--lg" style={{ flex: 1 }} disabled={submittingHandover}>
                  <Upload size={18} /> {submittingHandover ? 'Saving Details & Form Proof…' : 'Save Proof & Complete Handover'}
                </button>
                <button type="button" className="btn btn--secondary btn--lg" onClick={() => setShowHandoverModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPERADMIN FULL ITEM EDIT MODAL */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '640px', background: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: 'var(--space-2xl)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button
              onClick={() => setShowEditModal(false)}
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
                <button type="button" className="btn btn--secondary btn--lg" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BEAUTIFUL CUSTOM POPUP DIALOGUE BOX FOR DONATE ITEM */}
      {showDonateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'grid', placeItems: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', background: '#FFFFFF', borderRadius: '24px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', position: 'relative', border: '2px solid #E2E8F0' }}>
            <button
              onClick={() => setShowDonateModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#64748B' }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: isEligibleForDonate ? '#F3E8FF' : '#FEF3C7', color: isEligibleForDonate ? '#7E22CE' : '#D97706', display: 'grid', placeItems: 'center', margin: '0 auto 14px', border: `3px solid ${isEligibleForDonate ? '#E9D5FF' : '#FDE68A'}` }}>
                {isEligibleForDonate ? <HeartHandshake size={32} /> : <AlertCircle size={32} />}
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--clr-text)', margin: 0 }}>
                {isEligibleForDonate ? 'Donate Item to Charity' : 'Collection Period Window Active'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginTop: '4px' }}>
                Campus Lost &amp; Found 30-Day Retention Policy
              </p>
            </div>

            {/* PROMINENT DIALOGUE MESSAGE BOX */}
            <div style={{ background: isEligibleForDonate ? '#F3E8FF' : '#FFFBEB', border: `2px solid ${isEligibleForDonate ? '#C084FC' : '#F59E0B'}`, padding: '18px 20px', borderRadius: '16px', marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: isEligibleForDonate ? '#6B21A8' : '#92400E', lineHeight: 1.45 }}>
                {isEligibleForDonate
                  ? 'The 1-month collection window has elapsed. Confirm donating this item to charity?'
                  : `Item cannot be donated yet. The 1-month collection period window has ${daysRemaining} day(s) remaining.`}
              </p>
            </div>

            {/* ITEM RETENTION TIMELINE CARD */}
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                <span>#{item.serial_number || 'LF-10001'} — {item.category}</span>
                <span className={`badge ${isEligibleForDonate ? 'badge--donated' : 'badge--pending'}`}>
                  {isEligibleForDonate ? 'Eligible for Donation' : `${daysRemaining} Days Left`}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 10px 0' }}>
                Found at {item.location_found} on {formatDate(item.date_found)} ({daysElapsed} days in inventory)
              </p>

              {/* Progress Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
                <span>Retention Progress</span>
                <span>{Math.min(100, Math.round((daysElapsed / 30) * 100))}% (30 Days Target)</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (daysElapsed / 30) * 100)}%`, height: '100%', background: isEligibleForDonate ? '#8B5CF6' : '#F59E0B', borderRadius: '999px', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>

            {/* BUTTON ACTIONS */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {isEligibleForDonate ? (
                <>
                  <button
                    className="btn btn--primary btn--lg"
                    style={{ flex: 1, background: 'linear-gradient(135deg, #7E22CE 0%, #6B21A8 100%)', borderColor: '#A855F7', justifyContent: 'center' }}
                    onClick={handleConfirmDonate}
                    disabled={submittingDonate}
                  >
                    <HeartHandshake size={18} /> {submittingDonate ? 'Moving to Donated…' : 'Confirm Donation'}
                  </button>
                  <button className="btn btn--secondary btn--lg" style={{ justifyContent: 'center' }} onClick={() => setShowDonateModal(false)}>
                    Cancel
                  </button>
                </>
              ) : user?.role === 'superadmin' ? (
                <>
                  <button
                    className="btn btn--primary btn--lg"
                    style={{ flex: 1, background: 'linear-gradient(135deg, #4338CA 0%, #7E22CE 100%)', borderColor: '#A855F7', justifyContent: 'center' }}
                    onClick={handleConfirmDonate}
                    disabled={submittingDonate}
                  >
                    <HeartHandshake size={18} /> {submittingDonate ? 'Force Donating…' : '⚡ SuperAdmin Force Donate'}
                  </button>
                  <button className="btn btn--secondary btn--lg" style={{ justifyContent: 'center' }} onClick={() => setShowDonateModal(false)}>
                    OK
                  </button>
                </>
              ) : (
                <button
                  className="btn btn--primary btn--lg"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', justifyContent: 'center' }}
                  onClick={() => setShowDonateModal(false)}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
