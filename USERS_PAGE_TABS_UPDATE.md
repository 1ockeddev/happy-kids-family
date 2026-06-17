# Users Page - Tabs & Last Activity Update

## 📋 Overview
อัพเดท `/admin/users` ให้มี:
1. **Tabs แยกตาม Role**: ทั้งหมด, ครู, ผู้ปกครอง, Admin
2. **Last Activity Column**: แสดงวันเวลาการเข้าใช้งานล่าสุด

---

## 🎯 Features

### 1. Role Tabs
แยก tabs ตาม role พร้อมจำนวนผู้ใช้:
- 📋 **ทั้งหมด** - แสดงทุก role
- 👨‍🏫 **ครู** - แสดงเฉพาะ teachers
- 👨‍👩‍👧 **ผู้ปกครอง** - แสดงเฉพาะ parents
- ⚙️ **Admin** - แสดงเฉพาะ admins

### 2. Last Activity Tracking
แสดงเวลาการเข้าใช้งานล่าสุดของแต่ละ user:
- 🟢 **เมื่อสักครู่** - < 1 นาที (สีเขียว)
- 🟢 **X นาทีที่แล้ว** - < 1 ชั่วโมง (สีเขียว)
- 🟡 **X ชั่วโมงที่แล้ว** - < 1 วัน (สีเหลือง)
- ⚫ **X วันที่แล้ว** - < 1 สัปดาห์ (สีเทา)
- ⚫ **วันที่** - > 1 สัปดาห์ (แสดงวันที่เต็ม)
- ⚫ **ไม่เคยใช้งาน** - ไม่มีข้อมูล

---

## 🛠️ Changes Made

### 1. API Update (`app/api/users/route.ts`)
เพิ่ม last_activity จาก user_analytics table:

```typescript
SELECT u.*,
  CASE WHEN tp.user_id IS NOT NULL THEN
    json_build_object(...)
  ELSE NULL END AS permissions,
  (SELECT MAX(timestamp) FROM user_analytics WHERE user_id = u.id) AS last_activity
FROM app_user u
LEFT JOIN teacher_permission tp ON tp.user_id = u.id
...
```

**การทำงาน:**
- ดึง timestamp ล่าสุดจาก `user_analytics` table
- Join กับ `app_user` ผ่าน `user_id`
- Return เป็น `last_activity` field

### 2. Users Page Update (`app/admin/users/page.tsx`)

#### Interface Update
```typescript
interface UserWithChildren extends AppUser {
  children?: Child[];
  last_activity?: string | null; // เพิ่ม field นี้
}
```

#### Tabs State
```typescript
const [activeTab, setActiveTab] = useState<'all' | 'teacher' | 'parent' | 'admin'>('all');
```

#### Data Filtering
```typescript
// กรองข้อมูลตาม tab
const filteredData = data.filter(u => {
  if (activeTab === 'all') return true;
  return u.role === activeTab;
});

// นับจำนวนแต่ละ role
const counts = {
  all: data.length,
  teacher: data.filter(u => u.role === 'teacher').length,
  parent: data.filter(u => u.role === 'parent').length,
  admin: data.filter(u => u.role === 'admin').length,
};
```

#### Format Last Activity
```typescript
const formatLastActivity = (timestamp: string | null | undefined) => {
  if (!timestamp) return <span style={{ color: '#9CA3AF' }}>ไม่เคยใช้งาน</span>;
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return <span style={{ color: '#10B981' }}>เมื่อสักครู่</span>;
  if (diffMins < 60) return <span style={{ color: '#10B981' }}>{diffMins} นาทีที่แล้ว</span>;
  if (diffHours < 24) return <span style={{ color: '#F59E0B' }}>{diffHours} ชั่วโมงที่แล้ว</span>;
  if (diffDays < 7) return <span style={{ color: '#9CA3AF' }}>{diffDays} วันที่แล้ว</span>;
  
  return <span style={{ color: '#9CA3AF' }}>
    {date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
  </span>;
};
```

