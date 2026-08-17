import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { ShieldCheck, ArrowLeft, Zap, Lock, User } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user, loginAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const handleQuickAdminLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      const data = await apiFetch('/auth/admin-login', {
        method: 'POST',
        body: { username: 'admin', password: 'admin123' },
      });
      loginAdmin(data.username, data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Quick admin login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiFetch('/auth/admin-login', {
        method: 'POST',
        body: { username: username.trim(), password },
      });

      loginAdmin(data.username, data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid admin credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card auth-card--centered">
        
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
          <div style={{
            width: '52px', height: '52px',
            background: 'var(--grad-navy)',
            color: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            display: 'grid', placeItems: 'center',
            margin: '0 auto var(--space-sm)',
            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.3)'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--clr-text)' }}>
            Transcend Admin
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-muted)', marginTop: '4px' }}>
            Administrative Control Panel &amp; Claims Management
          </p>
        </div>

        {/* 1-Click Quick Login Button */}
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <button
            type="button"
            className="btn-quick-admin"
            onClick={handleQuickAdminLogin}
            disabled={submitting}
          >
            <Zap size={18} fill="#ffffff" /> Quick Login as Admin
          </button>
        </div>

        <div className="auth-divider">
          <span>or enter admin credentials</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">Admin Username <span className="required">*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ paddingLeft: '42px' }}
              />
              <User size={18} color="var(--clr-indigo)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password <span className="required">*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '42px' }}
              />
              <Lock size={18} color="var(--clr-indigo)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {error && (
            <div className="auth-error-box">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In to Admin Dashboard'}
          </button>
        </form>

        <hr className="divider" style={{ margin: 'var(--space-xl) 0 var(--space-md) 0' }} />

        <p style={{ textAlign: 'center', fontSize: '0.84rem', color: 'var(--clr-text-muted)' }}>
          <Link to="/" style={{ color: '#4F46E5', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={15} /> Back to Student Verification Login
          </Link>
        </p>

      </div>
    </div>
  );
}
