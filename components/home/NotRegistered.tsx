import { useState } from 'react';
import { Building } from '@/components/icons';

interface NotRegisteredProps {
  lineId: string;
}

export default function NotRegistered({ lineId }: NotRegisteredProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(lineId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f8fafc' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 28, textAlign: 'center', maxWidth: 340, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <Building size={56} color="#6366f1" />
        </div>
        <h2 style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>ยังไม่มีข้อมูล</h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
          LINE บัญชีนี้ยังไม่ได้ผูกกับนักเรียน
          <br />
          กรุณาแจ้ง CODE ให้ครูเบียร์
        </p>

        {/* LINE ID Section */}
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px', marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            CODE ของคุณ
          </p>
          <p style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600, wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: 12 }}>
            {lineId}
          </p>
          <button
            onClick={handleCopy}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: copied ? '#10b981' : '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontFamily: 'Sarabun, sans-serif'
            }}
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                คัดลอกแล้ว!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                คัดลอก CODE
              </>
            )}
          </button>
        </div>

        <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>
          📱 กดปุ่มด้านบนเพื่อคัดลอก CODE
          <br />
          แล้วส่งให้ครูเบียร์เพื่อเชื่อมโยงบัญชี
        </p>
      </div>
    </div>
  );
}