#### Tabs UI
```tsx
<div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '0 20px' }}>
  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
    {[
      { key: 'all', label: 'ทั้งหมด', icon: '📋', count: counts.all },
      { key: 'teacher', label: 'ครู', icon: '👨‍🏫', count: counts.teacher },
      { key: 'parent', label: 'ผู้ปกครอง', icon: '👨‍👩‍👧', count: counts.parent },
      { key: 'admin', label: 'Admin', icon: '⚙️', count: counts.admin },
    ].map(tab => (
      <button
        key={tab.key}
        onClick={() => setActiveTab(tab.key)}
        style={{
          padding: '14px 20px',
          border: 'none',
          background: 'transparent',
          borderBottom: activeTab === tab.key ? '3px solid #6366f1' : '3px solid transparent',
          color: activeTab === tab.key ? '#6366f1' : '#64748b',
          fontWeight: activeTab === tab.key ? 600 : 400,
          // ... more styles
        }}
      >
        <span>{tab.icon}</span>
        <span>{tab.label}</span>
        <span style={{ 
          background: activeTab === tab.key ? '#e0e7ff' : '#f1f5f9',
          color: activeTab === tab.key ? '#4338ca' : '#64748b',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600
        }}>
          {tab.count}
        </span>
      </button>
    ))}
  </div>
</div>
```

#### New Column
```typescript
{ 
  key: 'last_activity', 
  label: 'ใช้งานล่าสุด', 
  hideOnMobile: true, 
  render: r => formatLastActivity(r.last_activity) 
},
```

#### Use Filtered Data
```typescript
<CrudTable<UserWithChildren>
  // ...
  data={filteredData} // เปลี่ยนจาก data เป็น filteredData
  // ...
/>
```

---

## 🎨 UI/UX Features

### Tab Design
- **Active Tab**: Border bottom สีน้ำเงิน, font bold, สีน้ำเงิน
- **Inactive Tab**: ไม่มี border, font normal, สีเทา
- **Badge Count**: แสดงจำนวนใน badge สีต่างกันตาม active state
- **Hover Effect**: เปลี่ยนสีเมื่อ hover
- **Mobile**: Scroll horizontal ได้

### Last Activity Colors
```
< 1 hour:    🟢 Green (#10B981)  - Active users
1-24 hours:  🟡 Orange (#F59E0B) - Recent users  
> 24 hours:  ⚫ Gray (#9CA3AF)   - Inactive users
Never:       ⚫ Gray (#9CA3AF)   - No activity
```

### Mobile Responsive
- Tabs scroll horizontal บนมือถือ
- Last Activity column ซ่อนบนมือถือ (hideOnMobile: true)
- Touch-friendly button sizes

---

## 📊 Data Source

### user_analytics Table
Activity tracking มาจาก table `user_analytics`:
```sql
CREATE TABLE user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_user(id),
  timestamp TIMESTAMP DEFAULT NOW(),
  event_type TEXT, -- 'page_view', 'click', 'navigation'
  page_path TEXT,
  element_type TEXT,
  element_label TEXT,
  ...
);
```

**Data Flow:**
1. User ใช้งานระบบ → บันทึกลง `user_analytics`
2. API `/api/users` ดึง `MAX(timestamp)` สำหรับแต่ละ user
3. Frontend แสดงเวลาล่าสุดในรูปแบบที่อ่านง่าย

---

## 🚀 How to Use

### 1. Navigate to Users Page
```
/admin/users
```

### 2. Select Tab
- คลิก "ทั้งหมด" → ดู users ทุกคน
- คลิก "ครู" → ดูเฉพาะครู
- คลิก "ผู้ปกครอง" → ดูเฉพาะผู้ปกครอง
- คลิก "Admin" → ดูเฉพาะ admin

### 3. View Last Activity
- ดูคอลัมน์ "ใช้งานล่าสุด"
- สีเขียว = ใช้งานเร็วๆ นี้
- สีเหลือง/เทา = นานแล้ว
- "ไม่เคยใช้งาน" = ยังไม่เคยเข้าระบบ

