'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Menu } from 'lucide-react';

interface Props { onMenuClick: () => void; }

export default function AdminTopBar({ onMenuClick }: Props) {
  const router = useRouter();
  const [username, setUsername]   = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(j => setUsername(j.user?.username ?? null));
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login'); router.refresh();
  };

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'white', borderBottom: '1px solid #E5E7EB', height: 'var(--topbar-h)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
      {/* hamburger — visible on mobile */}
      <button onClick={onMenuClick} className="mobile-menu-btn"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, border: 'none', background: 'none', cursor: 'pointer', color: '#6B7280', borderRadius: 10, flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}>
        <Menu size={22} />
      </button>

      {/* Logo pill — shown on mobile when sidebar hidden */}
      <div className="mobile-menu-btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>🌻</span>
        <span style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Prompt, sans-serif', color: '#1A1A2E' }}>KinderCare</span>
      </div>

      <div style={{ flex: 1 }} />

      {username && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#F0EEFF', borderRadius: 99 }}>
          <User size={14} style={{ color: '#6C5CE7' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#6C5CE7' }}>{username}</span>
        </div>
      )}
      <button onClick={logout} disabled={loggingOut}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 99, border: '1px solid #E5E7EB', background: 'transparent', cursor: loggingOut ? 'default' : 'pointer', fontSize: 13, fontWeight: 500, color: '#6B7280', fontFamily: 'Sarabun, sans-serif', WebkitTapHighlightColor: 'transparent', minHeight: 38 }}>
        <LogOut size={15} />
        <span style={{ display: 'none' }} className="md-show">ออกจากระบบ</span>
      </button>
    </div>
  );
}
