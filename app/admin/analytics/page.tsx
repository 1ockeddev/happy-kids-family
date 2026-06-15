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

interface UserActivity {
  timestamp: string;
  event_type: 'page_view' | 'click' | 'navigation';
  page_path: string;
  element_type?: string;
  element_label?: string;
  from_path?: string;
  to_path?: string;
  display_name?: string;
  line_display_name?: string;
  role?: string;
  user_id?: string;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // User detail view
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loadingUserActivities, setLoadingUserActivities] = useState(false);
  
  // Recent activities from all users
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
  const [loadingRecentActivities, setLoadingRecentActivities] = useState(true);
  const [recentActivitiesError, setRecentActivitiesError] = useState<string | null>(null);

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

  const fetchRecentActivities = async () => {
    setLoadingRecentActivities(true);
    setRecentActivitiesError(null);
    try {
      let url = '/api/analytics/recent?limit=50';
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (params.toString()) url += `&${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      
      // Check if response is an error
      if (!res.ok || data.error) {
        setRecentActivitiesError(data.error || 'Failed to fetch activities');
        setRecentActivities([]);
        return;
      }
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setRecentActivities(data);
      } else {
        console.error('Recent activities is not an array:', data);
        setRecentActivitiesError('Invalid data format');
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      setRecentActivitiesError('Network error');
      setRecentActivities([]);
    } finally {
      setLoadingRecentActivities(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecentActivities();
  }, []);

  const fetchUserActivities = async (userId: string) => {
    if (!userId) {
      setUserActivities([]);
      return;
    }
    
    setLoadingUserActivities(true);
    try {
      let url = `/api/analytics?user_id=${userId}`;
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (params.toString()) url += `&${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      setUserActivities(data || []);
    } catch (error) {
      console.error('Failed to fetch user activities:', error);
      setUserActivities([]);
    } finally {
      setLoadingUserActivities(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      fetchUserActivities(selectedUserId);
    }
  }, [selectedUserId, dateFrom, dateTo]);

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
            <button className="btn btn-primary" onClick={() => {
              fetchStats();
              fetchRecentActivities();
            }}>
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

        {/* User Activity Log Table - แสดงบนสุด */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#6366f1" />
              <span>User Activity Log</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '4px' }}>
              ดู user ไหนเข้ามาใช้ เมื่อไหร่ หน้าไหนบ้าง
            </p>
          </div>
          <div style={{ padding: '16px', overflowX: 'auto' }}>
            {loadingRecentActivities ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div className="shimmer" style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px' }} />
                กำลังโหลดข้อมูล...
              </div>
            ) : recentActivitiesError ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ color: '#ef4444', marginBottom: '8px', fontSize: '1.2rem' }}>⚠️</div>
                <p style={{ color: '#64748b', marginBottom: '8px' }}>เกิดข้อผิดพลาด: {recentActivitiesError}</p>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={fetchRecentActivities}
                  style={{ marginTop: '12px' }}
                >
                  ลองอีกครั้ง
                </button>
              </div>
            ) : recentActivities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                ยังไม่มีข้อมูล - ตรวจสอบว่ามีการเข้าใช้งาน user side หรือไม่
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>วันเวลา</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>ผู้ใช้</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Role</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Event</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>หน้า</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((activity, idx) => {
                    const time = new Date(activity.timestamp).toLocaleString('th-TH', { 
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit', 
                      minute: '2-digit',
                    });
                    
                    const displayName = activity.display_name || activity.line_display_name || 'ไม่ระบุชื่อ';
                    
                    const roleLabel = activity.role === 'parent' ? 'ผู้ปกครอง' : 
                                     activity.role === 'teacher' ? 'ครู' : 
                                     activity.role === 'admin' ? 'Admin' : 
                                     activity.role || '-';
                    
                    let eventLabel = '';
                    let eventColor = '#64748b';
                    let details = '';
                    
                    if (activity.event_type === 'page_view') {
                      eventLabel = '👁️ เปิดหน้า';
                      eventColor = '#6366f1';
                      details = '-';
                    } else if (activity.event_type === 'click') {
                      eventLabel = '👆 คลิก';
                      eventColor = '#f59e0b';
                      details = activity.element_label || activity.element_type || '-';
                    } else if (activity.event_type === 'navigation') {
                      eventLabel = '🔀 นำทาง';
                      eventColor = '#ec4899';
                      details = activity.from_path ? `จาก ${getPageLabel(activity.from_path)}` : '-';
                    }
                    
                    return (
                      <tr 
                        key={idx}
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        onClick={() => activity.user_id && setSelectedUserId(activity.user_id)}
                        title="คลิกเพื่อดู activity ทั้งหมดของผู้ใช้นี้"
                      >
                        <td style={{ padding: '10px 8px', whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#64748b' }}>
                          {time}
                        </td>
                        <td style={{ padding: '10px 8px', fontWeight: 500, color: '#1e293b' }}>
                          {displayName}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#64748b' }}>
                          {roleLabel}
                        </td>
                        <td style={{ padding: '10px 8px', fontWeight: 500, color: eventColor }}>
                          {eventLabel}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#1e293b' }}>
                          {getPageLabel(activity.page_path)}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#64748b', fontSize: '0.8rem' }}>
                          {details}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
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
                  onClick={() => setSelectedUserId(user.user_id)}
                  style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: selectedUserId === user.user_id ? '#f0f9ff' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = selectedUserId === user.user_id ? '#f0f9ff' : '#fafafa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = selectedUserId === user.user_id ? '#f0f9ff' : 'transparent'}
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
                  {selectedUserId === user.user_id && (
                    <div style={{ marginLeft: '8px', color: '#3b82f6' }}>
                      <MousePointer size={16} />
                    </div>
                  )}
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

        {/* User Activity Timeline */}
        {selectedUserId && (
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MousePointer size={18} color="#3b82f6" />
                <span>
                  กิจกรรมของ: {stats.topActiveUsers.find(u => u.user_id === selectedUserId)?.display_name}
                </span>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedUserId('')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                ✕ ปิด
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              {loadingUserActivities ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <div className="shimmer" style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px' }} />
                  กำลังโหลด...
                </div>
              ) : userActivities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  ไม่มีข้อมูลกิจกรรม
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  {/* Timeline line */}
                  <div style={{
                    position: 'absolute',
                    left: '20px',
                    top: '0',
                    bottom: '0',
                    width: '2px',
                    background: '#e5e7eb'
                  }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {userActivities.map((activity, idx) => {
                      const time = new Date(activity.timestamp).toLocaleTimeString('th-TH', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      });
                      const date = new Date(activity.timestamp).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });

                      let icon, color, bgColor, label;
                      
                      if (activity.event_type === 'page_view') {
                        icon = '👁️';
                        color = '#6366f1';
                        bgColor = '#eff6ff';
                        label = `เปิดหน้า: ${getPageLabel(activity.page_path)}`;
                      } else if (activity.event_type === 'click') {
                        icon = '👆';
                        color = '#f59e0b';
                        bgColor = '#fffbeb';
                        label = `คลิก: ${activity.element_label || activity.element_type || 'ไม่ระบุ'}`;
                      } else if (activity.event_type === 'navigation') {
                        icon = '🔀';
                        color = '#ec4899';
                        bgColor = '#fdf2f8';
                        label = `ไป: ${getPageLabel(activity.to_path || '')}`;
                      }

                      return (
                        <div key={idx} style={{ display: 'flex', gap: '16px', paddingBottom: '20px', position: 'relative' }}>
                          {/* Timeline dot */}
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: bgColor,
                            border: `3px solid ${color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            flexShrink: 0,
                            position: 'relative',
                            zIndex: 1
                          }}>
                            {icon}
                          </div>
                          
                          {/* Content */}
                          <div style={{ flex: 1, paddingTop: '4px' }}>
                            <div style={{ 
                              background: '#fafafa', 
                              padding: '12px 16px', 
                              borderRadius: '12px',
                              border: '1px solid #f1f5f9'
                            }}>
                              <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1e293b', marginBottom: '4px' }}>
                                {label}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                {time} • {date}
                              </div>
                              {activity.page_path && activity.event_type !== 'page_view' && (
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                                  หน้า: {getPageLabel(activity.page_path)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
