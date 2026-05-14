'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, CalendarDays,
  ClipboardList, FileText, Brain, UserCog, Home, ChevronRight
} from 'lucide-react';

const menuGroups: { label: string; items: { href: string; label: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; exact?: boolean }[] }[] = [
  {
    label: 'ภาพรวม',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ]
  },
  {
    label: 'จัดการข้อมูลพื้นฐาน',
    items: [
      { href: '/admin/children', label: 'นักเรียน', icon: Users },
      { href: '/admin/cohorts', label: 'ห้องเรียน / รุ่น', icon: BookOpen },
      { href: '/admin/enrollments', label: 'ลงทะเบียนเรียน', icon: GraduationCap },
    ]
  },
  {
    label: 'กิจกรรมรายวัน',
    items: [
      { href: '/admin/daily', label: 'บันทึกรายวัน', icon: CalendarDays },
      { href: '/admin/attendance', label: 'การเข้าเรียน', icon: ClipboardList },
      { href: '/admin/reports', label: 'รายงานรายวัน', icon: FileText },
    ]
  },
  {
    label: 'พฤติกรรม',
    items: [
      { href: '/admin/behaviors', label: 'หมวดหมู่ / รายการ', icon: Brain },
    ]
  },
  {
    label: 'ผู้ใช้งาน',
    items: [
      { href: '/admin/users', label: 'จัดการผู้ใช้', icon: UserCog },
    ]
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [username, setUsername] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(j => {
      if (j.user?.username) setUsername(j.user.username);
    });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#E8754A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🌻</div>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '15px', fontFamily: 'Prompt, sans-serif' }}>KinderCare</div>
            <div style={{ color: '#6C5CE7', fontSize: '11px', fontWeight: '500' }}>ADMIN PANEL</div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        {menuGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: '24px' }}>
            <div style={{ color: '#4B5563', fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px', marginBottom: '6px' }}>
              {group.label}
            </div>
            {group.items.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 10px', borderRadius: '8px', marginBottom: '2px',
                    textDecoration: 'none', transition: 'all 0.15s',
                    background: active ? 'rgba(232, 117, 74, 0.15)' : 'transparent',
                    color: active ? '#E8754A' : '#9CA3AF',
                    fontWeight: active ? '600' : '400',
                    fontSize: '13.5px',
                  }}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {active && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {username && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', marginBottom: '4px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(232,117,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>👤</div>
            <span style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: 600 }}>{username}</span>
          </div>
        )}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', textDecoration: 'none', color: '#6B7280', fontSize: '12px' }}>
          <Home size={13} />
          <span>หน้าหลัก</span>
        </Link>
        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#E85C5C', fontSize: '12px', fontFamily: 'Sarabun, sans-serif', marginTop: '2px' }}>
          <span>🚪</span>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
