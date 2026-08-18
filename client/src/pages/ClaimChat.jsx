import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { apiFetch, getToken, formatDate, formatDateTime, getCategoryIcon, getImageUrl } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { Send, Users, ShieldCheck, X } from 'lucide-react';

export default function ClaimChat() {
  const { requestId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [claim, setClaim] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  // In-Person Modal state
  const [showInPersonModal, setShowInPersonModal] = useState(false);
  const [ipDate, setIpDate] = useState('');
  const [ipTime, setIpTime] = useState('');
  const [ipNote, setIpNote] = useState('');
  const [ipSubmitting, setIpSubmitting] = useState(false);
  const [ipSuccess, setIpSuccess] = useState('');

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate(`/login?redirect=/chat/${requestId}`);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const claimRes = await apiFetch(`/claims/${requestId}`);
        setClaim(claimRes.claim);

        const msgRes = await apiFetch(`/messages/${requestId}`);
        setMessages(msgRes.messages || []);
      } catch (err) {
        console.error(err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [requestId, user, navigate]);

  // Connect Socket.IO
  useEffect(() => {
    if (!user || !requestId) return;

    const token = getToken();
    const serverUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(serverUrl, {
      auth: { token }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_room', requestId);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [requestId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      requestId,
      message: inputMsg.trim()
    });

    setInputMsg('');
  };

  const handleInPersonSubmit = async (e) => {
    e.preventDefault();
    setIpSubmitting(true);
    try {
      await apiFetch(`/claims/${requestId}/inperson`, {
        method: 'POST',
        body: { preferred_date: ipDate, preferred_time: ipTime, note: ipNote }
      });
      setIpSuccess('In-person meeting requested successfully!');
      setTimeout(() => {
        setShowInPersonModal(false);
        setIpSuccess('');
      }, 1500);
    } catch (err) {
      alert(err.message || 'Failed to submit in-person request.');
    } finally {
      setIpSubmitting(false);
    }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;
  if (!claim) return null;

  const item = claim.item_id;
  const itemTitle = item ? [item.color, item.brand, item.category].filter(Boolean).join(' ') : 'Item';

  return (
    <main className="page page--medium">
      <div className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="page-header__eyebrow">💬 Ownership Verification</div>
        <h1 className="page-header__title">Verification Chat: {itemTitle}</h1>
      </div>

      {/* Item Summary Card */}
      <div className="card" style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center', marginBottom: 'var(--space-lg)', padding: 'var(--space-md) var(--space-lg)' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', background: 'var(--clr-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
          {item?.image_url ? (
            <img src={getImageUrl(item.image_url)} alt={itemTitle} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
          ) : (
            getCategoryIcon(item?.category)
          )}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{itemTitle}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
            📍 {item?.location_found} · 📅 {formatDate(item?.date_found)}
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StatusBadge status={claim.status} />
        </div>
      </div>

      {/* Chat Container */}
      <div className="chat-container">
        <div className="chat-header">
          <div style={{ fontSize: '1.2rem' }}><ShieldCheck color="var(--clr-primary)" /></div>
          <div className="chat-header__info">
            <h3>Ownership Verification Chat</h3>
            <p>{socketConnected ? '🟢 Live Connected' : '🔴 Connecting…'}</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn--secondary btn--sm" onClick={() => setShowInPersonModal(true)}>
              <Users size={14} /> Request In-Person Meeting
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">💬</div>
              <p className="empty-state__title">No messages yet</p>
              <p className="empty-state__text">The admin will inspect your claim message and respond here to verify details.</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender_role === 'student';
              return (
                <div key={msg._id || index} className={`chat-message chat-message--${isMe ? 'student' : 'admin'}`}>
                  <div className="chat-bubble">{msg.message}</div>
                  <span className="chat-meta">
                    {isMe ? user.name : 'Admin'} · {formatDateTime(msg.createdAt)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-area">
          <textarea
            rows="1"
            placeholder="Type your message to the admin…"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button type="submit" className="btn btn--primary btn--icon">
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* In-Person Meeting Modal */}
      {showInPersonModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)' }}>
          <div className="card card--elevated" style={{ maxWidth: '480px', width: '100%', position: 'relative' }}>
            <button
              onClick={() => setShowInPersonModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)' }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-md)' }}>Request In-Person Verification</h2>

            {ipSuccess ? (
              <div style={{ padding: 'var(--space-md)', background: '#D1FAE5', color: '#059669', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 600 }}>
                {ipSuccess}
              </div>
            ) : (
              <form onSubmit={handleInPersonSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Preferred Date <span className="required">*</span></label>
                    <input className="form-control" type="date" value={ipDate} onChange={(e) => setIpDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preferred Time <span className="required">*</span></label>
                    <input className="form-control" type="time" value={ipTime} onChange={(e) => setIpTime(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Note</label>
                  <textarea className="form-control" rows="2" placeholder="Any additional note for the admin..." value={ipNote} onChange={(e) => setIpNote(e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <button type="submit" className="btn btn--primary" disabled={ipSubmitting}>
                    {ipSubmitting ? 'Submitting…' : 'Submit Request'}
                  </button>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowInPersonModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
