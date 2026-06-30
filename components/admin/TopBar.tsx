'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Menu, Sun, Moon } from 'lucide-react';

interface Props { onMenuClick: () => void; }

type Theme = 'light' | 'dark';

export default function AdminTopBar({ onMenuClick }: Props) {
  const router = useRouter();
  const [username, setUsername]   = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(j => setUsername(j.user?.username ?? null));
    
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('admin-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme: Theme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      applyTheme(initialTheme);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    root.classList.toggle('dark-theme', newTheme === 'dark');
  };

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('admin-theme', newTheme);
    applyTheme(newTheme);
  };

  const logout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login'); router.refresh();
  };

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', height: 'var(--topbar-h)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, transition: 'background 0.3s, border-color 0.3s' }}>
      {/* hamburger — visible on mobile */}
      <button onClick={onMenuClick} className="mobile-menu-btn"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', borderRadius: 10, flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}>
        <Menu size={22} />
      </button>

      {/* Logo pill — shown on mobile when sidebar hidden */}
      <div className="mobile-menu-btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>🌻</span>
        <span style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Prompt, sans-serif', color: 'var(--text-primary)' }}>KinderCare</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Theme Toggle Switch */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'relative',
          width: 56,
          height: 30,
          borderRadius: 15,
          border: '2px solid var(--border-color)',
          background: theme === 'dark' ? '#4f46e5' : '#cbd5e1',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          padding: 0,
          outline: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
        title={theme === 'light' ? 'เปลี่ยนเป็นโหมดมืด' : 'เปลี่ยนเป็นโหมดสว่าง'}
        aria-label="Toggle theme"
      >
        {/* Switch Circle */}
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: theme === 'dark' ? 28 : 2,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--bg-primary)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            color: theme === 'dark' ? '#4f46e5' : '#f59e0b'
          }}
        >
          {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
        </div>
      </button>

      {username && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--accent-bg)', borderRadius: 99 }}>
          <User size={14} style={{ color: 'var(--accent-color)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-color)' }}>{username}</span>
        </div>
      )}
      <button onClick={logout} disabled={loggingOut}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 99, border: '1px solid var(--border-color)', background: 'transparent', cursor: loggingOut ? 'default' : 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'Sarabun, sans-serif', WebkitTapHighlightColor: 'transparent', minHeight: 38 }}>
        <LogOut size={15} />
        <span style={{ display: 'none' }} className="md-show">ออกจากระบบ</span>
      </button>
    </div>
  );
}
