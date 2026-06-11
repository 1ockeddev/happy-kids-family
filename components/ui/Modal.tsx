'use client';
import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean; title: ReactNode; onClose: () => void;
  onConfirm?: () => void; confirmLabel?: string; confirmDanger?: boolean; confirmDisabled?: boolean;
  children: ReactNode;
  size?: 'default' | 'large';
}

export default function Modal({ open, title, onClose, onConfirm, confirmLabel = 'บันทึก', confirmDanger, confirmDisabled, children, size = 'default' }: ModalProps) {
  // lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          animation: 'slideUp .2s ease',
          maxWidth: size === 'large' ? '900px' : '500px',
          width: size === 'large' ? '90%' : 'auto',
        }}
      >
        {/* drag handle — visual only */}
        <div style={{ width: 40, height: 4, background: '#E5E7EB', borderRadius: 99, margin: '10px auto 0', display: 'block' }} />

        <div className="modal-header">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {onConfirm && (
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>ยกเลิก</button>
            <button 
              className={`btn ${confirmDanger ? 'btn-danger' : 'btn-primary'}`} 
              onClick={onConfirm} 
              disabled={confirmDisabled}
              style={{ 
                flex: 2,
                opacity: confirmDisabled ? 0.5 : 1,
                cursor: confirmDisabled ? 'not-allowed' : 'pointer'
              }}
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
