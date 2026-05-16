'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, CalendarDays,
  ClipboardList, FileText, Brain, UserCog, Home, X, Database,
} from 'lucide-react';

const menuGroups: {
  label: string;
  items: { href: string; label: string; icon: React.ComponentType<{ size?: number }>; exact?: boolean }[];
}[] = [
  { label: 'ภาพรวม', items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true }] },
  { label: 'ข้อมูลพื้นฐาน', items: [
    { href: '/admin/children',    label: 'นักเรียน',       icon: Users },
    { href: '/admin/cohorts',     label: 'ห้องเรียน',      icon: BookOpen },
    { href: '/admin/enrollments', label: 'ลงทะเบียน',      icon: GraduationCap },
  ]},
  { label: 'รายวัน', items: [
    { href: '/admin/daily',      label: 'บันทึกรายวัน',   icon: CalendarDays },
    { href: '/admin/attendance', label: 'การเข้าเรียน',   icon: ClipboardList },
    { href: '/admin/reports',    label: 'รายงาน',          icon: FileText },
  ]},
  { label: 'พฤติกรรม', items: [
    { href: '/admin/behaviors', label: 'ประเมิน', icon: Brain },
  ]},
  { label: 'ผู้ใช้', items: [
    { href: '/admin/users', label: 'ผู้ใช้งาน', icon: UserCog },
  ]},
  { label: 'ระบบ', items: [
    { href: '/admin/database', label: 'Import / Export', icon: Database },
  ]},
];

interface Props { open: boolean; onClose: () => void; }

export default function AdminSidebar({ open, onClose }: Props) {
  const pathname = usePathname();
  return (
    <>
      {/* overlay */}
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />

      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        {/* Logo row */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#E8754A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🌻</div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 14, fontFamily: 'Prompt, sans-serif' }}>KinderCare</div>
              <div style={{ color: '#6C5CE7', fontSize: 10, fontWeight: 600 }}>ADMIN</div>
            </div>
          </div>
          {/* close button — mobile only */}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 4 }} className="mobile-menu-btn">
            <X size={18} />
          </button>
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
          {menuGroups.map(g => (
            <div key={g.label} style={{ marginBottom: 20 }}>
              <div style={{ color: '#374151', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px', marginBottom: 4 }}>{g.label}</div>
              {g.items.map(item => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={onClose}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, marginBottom: 2, textDecoration: 'none', transition: 'all .15s', background: active ? 'rgba(232,117,74,0.15)' : 'transparent', color: active ? '#E8754A' : '#9CA3AF', fontWeight: active ? 600 : 400, fontSize: 13.5 }}>
                    <Icon size={15} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, textDecoration: 'none', color: '#6B7280', fontSize: 13 }}>
            <Home size={14} /> กลับหน้าหลัก
          </Link>
        </div>
      </aside>
    </>
  );
}
