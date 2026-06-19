'use client';
import { useState, useEffect } from 'react';
import './styles.css';

interface LineGroup {
  id: string;
  line_group_id: string;
  group_name: string;
  group_type: string;
  status: string;
  picture_url: string | null;
  joined_at: string;
  left_at: string | null;
  member_count: number;
  event_count: number;
}

interface GroupMember {
  id: string;
  line_user_id: string;
  display_name: string;
  picture_url: string | null;
  role: string;
  joined_at: string;
  left_at: string | null;
  status: string;
  app_user_id: string | null;
  app_user_role: string | null;
}

interface GroupEvent {
  id: string;
  line_user_id: string | null;
  event_type: string;
  message_type: string | null;
  message_text: string | null;
  message_data: any;
  created_at: string;
  user_display_name: string | null;
}

export default function LineGroupsPage() {
  const [activeTab, setActiveTab] = useState<'groups' | 'members' | 'events'>('groups');
  const [groups, setGroups] = useState<LineGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<LineGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadGroups();
  }, [statusFilter]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/line/groups?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (group: LineGroup) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/line/groups/${group.line_group_id}/members?status=all`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async (group: LineGroup) => {
    setLoading(true);
    try {
      const eventParam = eventTypeFilter !== 'all' ? `&eventType=${eventTypeFilter}` : '';
      const res = await fetch(`/api/line/groups/${group.line_group_id}/events?limit=50${eventParam}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectGroup = async (group: LineGroup) => {
    setSelectedGroup(group);
    setActiveTab('members');
    await loadMembers(group);
  };

  const viewEvents = async (group: LineGroup) => {
    setSelectedGroup(group);
    setActiveTab('events');
    await loadEvents(group);
  };

  useEffect(() => {
    if (selectedGroup && activeTab === 'events') {
      loadEvents(selectedGroup);
    }
  }, [eventTypeFilter]);

  return (
    <div className="line-groups-container">
      <div className="page-header">
        <h1>👥 LINE Groups</h1>
        <p>จัดการกลุ่มและสมาชิกที่บอท Happy Kids เข้าร่วม</p>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          📱 กลุ่มทั้งหมด
        </button>
        <button 
          className={`tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => selectedGroup && setActiveTab('members')}
          disabled={!selectedGroup}
        >
          👥 สมาชิก {selectedGroup && `(${selectedGroup.group_name})`}
        </button>
        <button 
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => selectedGroup && setActiveTab('events')}
          disabled={!selectedGroup}
        >
          📋 Events {selectedGroup && `(${selectedGroup.group_name})`}
        </button>
      </div>

      {activeTab === 'groups' && (
        <div className="tab-content">
          <div className="card">
            <div className="card-header">
              <h2>กลุ่มที่บอทเข้าร่วม</h2>
              <div className="filter-group">
                <label>สถานะ:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="filter-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="all">ทั้งหมด</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading">กำลังโหลด...</div>
            ) : groups.length === 0 ? (
              <div className="empty-state">
                ยังไม่มีกลุ่มใดๆ<br />
                <small>เชิญบอทเข้ากลุ่ม LINE เพื่อเริ่มต้นใช้งาน</small>
              </div>
            ) : (
              <div className="groups-grid">
                {groups.map(group => (
                  <div key={group.id} className={`group-card ${group.status}`}>
                    <div className="group-header">
                      {group.picture_url && (
                        <img src={group.picture_url} alt={group.group_name} className="group-avatar" />
                      )}
                      <div className="group-info">
                        <h3>{group.group_name}</h3>
                        <p className="group-id">{group.line_group_id}</p>
                      </div>
                      <span className={`status-badge ${group.status}`}>
                        {group.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>

                    <div className="group-stats">
                      <div className="stat">
                        <span className="stat-label">สมาชิก</span>
                        <span className="stat-value">{group.member_count}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Events</span>
                        <span className="stat-value">{group.event_count}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">เข้าร่วม</span>
                        <span className="stat-value">
                          {new Date(group.joined_at).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                    </div>

                    <div className="group-actions">
                      <button
                        onClick={() => selectGroup(group)}
                        className="btn btn-sm btn-primary"
                      >
                        👥 ดูสมาชิก
                      </button>
                      <button
                        onClick={() => viewEvents(group)}
                        className="btn btn-sm"
                      >
                        📋 ดู Events
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'members' && selectedGroup && (
        <div className="tab-content">
          <div className="card">
            <div className="card-header">
              <div>
                <h2>สมาชิกในกลุ่ม</h2>
                <p className="group-subtitle">{selectedGroup.group_name}</p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('groups');
                  setSelectedGroup(null);
                }}
                className="btn btn-sm"
              >
                ← กลับ
              </button>
            </div>

            {loading ? (
              <div className="loading">กำลังโหลด...</div>
            ) : members.length === 0 ? (
              <div className="empty-state">ยังไม่มีข้อมูลสมาชิก</div>
            ) : (
              <div className="members-list">
                {members.map(member => (
                  <div key={member.id} className={`member-card ${member.status}`}>
                    <div className="member-header">
                      {member.picture_url && (
                        <img src={member.picture_url} alt={member.display_name} className="member-avatar" />
                      )}
                      <div className="member-info">
                        <h3>
                          {member.display_name}
                          {member.app_user_id && <span className="registered-badge">✓ ลงทะเบียน</span>}
                        </h3>
                        <p className="member-id">{member.line_user_id}</p>
                        {member.app_user_role && (
                          <p className="member-role">บทบาท: {member.app_user_role}</p>
                        )}
                      </div>
                      <span className={`status-badge ${member.status}`}>
                        {member.status === 'active' ? '🟢 Active' : '🔴 Left'}
                      </span>
                    </div>

                    <div className="member-meta">
                      <span>เข้าร่วม: {new Date(member.joined_at).toLocaleString('th-TH')}</span>
                      {member.left_at && (
                        <span>ออก: {new Date(member.left_at).toLocaleString('th-TH')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'events' && selectedGroup && (
        <div className="tab-content">
          <div className="card">
            <div className="card-header">
              <div>
                <h2>Events Log</h2>
                <p className="group-subtitle">{selectedGroup.group_name}</p>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="filter-group">
                  <label>ประเภท:</label>
                  <select
                    value={eventTypeFilter}
                    onChange={(e) => setEventTypeFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="message">Messages</option>
                    <option value="memberJoined">Member Joined</option>
                    <option value="memberLeft">Member Left</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('groups');
                    setSelectedGroup(null);
                  }}
                  className="btn btn-sm"
                >
                  ← กลับ
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading">กำลังโหลด...</div>
            ) : events.length === 0 ? (
              <div className="empty-state">ยังไม่มี events</div>
            ) : (
              <div className="events-list">
                {events.map(event => (
                  <div key={event.id} className="event-card">
                    <div className="event-header">
                      <span className={`event-type ${event.event_type}`}>
                        {event.event_type === 'message' && '💬'}
                        {event.event_type === 'memberJoined' && '➕'}
                        {event.event_type === 'memberLeft' && '➖'}
                        {' '}
                        {event.event_type}
                      </span>
                      <span className="event-time">
                        {new Date(event.created_at).toLocaleString('th-TH')}
                      </span>
                    </div>

                    <div className="event-content">
                      {event.user_display_name && (
                        <p className="event-user">👤 {event.user_display_name}</p>
                      )}
                      {event.message_text && (
                        <p className="event-message">{event.message_text}</p>
                      )}
                      {event.message_type && event.message_type !== 'text' && (
                        <p className="event-media">📎 {event.message_type}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
