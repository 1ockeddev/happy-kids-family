import AdminSidebar from '@/components/admin/Sidebar';
import AdminTopBar from '@/components/admin/TopBar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
        <AdminTopBar />
        <div style={{ flex: 1 }}>{children}</div>
      </main>
    </div>
  );
}
