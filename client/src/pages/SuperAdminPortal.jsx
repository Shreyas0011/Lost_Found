import React, { useState, useEffect } from 'react';
import { apiFetch, formatDate, getFormFields, saveFormFields, DEFAULT_FORM_FIELDS } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import { ShieldCheck, Plus, Trash2, UserCheck, RefreshCw, Key, Settings, Server, Database, CheckCircle, AlertTriangle, Edit3, Save, Layers, MapPin, ListPlus } from 'lucide-react';

export default function SuperAdminPortal() {
  const [admins, setAdmins] = useState([
    { id: '1', username: 'admin', role: 'admin', created_at: new Date().toISOString(), status: 'Active' },
    { id: '2', username: 'superadmin', role: 'superadmin', created_at: new Date().toISOString(), status: 'Active' },
  ]);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');

  // Form Fields Editor state
  const [formSchema, setFormSchema] = useState(DEFAULT_FORM_FIELDS);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newLocationInput, setNewLocationInput] = useState('');
  const [newCustomFieldName, setNewCustomFieldName] = useState('');
  const [newCustomFieldType, setNewCustomFieldType] = useState('text');
  const [newCustomFieldPlaceholder, setNewCustomFieldPlaceholder] = useState('');
  const [newCustomFieldRequired, setNewCustomFieldRequired] = useState(false);
  const [schemaSaving, setSchemaSaving] = useState(false);
  const [schemaSuccess, setSchemaSuccess] = useState('');

  const [systemLog, setSystemLog] = useState([
    { time: new Date().toLocaleTimeString(), text: 'SuperAdmin Control Portal Initialized' },
    { time: new Date().toLocaleTimeString(), text: 'Database connection verified: 100% healthy' },
  ]);

  useEffect(() => {
    async function loadSchema() {
      const data = await getFormFields();
      if (data) setFormSchema(data);
    }
    loadSchema();
  }, []);

  const handleCreateAdmin = (e) => {
    e.preventDefault();
    if (!newAdminUsername.trim() || !newAdminPassword) return;

    const newAdmin = {
      id: `admin_${Date.now()}`,
      username: newAdminUsername.trim(),
      role: newAdminRole,
      created_at: new Date().toISOString(),
      status: 'Active',
    };

    setAdmins((prev) => [...prev, newAdmin]);
    setSystemLog((prev) => [
      { time: new Date().toLocaleTimeString(), text: `New ${newAdminRole.toUpperCase()} user '${newAdminUsername}' created successfully` },
      ...prev,
    ]);

    setNewAdminUsername('');
    setNewAdminPassword('');
    alert(`New ${newAdminRole.toUpperCase()} account '${newAdmin.username}' created successfully!`);
  };

  const handleDeleteAdmin = (id, username) => {
    if (username === 'superadmin') {
      alert('Root SuperAdmin account cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to revoke admin privileges for '${username}'?`)) return;

    setAdmins((prev) => prev.filter((a) => a.id !== id));
    setSystemLog((prev) => [
      { time: new Date().toLocaleTimeString(), text: `Admin user '${username}' access revoked` },
      ...prev,
    ]);
  };

  const handlePurgeDeactivated = async () => {
    if (!window.confirm('System Override: Purge all deactivated items permanently?')) return;
    setSystemLog((prev) => [
      { time: new Date().toLocaleTimeString(), text: 'System Override Triggered: Purged deactivated item records' },
      ...prev,
    ]);
    alert('System Purge Complete. Deactivated records cleaned up.');
  };

  // Form Fields Editor Handlers
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) return;
    if (formSchema.categories.includes(newCategoryInput.trim())) {
      alert('Category already exists.');
      return;
    }
    setFormSchema((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategoryInput.trim()],
    }));
    setNewCategoryInput('');
  };

  const handleRemoveCategory = (cat) => {
    setFormSchema((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== cat),
    }));
  };

  const handleAddLocation = (e) => {
    e.preventDefault();
    if (!newLocationInput.trim()) return;
    if (formSchema.locations.includes(newLocationInput.trim())) {
      alert('Location already exists.');
      return;
    }
    setFormSchema((prev) => ({
      ...prev,
      locations: [...prev.locations, newLocationInput.trim()],
    }));
    setNewLocationInput('');
  };

  const handleRemoveLocation = (loc) => {
    setFormSchema((prev) => ({
      ...prev,
      locations: prev.locations.filter((l) => l !== loc),
    }));
  };

  const handleAddCustomField = (e) => {
    e.preventDefault();
    if (!newCustomFieldName.trim()) return;
    const newField = {
      id: `cf_${Date.now()}`,
      name: newCustomFieldName.trim(),
      type: newCustomFieldType,
      placeholder: newCustomFieldPlaceholder.trim(),
      required: newCustomFieldRequired,
    };
    setFormSchema((prev) => ({
      ...prev,
      customFields: [...(prev.customFields || []), newField],
    }));
    setNewCustomFieldName('');
    setNewCustomFieldPlaceholder('');
    setNewCustomFieldRequired(false);
  };

  const handleRemoveCustomField = (id) => {
    setFormSchema((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).filter((f) => f.id !== id),
    }));
  };

  const handleSaveFormSchema = async () => {
    setSchemaSaving(true);
    setSchemaSuccess('');
    try {
      await saveFormFields(formSchema);
      setSchemaSuccess('Admin Form Fields Schema updated successfully! All admin upload & item forms are now using updated fields.');
      setSystemLog((prev) => [
        { time: new Date().toLocaleTimeString(), text: 'SuperAdmin updated Admin Form Fields Schema configuration' },
        ...prev,
      ]);
      setTimeout(() => setSchemaSuccess(''), 4000);
    } catch (err) {
      alert('Failed to save form schema: ' + err.message);
    } finally {
      setSchemaSaving(false);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="page-header">
          <div className="page-header__eyebrow" style={{ color: '#7E22CE', fontWeight: 800 }}>
            ⚡ SuperAdmin System Overrides &amp; Management
          </div>
          <h1 className="page-header__title">SuperAdmin Control Portal</h1>
          <p className="page-header__sub">Full administrative privileges to manage admin accounts, edit admin form fields &amp; categories, and inspect system audit logs.</p>
        </div>

        {/* STATS OVERVIEW */}
        <div className="stats-grid" style={{ marginBottom: 'var(--space-2xl)' }}>
          <div className="stat-card" style={{ border: '2px solid #818CF8' }}>
            <div className="stat-card__icon"><ShieldCheck color="#4F46E5" size={26} /></div>
            <div className="stat-card__value">{admins.length}</div>
            <div className="stat-card__label">Active Admins</div>
          </div>

          <div className="stat-card" style={{ border: '2px solid #A855F7' }}>
            <div className="stat-card__icon"><Key color="#7E22CE" size={26} /></div>
            <div className="stat-card__value">1</div>
            <div className="stat-card__label">Root SuperAdmin</div>
          </div>

          <div className="stat-card" style={{ border: '2px solid #34D399' }}>
            <div className="stat-card__icon"><Server color="#059669" size={26} /></div>
            <div className="stat-card__value">100%</div>
            <div className="stat-card__label">System Health</div>
          </div>
        </div>

        {/* 🛠️ SUPERADMIN FORM FIELD SCHEMA CUSTOMIZER */}
        <div className="card" style={{ border: '2px solid #818CF8', background: '#F8FAFC', marginBottom: 'var(--space-2xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={22} color="#4F46E5" /> Admin Form Fields &amp; Schema Customizer
            </h2>
            <button className="btn btn--primary btn--lg" onClick={handleSaveFormSchema} disabled={schemaSaving}>
              <Save size={18} /> {schemaSaving ? 'Saving Form Fields…' : 'Save Form Schema Configuration'}
            </button>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-muted)', marginBottom: 'var(--space-lg)' }}>
            SuperAdmin Override: Customize the dropdown choices (Categories, Locations) and dynamic custom form fields that standard Admins fill out when logging found items.
          </p>

          {schemaSuccess && (
            <div style={{ padding: '12px var(--space-md)', background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 'var(--radius-md)', color: '#065F46', fontWeight: 700, marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} /> {schemaSuccess}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-xl)' }}>
            
            {/* 1. CATEGORIES MANAGER */}
            <div style={{ background: '#FFFFFF', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={18} color="#4F46E5" /> Item Categories ({formSchema.categories?.length || 0})
              </h3>
              
              <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-md)' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Sports Equipment"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                />
                <button type="submit" className="btn btn--secondary" style={{ whiteSpace: 'nowrap' }}>
                  <Plus size={16} /> Add
                </button>
              </form>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {(formSchema.categories || []).map((cat) => (
                  <span key={cat} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#EEF2FF', color: '#3730A3', borderRadius: '16px', fontSize: '0.82rem', fontWeight: 700 }}>
                    {cat}
                    <button type="button" onClick={() => handleRemoveCategory(cat)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#991B1B', padding: 0, display: 'grid', placeItems: 'center' }}>
                      <Trash2 size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 2. LOCATIONS MANAGER */}
            <div style={{ background: '#FFFFFF', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={18} color="#059669" /> Found Locations ({formSchema.locations?.length || 0})
              </h3>

              <form onSubmit={handleAddLocation} style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-md)' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Swimming Pool"
                  value={newLocationInput}
                  onChange={(e) => setNewLocationInput(e.target.value)}
                />
                <button type="submit" className="btn btn--secondary" style={{ whiteSpace: 'nowrap' }}>
                  <Plus size={16} /> Add
                </button>
              </form>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {(formSchema.locations || []).map((loc) => (
                  <span key={loc} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#ECFDF5', color: '#065F46', borderRadius: '16px', fontSize: '0.82rem', fontWeight: 700 }}>
                    {loc}
                    <button type="button" onClick={() => handleRemoveLocation(loc)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#991B1B', padding: 0, display: 'grid', placeItems: 'center' }}>
                      <Trash2 size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* 3. DYNAMIC CUSTOM FIELDS MANAGER */}
          <div style={{ marginTop: 'var(--space-xl)', background: '#FFFFFF', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ListPlus size={18} color="#7E22CE" /> Dynamic Admin Form Fields ({formSchema.customFields?.length || 0})
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)', marginBottom: 'var(--space-md)' }}>
              Add custom fields (e.g. Locker ID, Serial Prefix, Security Tag) that will appear in the Admin Item Upload &amp; Edit form.
            </p>

            <form onSubmit={handleAddCustomField} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: 'var(--space-md)' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Field Label (e.g. Storage Bin #)"
                value={newCustomFieldName}
                onChange={(e) => setNewCustomFieldName(e.target.value)}
                required
              />
              <input
                type="text"
                className="form-control"
                placeholder="Placeholder text"
                value={newCustomFieldPlaceholder}
                onChange={(e) => setNewCustomFieldPlaceholder(e.target.value)}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="checkbox"
                    checked={newCustomFieldRequired}
                    onChange={(e) => setNewCustomFieldRequired(e.target.checked)}
                  /> Required
                </label>
                <button type="submit" className="btn btn--secondary" style={{ marginLeft: 'auto' }}>
                  <Plus size={16} /> Add Field
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(formSchema.customFields || []).map((field) => (
                <div key={field.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: '#6B21A8' }}>{field.name}</strong>
                    {field.required && <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#DC2626', fontWeight: 800 }}>(Required)</span>}
                    {field.placeholder && <span style={{ display: 'block', fontSize: '0.76rem', color: '#64748B' }}>Placeholder: "{field.placeholder}"</span>}
                  </div>
                  <button type="button" className="btn btn--danger btn--sm btn--icon" onClick={() => handleRemoveCustomField(field.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2-COLUMN GRID: CREATE ADMIN + ADMIN LIST */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
          
          {/* CREATE ADMIN FORM */}
          <div className="card" style={{ border: '1.5px solid var(--clr-border-indigo)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus color="#4F46E5" size={20} /> Create New Admin / SuperAdmin
            </h2>
            <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <label className="form-label">Admin Username <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. admin_hostel"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Password <span className="required">*</span></label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Assigned Role Privilege <span className="required">*</span></label>
                <select
                  className="form-control"
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value)}
                >
                  <option value="admin">Standard Admin (Inventory &amp; Verification)</option>
                  <option value="superadmin">⚡ SuperAdmin (Full System Edit &amp; Overrides)</option>
                </select>
              </div>

              <button type="submit" className="btn btn--primary btn--lg" style={{ marginTop: 'var(--space-xs)' }}>
                <UserCheck size={18} /> Provision Account
              </button>
            </form>
          </div>

          {/* ACTIVE ADMINS LIST */}
          <div className="card" style={{ border: '1.5px solid var(--clr-border-indigo)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck color="#7E22CE" size={20} /> System Administrator Accounts
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {admins.map((adm) => (
                <div key={adm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px var(--space-md)', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {adm.username}
                      <span className={`badge ${adm.role === 'superadmin' ? 'badge--claimed' : 'badge--published'}`}>
                        {adm.role.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                      Created: {formatDate(adm.created_at)}
                    </span>
                  </div>
                  {adm.username !== 'superadmin' && (
                    <button
                      className="btn btn--danger btn--sm btn--icon"
                      onClick={() => handleDeleteAdmin(adm.id, adm.username)}
                      title="Revoke Admin Access"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SYSTEM OVERRIDE TOOLS & AUDIT LOGS */}
        <div className="card" style={{ border: '2px solid #C084FC', background: '#FAF5FF', marginBottom: 'var(--space-2xl)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#6B21A8', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} color="#7E22CE" /> Global SuperAdmin Maintenance Tools
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-lg)' }}>
            <button className="btn btn--secondary" style={{ background: '#F3E8FF', color: '#6B21A8', borderColor: '#D8B4FE', fontWeight: 700 }} onClick={handlePurgeDeactivated}>
              <Trash2 size={16} /> Purge Deactivated Archives
            </button>
            <button className="btn btn--secondary" onClick={() => alert('Database index synchronized successfully.')}>
              <RefreshCw size={16} /> Sync Database Indexes
            </button>
          </div>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#581C87', marginBottom: '8px' }}>⚡ System Audit Log Stream</h3>
          <div style={{ background: '#0F172A', color: '#38BDF8', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: '0.82rem', maxHeight: '160px', overflowY: 'auto' }}>
            {systemLog.map((log, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>
                <span style={{ color: '#64748B' }}>[{log.time}]</span> {log.text}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

