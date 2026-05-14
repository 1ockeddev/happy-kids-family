import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1A1A2E 0%, #2D2D4E 50%, #1A1A2E 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px', width: '100%' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>🌻</div>
        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '700', fontFamily: 'Prompt, sans-serif', marginBottom: '8px' }}>
          KinderCare
        </h1>
        <p style={{ color: '#9CA3AF', marginBottom: '48px', fontSize: '16px' }}>
          ระบบจัดการโรงเรียนอนุบาล
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="/report" style={{
            display: 'block', padding: '16px 24px', borderRadius: '12px',
            background: '#E8754A', color: 'white', textDecoration: 'none',
            fontWeight: '600', fontSize: '15px', transition: 'all 0.2s',
          }}>
            📋  ดูรายงานรายวัน (ผู้ปกครอง)
          </Link>
          <Link href="/login" style={{
            display: 'block', padding: '16px 24px', borderRadius: '12px',
            background: 'rgba(108, 92, 231, 0.15)', border: '1px solid rgba(108, 92, 231, 0.4)',
            color: '#A78BFA', textDecoration: 'none',
            fontWeight: '600', fontSize: '15px',
          }}>
            ⚙️  แผงควบคุมผู้ดูแล (Admin)
          </Link>
        </div>
        <p style={{ color: '#4B5563', marginTop: '32px', fontSize: '13px' }}>
          ระบบจัดการข้อมูลนักเรียน · การเข้าเรียน · รายงานรายวัน
        </p>
      </div>
    </div>
  );
}
