import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toastState, setToastState] = useState(null); // { message, title, type: 'success'|'error'|'info', isOpen: boolean }

  const showToast = useCallback((message, type = 'success', title = '') => {
    let defaultTitle = 'Notice';
    if (type === 'success') defaultTitle = 'Success!';
    if (type === 'error') defaultTitle = 'Action Failed';
    if (type === 'info') defaultTitle = 'Information';

    setToastState({
      message: typeof message === 'string' ? message : JSON.stringify(message),
      title: title || defaultTitle,
      type,
      isOpen: true,
    });
  }, []);

  const closeToast = useCallback(() => {
    setToastState(null);
  }, []);

  const toast = {
    success: (msg, title) => showToast(msg, 'success', title),
    error: (msg, title) => showToast(msg, 'error', title),
    info: (msg, title) => showToast(msg, 'info', title),
  };

  return (
    <ToastContext.Provider value={{ showToast, closeToast, toast }}>
      {children}

      {/* CUSTOM DESIGNER DIALOGUE MODAL (REPLACES NATIVE BROWSER ALERT) */}
      {toastState && toastState.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
            animation: 'fadeIn 200ms ease-out',
          }}
          onClick={closeToast}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '32px 28px',
              boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.35)',
              border: '1.5px solid var(--clr-border-indigo)',
              position: 'relative',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'scaleUp 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeToast}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                color: '#64748B',
                transition: 'all 150ms',
              }}
            >
              <X size={16} />
            </button>

            {/* Icon Banner */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '16px',
                background:
                  toastState.type === 'error'
                    ? '#FFE4E6'
                    : toastState.type === 'info'
                    ? '#EEF2FF'
                    : '#DCFCE7',
                color:
                  toastState.type === 'error'
                    ? '#E11D48'
                    : toastState.type === 'info'
                    ? '#4F46E5'
                    : '#15803D',
                boxShadow:
                  toastState.type === 'error'
                    ? '0 10px 25px rgba(225, 29, 72, 0.25)'
                    : toastState.type === 'info'
                    ? '0 10px 25px rgba(79, 70, 229, 0.25)'
                    : '0 10px 25px rgba(21, 128, 61, 0.25)',
              }}
            >
              {toastState.type === 'error' ? (
                <AlertTriangle size={32} />
              ) : toastState.type === 'info' ? (
                <Info size={32} />
              ) : (
                <CheckCircle size={32} />
              )}
            </div>

            {/* Title */}
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.3rem',
                fontWeight: 800,
                color: 'var(--clr-text)',
                marginBottom: '8px',
              }}
            >
              {toastState.title}
            </h3>

            {/* Message Body */}
            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--clr-text-muted)',
                lineHeight: 1.5,
                marginBottom: '24px',
                wordBreak: 'break-word',
              }}
            >
              {toastState.message}
            </p>

            {/* Action Button */}
            <button
              className={`btn ${
                toastState.type === 'error'
                  ? 'btn--danger-solid'
                  : 'btn--primary'
              } btn--lg`}
              style={{ width: '100%', justifyContent: 'center', borderRadius: '12px' }}
              onClick={closeToast}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
