'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';

export default function AdminTopBar() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(j => setUsername(j.user?.username ?? null));
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'white', borderBottom: '1px solid #E5E7EB',
      padding: '0 32px', height: 52,
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
    }}>
      {username && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: '#F0EEFF', borderRadius: 99 }}>
          <User size={13} style={{ color: '#6C5CE7' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#6C5CE7' }}>{username}</span>
        </div>
      )}
      <button
        onClick={logout} disabled={loggingOut}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 99, border: '1px solid #E5E7EB',
          background: 'transparent', cursor: loggingOut ? 'default' : 'pointer',
          fontSize: 13, fontWeight: 500, color: '#6B7280',
          fontFamily: 'Sarabun, sans-serif', transition: 'all .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#FDECEC'; e.currentTarget.style.color = '#E85C5C'; e.currentTarget.style.borderColor = '#FECACA'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
      >
        <LogOut size={13} />
        {loggingOut ? 'กำลังออก...' : 'ออกจากระบบ'}
      </button>
    </div>
  );
}
