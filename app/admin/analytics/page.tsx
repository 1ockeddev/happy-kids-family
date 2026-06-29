'use client';
import { useState, useEffect } from 'react';
import { BarChart3, Users, MousePointer, Clock, TrendingUp, Activity, X } from 'lucide-react';

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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loadingUserActivities, setLoadingUserActivities] = useState(false);
  
  // Recent activities from all users
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
  const [loadingRecentActivities, setLoadingRecentActivities] = useState(true);
  const [recentActivitiesError, setRecentActivitiesError] = useState<string | null>(null);
  
  // Filter for activity type
  const [activityFilter, setActivityFilter] = useState<'all' | 'user' | 'admin'>('user');

  const fetchStats = async () => {
    setLoading(true);
    try {
      let url = '/api/analytics/stats';
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        credentials: 'include' // ✅ Ensure cookies are sent
      });
      
      if (res.status === 401) {
        console.error('Unauthorized - redirecting to login');
        window.location.href = '/admin/login';
        return;
      }
      
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
      params.append('limit', '50');
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (params.toString()) url = `/api/analytics/recent?${params.toString()}`;

      const res = await fetch(url, {
        credentials: 'include' // ✅ Ensure cookies are sent
      });
      
      if (res.status === 401) {
        console.error('Unauthorized - redirecting to login');
        window.location.href = '/admin/login';
        return;
      }
      
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
    // Only fetch stats and recent activities on initial load or date filter change
    // Not when user selection changes
    fetchStats();
    fetchRecentActivities();
  }, [dateFrom, dateTo]);

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

      const res = await fetch(url, {
        credentials: 'include' // ✅ Ensure cookies are sent
      });
      
      if (res.status === 401) {
        console.error('Unauthorized - redirecting to login');
        window.location.href = '/admin/login';
        return;
      }
      
      const data = await res.json();
      
      // Check if response is an error or not an array
      if (!res.ok || data.error || !Array.isArray(data)) {
        console.error('Failed to fetch user activities:', data);
        setUserActivities([]);
        return;
      }
      
      setUserActivities(data);
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
    
    const YEAR = 365 * 24 * 60 * 60;
    const DAY = 24 * 60 * 60;
    const HOUR = 60 * 60;
    const MINUTE = 60;
    
    // > 1 year: show date (d m y)
    if (seconds >= YEAR) {
      const date = new Date();
      date.setSeconds(date.getSeconds() - seconds);
      const day = date.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    }
    
    // > 24 hours: show days
    if (seconds >= DAY) {
      const days = Math.floor(seconds / DAY);
      return `${days}d`;
    }
    
    // > 60 minutes: show hours
    if (seconds >= HOUR) {
      const hours = Math.floor(seconds / HOUR);
      return `${hours}h`;
    }
    
    // > 60 seconds: show minutes
    if (seconds >= MINUTE) {
      const minutes = Math.floor(seconds / MINUTE);
      return `${minutes}m`;
    }
    
    // < 60 seconds: show seconds
    return `${seconds}s`;
  };

  const getPageLabel = (path: string) => {
    const labels: Record<string, string> = {
      // User side
      '/': 'หน้าหลัก',
      '/summary-behavior': 'สรุปอุปนิสัย',
      '/summary-nap': 'สรุปการนอน',
      '/summary-excretion': 'สรุปการขับถ่าย',
      '/summary-food-milk': 'สรุปอาหาร-นม',
      // Admin side
      '/admin': 'Admin Dashboard',
      '/admin/analytics': 'Analytics',
      '/admin/children': 'จัดการเด็ก',
      '/admin/cohorts': 'จัดการกลุ่ม',
      '/admin/enrollments': 'จัดการลงทะเบียน',
      '/admin/daily': 'บันทึกรายวัน',
      '/admin/attendance': 'การเข้าเรียน',
      '/admin/reports': 'รายงาน',
      '/admin/behaviors': 'อุปนิสัย',
      '/admin/users': 'จัดการผู้ใช้',
      '/admin/holidays': 'วันหยุด',
      '/admin/database': 'Database',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A2E', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={22} color="#6366f1" />
              Analytics Dashboard
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
              {selectedUserId 
                ? `สถิติการใช้งานของ: ${(stats?.topActiveUsers ?? []).find(u => u.user_id === selectedUserId)?.display_name || 'ผู้ใช้'}`
                : 'สถิติการใช้งานระบบทั้งหมด'
              }
            </p>
          </div>
          {selectedUserId && (
            <button 
              className="btn btn-sm"
              onClick={() => setSelectedUserId(null)}
              style={{ 
                background: '#f3f4f6', 
                color: '#6b7280', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontWeight: 500
              }}
            >
              <X size={14} />
              ดูทั้งหมด
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} color="#6366f1" />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>ผู้ใช้งานทั้งหมด</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                  {stats?.topActiveUsers?.length ?? 0}
                </p>
              </div>
            </div>
            {/* User names list */}
            {(stats?.topActiveUsers?.length ?? 0) > 0 && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(stats?.topActiveUsers ?? []).slice(0, 10).map((user, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        console.log('Clicked user:', user);
                        console.log('Setting selectedUserId to:', user.user_id);
                        setSelectedUserId(user.user_id);
                      }}
                      style={{ 
                        fontSize: '0.7rem', 
                        background: selectedUserId === user.user_id ? '#e0e7ff' : '#f8fafc', 
                        color: selectedUserId === user.user_id ? '#6366f1' : '#64748b',
                        padding: '4px 8px', 
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: selectedUserId === user.user_id ? '1px solid #6366f1' : '1px solid transparent',
                        transition: 'all 0.2s',
                        fontWeight: selectedUserId === user.user_id ? 600 : 400
                      }}
                      onMouseEnter={(e) => {
                        if (selectedUserId !== user.user_id) {
                          e.currentTarget.style.background = '#f1f5f9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedUserId !== user.user_id) {
                          e.currentTarget.style.background = '#f8fafc';
                        }
                      }}
                      title={`${user.activity_count} activities - Click to view analytics`}
                    >
                      {user.display_name}
                    </div>
                  ))}
                  {(stats?.topActiveUsers?.length ?? 0) > 10 && (
                    <div style={{ 
                      fontSize: '0.7rem', 
                      color: '#94a3b8',
                      padding: '4px 8px', 
                      fontStyle: 'italic'
                    }}>
                      +{(stats?.topActiveUsers?.length ?? 0) - 10} คนอื่นๆ
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Show these cards only when user is selected */}
          {selectedUserId && (
            <>
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={24} color="#10b981" />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>การเข้าชมทั้งหมด</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                      {userActivities.filter(a => a.event_type === 'page_view').length}
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
                      {userActivities.filter(a => a.event_type === 'click').length}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>


        {/* Grid Layout: Most Clicked & Top Users */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          
          {/* Top Active Users */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#10b981" />
                <span>ผู้ใช้งานที่ Active มากที่สุด</span>
              </div>
            </div>
            <div style={{ padding: '0', maxHeight: '400px', overflowY: 'auto' }}>
              {(stats?.topActiveUsers ?? []).slice(0, 15).map((user, idx) => (
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

          {/* Most Clicked Elements - Show only when user is selected */}
          {selectedUserId && (
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MousePointer size={18} color="#f59e0b" />
                  <span>องค์ประกอบที่คลิกมากที่สุด</span>
                </div>
              </div>
              <div style={{ padding: '0', maxHeight: '400px', overflowY: 'auto' }}>
                {userActivities
                  .filter(a => a.event_type === 'click' && a.element_label)
                  .reduce((acc: any[], activity) => {
                    const existing = acc.find(item => 
                      item.element_label === activity.element_label && 
                      item.page_path === activity.page_path
                    );
                    if (existing) {
                      existing.count++;
                    } else {
                      acc.push({
                        element_label: activity.element_label,
                        element_type: activity.element_type,
                        page_path: activity.page_path,
                        count: 1
                      });
                    }
                    return acc;
                  }, [])
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 15)
                  .map((elem, idx) => (
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
                          {elem.count}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                          คลิก
                        </div>
                      </div>
                    </div>
                  ))}
                {userActivities.filter(a => a.event_type === 'click' && a.element_label).length === 0 && (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    ยังไม่มีข้อมูลการคลิก
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* User Activity Timeline */}
        {selectedUserId && (
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MousePointer size={18} color="#3b82f6" />
                <span>
                  กิจกรรมของ: {(stats?.topActiveUsers ?? []).find(u => u.user_id === selectedUserId)?.display_name}
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
                        icon = (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5C7 5 2.73 8.11 1 12.5 2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="#6366f1"/>
                            <circle cx="12" cy="12.5" r="3" fill="#6366f1"/>
                          </svg>
                        );
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
