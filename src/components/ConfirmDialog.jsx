import { AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function ConfirmDialog({ message = 'This action cannot be undone.', onConfirm, onCancel }) {
  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div className="animate-fade-up" style={{
        background: '#15151f', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: 24, width: '100%', maxWidth: 380,
        boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={20} color="#f87171" />
          </div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'white', fontSize: 16, margin: 0 }}>Are you sure?</h3>
        </div>
        <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24, marginLeft: 52 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button onClick={onConfirm}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#ef4444', color: 'white', border: 'none', borderRadius: 12,
              padding: '10px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
            onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