### 4. Filter & Search
- Search bar ทำงานปกติ (ค้นหาชื่อ, LINE ID)
- รวมกับ tab filtering ได้

---

## 💡 Use Cases

### 1. ติดตามการใช้งาน
- ดูว่าครูเข้าใช้งานเมื่อไหร่
- เช็คว่าผู้ปกครองเปิด Mini App หรือยง
- หา inactive users

### 2. User Management
- ลบ users ที่ไม่ใช้งานนานๆ
- ติดต่อ users ที่ไม่เคยเข้าใช้
- Monitor admin activity

### 3. Analytics
- นับจำนวน active users ในแต่ละ role
- ดู engagement rate
- วิเคราะห์ usage patterns

---

## ⚠️ Important Notes

### 1. Analytics Tracking Required
- Last activity อ้างอิงจาก `user_analytics` table
- ถ้าไม่มี analytics tracking → แสดง "ไม่เคยใช้งาน"
- ต้องมี `useAnalytics()` hook ใน user-side pages

### 2. Super Admin Hidden
- Super admin users ถูกกรองออก (ไม่แสดงใน UI)
- นับใน "ทั้งหมด" แต่ไม่มี tab แยก
- Last activity ยังถูกบันทึกปกติ

### 3. Performance
- Query ใช้ `MAX(timestamp)` → มี index ที่ `user_analytics(user_id, timestamp)`
- แนะนำสร้าง index:
  ```sql
  CREATE INDEX idx_user_analytics_user_timestamp 
  ON user_analytics(user_id, timestamp DESC);
  ```

### 4. Time Display
- ใช้ client-side time → แสดงตาม timezone ของ user
- Relative time (X นาทีที่แล้ว) update เมื่อรีเฟรชหน้า
- ไม่มี real-time update (ต้อง refresh manually)

---

## 🔮 Future Enhancements

### Possible Features:
1. **Real-time Updates**: WebSocket สำหรับ live activity
2. **Activity Chart**: กราฟแสดง usage trends
3. **Export**: Export user list พร้อม last activity
4. **Bulk Actions**: เลือกหลาย users พร้อมกัน
5. **Activity Details**: คลิกดูรายละเอียด activities
6. **Notifications**: แจ้งเตือนเมื่อ user ออนไลน์
7. **Activity Score**: คำนวณ engagement score
8. **Comparison**: เปรียบเทียบ activity ระหว่าง roles

---

## ✅ Testing Checklist

- [ ] Tabs แสดงถูกต้อง พร้อมนับจำนวน
- [ ] คลิก tab แล้วกรองข้อมูลถูกต้อง
- [ ] Last activity แสดงเวลาที่ถูกต้อง
- [ ] สีของ last activity ถูกต้องตามช่วงเวลา
- [ ] "ไม่เคยใช้งาน" แสดงสำหรับ users ที่ไม่มี activity
- [ ] Search ทำงานร่วมกับ tab filtering
- [ ] Mobile responsive (tabs scroll ได้)
- [ ] Super admin ไม่แสดงใน list
- [ ] Performance ดี (query ไม่ช้า)
- [ ] Build ผ่านไม่มี errors

---

## 📚 Related Files

### Modified Files:
- `app/api/users/route.ts` - เพิ่ม last_activity query
- `app/admin/users/page.tsx` - เพิ่ม tabs และ column

### Related Files:
- `lib/useAnalytics.ts` - User-side analytics tracking
- `lib/useAdminAnalytics.ts` - Admin-side analytics tracking
- `app/api/analytics/route.ts` - Analytics API
- Database: `user_analytics` table

### Documentation:
- `USERS_PAGE_TABS_UPDATE.md` - This file
- `ACTIVITY_LOG_IMPLEMENTATION.md` - Analytics system docs
- `ROLE_HIERARCHY_IMPLEMENTATION.md` - Role system docs

---

**Implementation Date**: June 17, 2026  
**Version**: 1.0.0  
**Status**: ✅ Complete
