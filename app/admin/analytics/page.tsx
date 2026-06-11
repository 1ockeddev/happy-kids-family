'use client';
import { useState, useEffect } from 'react';
import { BarChart3, Users, MousePointer, Clock, TrendingUp, Activity } from 'lucide-react';

interface AnalyticsStats {
  mostVisitedPages: any[];
  mostClickedElements: any[];
  navigationPatterns: any[];
  dailyActivity: any[];
  topActiveUsers: any[];
  avgDurationByPage: any[];
  hourlyPattern: any[];
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      let url = '/api/analytics/stats';
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getPageLabel = (path: string) => {
    const labels: Record<string, string> = {
      '/': 'หน้าหลัก',
      '/summary-behavior': 'สรุปอุปนิสัย',
      '/summary-nap': 'สรุปการนอน',
      '/summary-excretion': 'สรุปการขับถ่าย',
      '/summary-food-milk': 'สรุปอาหาร-นม',
    };
    return labels[path] || path;
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="shimmer" style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>กำลังโหลดสถิติ...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '24px' }}>
        <p>ไม่สามารถโหลดข้อมูลได้</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '16px 20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A2E', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={22} color="#6366f1" />
          Analytics Dashboard
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
          สถิติการใช้งานระบบ
        </p>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Date Filter */}
        <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="form-label">วันที่เริ่มต้น</label>
              <input
                type="date"
                className="form-input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="form-label">วันที่สิ้นสุด</label>
              <input
                type="date"
                className="form-input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={fetchStats}>
              <BarChart3 size={16} />
              ดึงข้อมูล
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} color="#6366f1" />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>ผู้ใช้งานทั้งหมด</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                  {stats.topActiveUsers.length}
                </p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={24} color="#10b981" />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>การเข้าชมทั้งหมด</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                  {stats.mostVisitedPages.reduce((sum, p) => sum + parseInt(p.visit_count), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MousePointer size={24} color="#f59e0b" />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>คลิกทั้งหมด</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                  {stats.mostClickedElements.reduce((sum, e) => sum + parseInt(e.click_count), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Most Visited Pages */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#6366f1" />
              <span>หน้าที่เข้าชมมากที่สุด</span>
            </div>
          </div>
          <div style={{ padding: '0' }}>
            {stats.mostVisitedPages.slice(0, 10).map((page, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px 20px',
                  borderBottom: idx < stats.mostVisitedPages.length - 1 ? '1px solid #f1f5f9' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1e293b', marginBottom: '4px' }}>
                    {getPageLabel(page.page_path)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {page.page_path}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#6366f1' }}>
                    {page.visit_count}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {page.unique_users} ผู้ใช้
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    <Clock size={10} style={{ display: 'inline', marginRight: '2px' }} />
                    {formatDuration(Math.round(page.avg_duration_seconds))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grid Layout: Most Clicked & Top Users */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          {/* Most Clicked Elements */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MousePointer size={18} color="#f59e0b" />
                <span>องค์ประกอบที่คลิกมากที่สุด</span>
              </div>
            </div>
            <div style={{ padding: '0', maxHeight: '400px', overflowY: 'auto' }}>
              {stats.mostClickedElements.slice(0, 15).map((elem, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#1e293b', marginBottom: '2px' }}>
                      {elem.element_label || 'ไม่ระบุ'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      {elem.element_type} • {getPageLabel(elem.page_path)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: '#f59e0b' }}>
                      {elem.click_count}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                      {elem.unique_users} ผู้ใช้
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Active Users */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#10b981" />
                <span>ผู้ใช้งานที่ Active มากที่สุด</span>
              </div>
            </div>
            <div style={{ padding: '0', maxHeight: '400px', overflowY: 'auto' }}>
              {stats.topActiveUsers.slice(0, 15).map((user, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#1e293b', marginBottom: '2px' }}>
                      {user.display_name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      {user.role === 'parent' ? 'ผู้ปกครอง' : user.role === 'teacher' ? 'ครู' : 'Admin'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: '#10b981' }}>
                      {user.total_events}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                      {formatDuration(user.total_time_seconds)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Patterns */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#ec4899" />
              <span>รูปแบบการนำทาง</span>
            </div>
          </div>
          <div style={{ padding: '0', maxHeight: '400px', overflowY: 'auto' }}>
            {stats.navigationPatterns.slice(0, 20).map((nav, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 20px',
                  borderBottom: idx < stats.navigationPatterns.length - 1 ? '1px solid #f1f5f9' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1, fontSize: '0.85rem' }}>
                  <span style={{ color: '#6366f1', fontWeight: '600' }}>{getPageLabel(nav.from_path)}</span>
                  <span style={{ color: '#94a3b8', margin: '0 8px' }}>→</span>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>{getPageLabel(nav.to_path)}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', color: '#ec4899' }}>{nav.navigation_count}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{nav.unique_users} ผู้ใช้</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
