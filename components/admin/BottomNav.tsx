'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CalendarDays, FileText, MoreHorizontal } from 'lucide-react';

const navItems = [
  { href: '/admin',            label: 'หน้าหลัก', icon: LayoutDashboard, exact: true },
  { href: '/admin/children',   label: 'นักเรียน',  icon: Users },
  { href: '/admin/daily',      label: 'รายวัน',    icon: CalendarDays },
  { href: '/admin/reports',    label: 'รายงาน',    icon: FileText },
  { href: '/admin/cohorts',    label: 'เพิ่มเติม', icon: MoreHorizontal },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}>
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
