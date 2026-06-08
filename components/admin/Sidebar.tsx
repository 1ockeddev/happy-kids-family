'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, CalendarDays,
  ClipboardList, FileText, Brain, UserCog, Home, X, Database, CalendarOff,
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
    { href: '/admin/holidays',    label: 'วันหยุด',        icon: CalendarOff },
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
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#E8754A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🌻</div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 16, fontFamily: 'Prompt, sans-serif' }}>KinderCare</div>
              <div style={{ color: '#6C5CE7', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' }}>ADMIN</div>
            </div>
          </div>
          {/* close button — mobile only */}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 6, borderRadius: 8, WebkitTapHighlightColor: 'transparent' }} className="mobile-menu-btn">
            <X size={20} />
          </button>
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
          {menuGroups.map(g => (
            <div key={g.label} style={{ marginBottom: 24 }}>
              <div style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 6 }}>{g.label}</div>
              {g.items.map(item => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={onClose}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 10, marginBottom: 3, textDecoration: 'none', transition: 'all .15s', background: active ? 'rgba(232,117,74,0.15)' : 'transparent', color: active ? '#E8754A' : '#9CA3AF', fontWeight: active ? 600 : 400, fontSize: 14.5, WebkitTapHighlightColor: 'transparent', minHeight: 44 }}>
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '14px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', color: '#6B7280', fontSize: 14, WebkitTapHighlightColor: 'transparent', minHeight: 44 }}>
            <Home size={16} /> กลับหน้าหลัก
          </Link>
        </div>
      </aside>
    </>
  );
}
