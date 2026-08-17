import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Sparkles, ShieldCheck, UserCheck, Zap, ArrowRight } from 'lucide-react';

export default function StudentLogin() {
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'admin'

  // Student manual state
  const [regNumber, setRegNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentError, setStudentError] = useState('');
  const [studentSubmitting, setStudentSubmitting] = useState(false);

  // Admin manual state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const { loginStudent, loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/search';

  // ─── INSTANT QUICK LOGINS ──────────────────────────────────────────────────
  const handleQuickStudentLogin = async () => {
    setStudentError('');
    setStudentSubmitting(true);
    try {
      const data = await apiFetch('/auth/verify', {
        method: 'POST',
        body: { registration_number: 'REG001', name: 'Aarav Sharma' },
      });
      loginStudent(data.student, data.token);
      navigate(redirect);
    } catch (err) {
      setStudentError(err.message || 'Quick student login failed.');
    } finally {
      setStudentSubmitting(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setAdminError('');
    setAdminSubmitting(true);
    try {
      const data = await apiFetch('/auth/admin-login', {
        method: 'POST',
        body: { username: 'admin', password: 'admin123' },
      });
      loginAdmin(data.username, data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setAdminError(err.message || 'Quick admin login failed.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  // ─── MANUAL SUBMISSIONS ───────────────────────────────────────────────────
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setStudentError('');

    if (!regNumber.trim() || !studentName.trim()) {
      setStudentError('Please enter both Registration Number and Full Name.');
      return;
    }

    setStudentSubmitting(true);
    try {
      const data = await apiFetch('/auth/verify', {
        method: 'POST',
        body: { registration_number: regNumber.trim(), name: studentName.trim() },
      });
      loginStudent(data.student, data.token);
      navigate(redirect);
    } catch (err) {
      setStudentError(err.message || 'Student verification failed.');
    } finally {
      setStudentSubmitting(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError('');

    if (!adminUsername.trim() || !adminPassword) {
      setAdminError('Please enter username and password.');
      return;
    }

    setAdminSubmitting(true);
    try {
      const data = await apiFetch('/auth/admin-login', {
        method: 'POST',
        body: { username: adminUsername.trim(), password: adminPassword },
      });
      loginAdmin(data.username, data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setAdminError(err.message || 'Invalid admin credentials.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card auth-card--centered">
        
        {/* Logo & Header */}
        <div className="auth-logo" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div className="auth-logo-icon" style={{ margin: '0 auto' }}>
            <Sparkles size={24} />
          </div>
          <div className="auth-logo-text">
            <h1 style={{ fontSize: '1.5rem' }}>Transcend</h1>
            <p style={{ color: 'var(--clr-primary)', fontWeight: 700, letterSpacing: '0.05em' }}>
              LOST &amp; FOUND PORTAL
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs" style={{ marginTop: 'var(--space-md)' }}>
          <button
            className={`auth-tab ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => setActiveTab('student')}
          >
            <UserCheck size={16} /> Student Verification
          </button>
          <button
            className={`auth-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <ShieldCheck size={16} /> Admin Portal
          </button>
        </div>

        {/* STUDENT TAB */}
        {activeTab === 'student' && (
          <div>
            {/* Quick 1-Click Login Button */}
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <button
                type="button"
                className="btn btn--primary btn--full btn--lg"
                onClick={handleQuickStudentLogin}
                disabled={studentSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
                  boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
                  fontSize: '0.92rem'
                }}
              >
                <Zap size={18} fill="#ffffff" /> Quick Login as Student (Aarav Sharma)
              </button>
            </div>

            <div className="auth-divider">
              <span>or enter details manually</span>
            </div>

            <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Registration Number <span className="required">*</span></label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. REG001"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>

              {studentError && (
                <div className="auth-error-box">
                  {studentError}
                </div>
              )}

              <button type="submit" className="btn btn--secondary btn--full" disabled={studentSubmitting}>
                {studentSubmitting ? 'Verifying…' : 'Verify Identity'}
              </button>
            </form>
          </div>
        )}

        {/* ADMIN TAB */}
        {activeTab === 'admin' && (
          <div>
            {/* Quick 1-Click Login Button */}
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <button
                type="button"
                className="btn btn--primary btn--full btn--lg"
                onClick={handleQuickAdminLogin}
                disabled={adminSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.25)',
                  fontSize: '0.92rem'
                }}
              >
                <Zap size={18} fill="#ffffff" /> Quick Login as Admin
              </button>
            </div>

            <div className="auth-divider">
              <span>or enter admin credentials</span>
            </div>

            <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Username <span className="required">*</span></label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="admin"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password <span className="required">*</span></label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>

              {adminError && (
                <div className="auth-error-box">
                  {adminError}
                </div>
              )}

              <button type="submit" className="btn btn--secondary btn--full" disabled={adminSubmitting}>
                {adminSubmitting ? 'Signing in…' : 'Sign In as Admin'}
              </button>
            </form>
          </div>
        )}

        <hr className="divider" style={{ margin: 'var(--space-lg) 0 var(--space-md) 0' }} />

        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>
          <Link to="/search" style={{ color: 'var(--clr-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Browse Public Lost &amp; Found Items <ArrowRight size={14} />
          </Link>
        </p>

      </div>
    </div>
  );
}
