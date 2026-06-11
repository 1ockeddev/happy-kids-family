import Link from 'next/link';
import { query } from '@/lib/db';
import { User, Building, CheckCircle, XCircle, Calendar as CalendarIcon, PencilSquare } from '@/components/icons';
import { Zap, Brain } from 'lucide-react';

// Fetch data directly from database
async function fetchDashboardData() {
  const today = new Date().toISOString().split('T')[0];

  try {
    const [children, cohorts, dailies, attendances] = await Promise.all([
      query(`SELECT * FROM child WHERE deleted_at IS NULL ORDER BY name_th`),
      query(`SELECT * FROM cohort ORDER BY academic_year DESC, name`),
      query(
        `SELECT d.*,
          json_build_object('id', co.id, 'name', co.name, 'level', co.level) AS cohort
         FROM daily d
         JOIN cohort co ON co.id = d.cohort_id
         WHERE d.date = $1
         ORDER BY co.name`,
        [today]
      ),
      query(
        `SELECT a.*,
          json_build_object('id', c.id, 'name_th', c.name_th, 'name_en', c.name_en) AS child
         FROM attendance a
         JOIN child c ON c.id = a.child_id
         JOIN daily d ON d.id = a.daily_id
         WHERE d.date = $1
         ORDER BY c.name_th`,
        [today]
      ),
    ]);

    return { children, cohorts, dailies, attendances };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return { children: [], cohorts: [], dailies: [], attendances: [] };
  }
}

export default async function AdminDashboard() {
  const { children, cohorts, dailies, attendances } = await fetchDashboardData();
  
  const presentToday = attendances.filter((a: any) => a.status === 'present').length;
  const absentToday = attendances.filter((a: any) => a.status === 'absent').length;

  const stats = [
    { label: 'นักเรียนทั้งหมด', value: children.length, icon: <User size={22} color="#E8754A" />, color: '#E8754A', bg: '#FEF0EB' },
    { label: 'ห้องเรียน', value: cohorts.length, icon: <Building size={22} color="#4A90B8" />, color: '#4A90B8', bg: '#EBF4FA' },
    { label: 'มาเรียนวันนี้', value: presentToday, icon: <CheckCircle size={22} color="#4CAF76" />, color: '#4CAF76', bg: '#EBF7F0' },
    { label: 'ขาดเรียนวันนี้', value: absentToday, icon: <XCircle size={22} color="#E85C5C" />, color: '#E85C5C', bg: '#FDECEC' },
  ];

  const quickLinks = [
    { href: '/admin/children', label: 'จัดการนักเรียน', desc: 'เพิ่ม แก้ไข ลบข้อมูลนักเรียน', icon: <User size={24} color="#6366f1" /> },
    { href: '/admin/cohorts', label: 'จัดการห้องเรียน', desc: 'สร้างและจัดการรุ่น/ห้องเรียน', icon: <Building size={24} color="#6366f1" /> },
    { href: '/admin/daily', label: 'บันทึกรายวัน', desc: 'กิจกรรม อาหาร ผลไม้ประจำวัน', icon: <CalendarIcon size={24} color="#6366f1" /> },
    { href: '/admin/attendance', label: 'บันทึกการเข้าเรียน', desc: 'เช็คชื่อ สถานะนักเรียน', icon: <CheckCircle size={24} color="#6366f1" /> },
    { href: '/admin/reports', label: 'รายงานรายวัน', desc: 'นอน นม บันทึกส่วนตัว', icon: <PencilSquare size={24} color="#6366f1" /> },
    { href: '/admin/behaviors', label: 'ประเมินพฤติกรรม', desc: 'หมวดหมู่และรายการประเมิน', icon: <Brain size={24} color="#6366f1" /> },
    { href: '/admin/users', label: 'จัดการผู้ใช้', desc: 'ครู ผู้ปกครอง สิทธิ์การใช้งาน', icon: <User size={24} color="#6366f1" /> },
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
            <div style={{ padding: '6px 14px', background: '#F0EEFF', borderRadius: '99px', color: '#6C5CE7', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} color="#6C5CE7" /> Admin
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
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarIcon size={16} color="#6366f1" />
              <h3 style={{ fontSize: '15px', fontWeight: '600' }}>บันทึกวันนี้</h3>
            </div>
            <div style={{ padding: '0' }}>
              {dailies.length === 0 ? (
                <p style={{ padding: '20px', color: '#9CA3AF', fontSize: '14px' }}>ยังไม่มีบันทึกวันนี้</p>
              ) : dailies.map((d: any) => (
                <div key={d.id} style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: '500', fontSize: '14px' }}>{d.cohort?.name || 'ไม่ระบุห้อง'}</p>
                    <p style={{ color: '#9CA3AF', fontSize: '12px' }}>{d.activity || 'ไม่มีกิจกรรม'}</p>
                  </div>
                  <span style={{ fontSize: '12px', color: '#4CAF76', background: '#EBF7F0', padding: '2px 10px', borderRadius: '99px' }}>บันทึกแล้ว</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={16} color="#6366f1" />
              <h3 style={{ fontSize: '15px', fontWeight: '600' }}>สถานะการเข้าเรียนวันนี้</h3>
            </div>
            <div style={{ padding: '0' }}>
              {attendances.length === 0 ? (
                <p style={{ padding: '20px', color: '#9CA3AF', fontSize: '14px' }}>ยังไม่มีข้อมูลการเข้าเรียนวันนี้</p>
              ) : attendances.slice(0, 10).map((a: any) => (
                <div key={a.id} style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '14px' }}>{a.child?.name_th || a.child?.name_en || 'ไม่ระบุชื่อ'}</p>
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
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={16} color="#6366f1" /> เมนูลัด
          </h3>
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
