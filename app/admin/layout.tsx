'use client';
import { useState } from 'react';
import AdminSidebar from '@/components/admin/Sidebar';
import AdminTopBar  from '@/components/admin/TopBar';
import BottomNav    from '@/components/admin/BottomNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div style={{ minHeight: '100dvh' }}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="admin-main" style={{ display: 'flex', flexDirection: 'column' }}>
        <AdminTopBar onMenuClick={() => setSidebarOpen(true)} />
        <div style={{ flex: 1 }}>{children}</div>
      </div>
      <BottomNav />
    </div>
  );
}
