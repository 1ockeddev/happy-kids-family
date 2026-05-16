import Link from 'next/link';
import { mockChildren, mockCohorts, mockDailies, mockAttendances } from '@/lib/mock-data';

export default function AdminDashboard() {
  const presentToday = mockAttendances.filter(a => a.status === 'present').length;
  const absentToday = mockAttendances.filter(a => a.status === 'absent').length;

  const stats = [
    { label: 'นักเรียนทั้งหมด', value: mockChildren.length, icon: '👧', color: '#E8754A', bg: '#FEF0EB' },
    { label: 'ห้องเรียน', value: mockCohorts.length, icon: '🏫', color: '#4A90B8', bg: '#EBF4FA' },
    { label: 'มาเรียนวันนี้', value: presentToday, icon: '✅', color: '#4CAF76', bg: '#EBF7F0' },
    { label: 'ขาดเรียนวันนี้', value: absentToday, icon: '❌', color: '#E85C5C', bg: '#FDECEC' },
  ];

  const quickLinks = [
    { href: '/admin/children', label: 'จัดการนักเรียน', desc: 'เพิ่ม แก้ไข ลบข้อมูลนักเรียน', icon: '👧' },
    { href: '/admin/cohorts', label: 'จัดการห้องเรียน', desc: 'สร้างและจัดการรุ่น/ห้องเรียน', icon: '🏫' },
    { href: '/admin/daily', label: 'บันทึกรายวัน', desc: 'กิจกรรม อาหาร ผลไม้ประจำวัน', icon: '📅' },
    { href: '/admin/attendance', label: 'บันทึกการเข้าเรียน', desc: 'เช็คชื่อ สถานะนักเรียน', icon: '📋' },
    { href: '/admin/reports', label: 'รายงานรายวัน', desc: 'นอน นม บันทึกส่วนตัว', icon: '📝' },
    { href: '/admin/behaviors', label: 'ประเมินพฤติกรรม', desc: 'หมวดหมู่และรายการประเมิน', icon: '🧠' },
    { href: '/admin/users', label: 'จัดการผู้ใช้', desc: 'ครู ผู้ปกครอง สิทธิ์การใช้งาน', icon: '👤' },
  ];

  return (
    <>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A2E' }}>Dashboard</h1>
            <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '2px' }}>ภาพรวมระบบ KinderCare</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '6px 14px', background: '#F0EEFF', borderRadius: '99px', color: '#6C5CE7', fontSize: '13px', fontWeight: '600' }}>
              👤 Admin
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {stats.map((stat) => (
            <div key={stat.label} className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '6px' }}>{stat.label}</p>
                  <p style={{ fontSize: '32px', fontWeight: '700', color: stat.color, fontFamily: 'Prompt, sans-serif' }}>{stat.value}</p>
                </div>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Today's dailies */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginBottom: '32px' }}>
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600' }}>📅 บันทึกวันนี้</h3>
            </div>
            <div style={{ padding: '0' }}>
              {mockDailies.length === 0 ? (
                <p style={{ padding: '20px', color: '#9CA3AF', fontSize: '14px' }}>ยังไม่มีบันทึกวันนี้</p>
              ) : mockDailies.map((d) => (
                <div key={d.id} style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: '500', fontSize: '14px' }}>{d.cohort?.name}</p>
                    <p style={{ color: '#9CA3AF', fontSize: '12px' }}>{d.activity}</p>
                  </div>
                  <span style={{ fontSize: '12px', color: '#4CAF76', background: '#EBF7F0', padding: '2px 10px', borderRadius: '99px' }}>บันทึกแล้ว</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600' }}>📋 สถานะการเข้าเรียนวันนี้</h3>
            </div>
            <div style={{ padding: '0' }}>
              {mockAttendances.map((a) => (
                <div key={a.id} style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '14px' }}>{a.child?.name_th}</p>
                  <span className={`badge badge-${a.status}`}>
                    {a.status === 'present' ? 'มาเรียน' : a.status === 'absent' ? 'ขาด' : a.status === 'sick' ? 'ป่วย' : 'ลา'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>⚡ เมนูลัด</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '16px', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{link.icon}</div>
                  <p style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px', color: '#1A1A2E' }}>{link.label}</p>
                  <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
