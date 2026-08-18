import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch, getToken, formatDateTime } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import StatusBadge from '../components/StatusBadge';
import { Send, MessageSquare, Check, X } from 'lucide-react';

export default function AdminChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectRequest = searchParams.get('request');

  const [claimsList, setClaimsList] = useState([]);
  const [activeRequestId, setActiveRequestId] = useState(preselectRequest || null);
  const [activeClaim, setActiveClaim] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }

    const loadClaims = async () => {
      setLoadingList(true);
      try {
        const data = await apiFetch('/claims/admin/all');
        setClaimsList(data.claims || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingList(false);
      }
    };

    loadClaims();
  }, [user, navigate]);

  // Client-side realtime chat listener for admin
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const handleCustomMsg = (e) => {
      if (e.detail?.requestId === activeRequestId) {
        setMessages((prev) => [...prev, e.detail.messageObj]);
      }
    };

    window.addEventListener('mock_chat_message', handleCustomMsg);

    return () => {
      window.removeEventListener('mock_chat_message', handleCustomMsg);
    };
  }, [user, activeRequestId]);

  // Load chat details when activeRequestId changes
  useEffect(() => {
    if (!activeRequestId) return;

    const loadActiveChat = async () => {
      setLoadingChat(true);
      try {
        const claimRes = await apiFetch(`/claims/admin/${activeRequestId}`);
        setActiveClaim(claimRes.claim);

        const msgRes = await apiFetch(`/messages/${activeRequestId}`);
        setMessages(msgRes.messages || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingChat(false);
      }
    };

    loadActiveChat();
  }, [activeRequestId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeRequestId) return;

    const text = inputMsg.trim();
    setInputMsg('');

    try {
      await apiFetch(`/messages/${activeRequestId}`, {
        method: 'POST',
        body: { message: text }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickApprove = async () => {
    if (!window.confirm('Approve this claim? The item status will be updated to CLAIMED.')) return;
    try {
      await apiFetch(`/claims/admin/${activeRequestId}/status`, {
        method: 'PATCH',
        body: { status: 'APPROVED' },
      });
      setActiveClaim(prev => prev ? { ...prev, status: 'APPROVED' } : null);
    } catch (err) {
      alert(err.message || 'Failed to approve claim.');
    }
  };

  const handleQuickReject = async () => {
    if (!window.confirm('Reject this claim?')) return;
    try {
      await apiFetch(`/claims/admin/${activeRequestId}/status`, {
        method: 'PATCH',
        body: { status: 'REJECTED' },
      });
      setActiveClaim(prev => prev ? { ...prev, status: 'REJECTED' } : null);
    } catch (err) {
      alert(err.message || 'Failed to reject claim.');
    }
  };

  if (!user) return null;

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main" style={{ display: 'flex', gap: 'var(--space-lg)', padding: 'var(--space-lg)', height: '100vh', overflow: 'hidden' }}>
        {/* Left Chat List Panel */}
        <div style={{ width: '300px', flexShrink: 0, background: '#FFFFFF', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--clr-border)', background: 'var(--clr-surface-2)' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--clr-text)' }}>Active Verification Chats</p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingList ? (
              <div className="loading-overlay"><div className="spinner"></div></div>
            ) : claimsList.length === 0 ? (
              <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
                No active claims found
              </div>
            ) : (
              claimsList.map((c) => {
                const item = c.item_id;
                const title = item ? (item.serial_number ? `#${item.serial_number} — ${item.category}` : item.category) : 'Item';
                const isActive = c._id === activeRequestId;

                return (
                  <div
                    key={c._id}
                    onClick={() => setActiveRequestId(c._id)}
                    style={{
                      padding: 'var(--space-md)',
                      borderBottom: '1px solid var(--clr-border)',
                      cursor: 'pointer',
                      background: isActive ? '#EEF2FF' : 'transparent',
                      borderLeft: isActive ? '4px solid var(--clr-primary)' : '4px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.86rem', color: 'var(--clr-text)' }}>{title}</strong>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Chat Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!activeRequestId ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-muted)', flexDirection: 'column', gap: 'var(--space-md)', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--clr-border)' }}>
              <MessageSquare size={48} color="var(--clr-text-dim)" />
              <p style={{ fontWeight: 600 }}>Select a verification chat from the left list</p>
            </div>
          ) : (
            <div className="chat-container" style={{ height: '100%' }}>
              <div className="chat-header">
                <div className="chat-header__info">
                  <h3>
                    {activeClaim?.item_id?.serial_number ? `#${activeClaim.item_id.serial_number} — ` : ''}{activeClaim?.item_id?.category || 'Item'}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                    Student: {activeClaim?.student_id?.name} ({activeClaim?.student_id?.registration_number}) · Status: {activeClaim?.status}
                  </p>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-xs)' }}>
                  {activeClaim?.status === 'PENDING' && (
                    <>
                      <button className="btn btn--success btn--sm" onClick={handleQuickApprove}>
                        <Check size={14} /> Approve
                      </button>
                      <button className="btn btn--danger btn--sm" onClick={handleQuickReject}>
                        <X size={14} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              {loadingChat ? (
                <div className="loading-overlay"><div className="spinner"></div></div>
              ) : (
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state__icon">💬</div>
                      <p className="empty-state__title">No messages yet</p>
                      <p className="empty-state__text">Start typing below to initiate the verification conversation with the student.</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isAdmin = msg.sender_role === 'admin';
                      return (
                        <div key={msg._id || index} className={`chat-message chat-message--${isAdmin ? 'admin' : 'student'}`}>
                          <div className="chat-bubble">{msg.message}</div>
                          <span className="chat-meta">
                            {isAdmin ? 'Admin' : 'Student'} · {formatDateTime(msg.createdAt)}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              <form onSubmit={handleSend} className="chat-input-area">
                <textarea
                  rows="1"
                  placeholder="Type a message as Admin…"
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
          )}
        </div>
      </main>
    </div>
  );
}
