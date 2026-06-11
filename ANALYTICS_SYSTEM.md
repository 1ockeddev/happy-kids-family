# Analytics System

## Overview
ระบบ Analytics ติดตามพฤติกรรมการใช้งานของ User (Parent/Teacher) อย่างละเอียด เพื่อนำมาวิเคราะห์และปรับปรุงประสบการณ์การใช้งาน

## ✅ Setup Complete

### 1. Database
- ✅ ตาราง `user_analytics` ถูกสร้างแล้ว
- ✅ Indexes ทั้งหมดพร้อมใช้งาน
- ✅ Migration: `db/migrations/011_create_user_analytics.sql`

### 2. API Endpoints
- ✅ `POST /api/analytics` - บันทึก event (user side)
- ✅ `GET /api/analytics` - ดึงข้อมูล raw (admin only)
- ✅ `GET /api/analytics/stats` - ดึงสถิติแบบ aggregated (admin only)

### 3. User Side Tracking
- ✅ Auto-tracking ผ่าน `useAnalytics()` hook
- ✅ รองรับทั้ง LINE user และ Admin session
- ✅ ติดตาม: page views, navigation, clicks, duration

### 4. Admin Dashboard
- ✅ หน้า `/admin/analytics` พร้อมใช้งาน
- ✅ แสดงสถิติครบถ้วน
- ✅ Filter by date range

## 📊 Data Collected

### Auto-tracked Events
1. **Page Views**
   - หน้าไหนที่ผู้ใช้เข้าชม
   - ระยะเวลาที่อยู่ในแต่ละหน้า
   - จำนวนครั้งที่เข้าชม

2. **Navigation**
   - เส้นทางการเดินทาง (from → to)
   - รูปแบบการใช้งาน
   - Flow ของ user journey

3. **Session Data**
   - Session ID (unique per browser session)
   - Device info (viewport size)
   - User agent (browser/device type)

### Manual Tracking (Optional)
```typescript
import { useAnalytics } from '@/lib/useAnalytics';

const { trackClick } = useAnalytics();

// ติดตามการคลิกปุ่ม
<button onClick={() => {
  trackClick('button', 'View Summary Behavior');
  // ... your logic
}}>
  ดูสรุปอุปนิสัย
</button>
```

## 📈 Admin Dashboard Features

### Available Stats
1. **Most Visited Pages**
   - หน้าที่เข้าชมมากที่สุด
   - จำนวนครั้ง + ผู้ใช้ที่ไม่ซ้ำ
   - ระยะเวลาเฉลี่ยในแต่ละหน้า

2. **Most Clicked Elements**
   - องค์ประกอบที่ถูกคลิกมากที่สุด
   - ปุ่มไหนได้รับความสนใจ
   - จำนวนผู้ใช้ที่คลิก

3. **Navigation Patterns**
   - รูปแบบการเดินทางระหว่างหน้า
   - เส้นทางที่ user มักใช้
   - Flow ที่พบบ่อย

4. **Top Active Users**
   - ผู้ใช้ที่ใช้งานมากที่สุด
   - จำนวน events ทั้งหมด
   - เวลาที่ใช้งานรวม

5. **Daily Activity**
   - กิจกรรมรายวัน (30 วันล่าสุด)
   - จำนวน active users
   - Page views และ clicks

6. **Hourly Pattern**
   - รูปแบบการใช้งานตามชั่วโมง
   - ช่วงเวลาที่มี traffic มาก

## 🚀 Usage

### User Side (Automatic)
Analytics จะทำงานอัตโนมัติเมื่อ user เข้าใช้งานผ่าน UserLayout:

```typescript
// components/UserLayout.tsx
import { useAnalytics } from '@/lib/useAnalytics';

export default function UserLayout({ children }) {
  useAnalytics(); // ← เรียกใช้ครั้งเดียว
  // ...
}
```

### Admin Side
เข้าดูสถิติที่:
- URL: `/admin/analytics`
- Menu: Admin Sidebar → Analytics

### Manual Tracking Example
```typescript
// Example: Track button clicks
const { trackClick } = useAnalytics();

// ปุ่มดูสรุป
<button onClick={() => {
  trackClick('button', 'View Summary');
  router.push('/summary-behavior');
}}>
  ดูสรุป
</button>

// Tab switching
<div onClick={() => {
  trackClick('tab', 'Switch to Daily Report');
  setActiveTab('daily');
}}>
  รายงานรายวัน
</div>

// Link clicks
<Link href="/summary-nap" onClick={() => {
  trackClick('link', 'Go to Nap Summary');
}}>
  สรุปการนอน
</Link>
```

## 🔒 Security & Privacy

### Authentication
- User Side: ใช้ LINE user_id ผ่าน header `x-line-user-id`
- Admin Side: ใช้ session cookie
- ไม่มี auth = ไม่บันทึกข้อมูล

### Data Protection
- ไม่เก็บข้อมูลส่วนตัวที่ sensitive
- เก็บเฉพาะ pattern การใช้งาน
- Foreign key cascade delete (ลบ user = ลบ analytics)

### Performance
- Silent fail: error ใน tracking ไม่ทำให้ app พัง
- Async tracking: ไม่ block UI
- Indexes ครบถ้วน: query เร็ว

## 📋 Database Schema

### Table: `user_analytics`
```sql
id                UUID PRIMARY KEY
user_id           UUID (FK → app_user)
event_type        VARCHAR(50)  -- 'page_view', 'click', 'navigation'
page_path         VARCHAR(255)
from_path         VARCHAR(255)
to_path           VARCHAR(255)
element_type      VARCHAR(100)
element_label     VARCHAR(255)
duration_seconds  INTEGER
timestamp         TIMESTAMPTZ
session_id        VARCHAR(100)
user_agent        TEXT
viewport_width    INTEGER
viewport_height   INTEGER
created_at        TIMESTAMPTZ
```

### Indexes
- `user_id` - query by user
- `timestamp` - sort by time
- `event_type` - filter by event
- `page_path` - filter by page
- `session_id` - group by session
- `(user_id, timestamp)` - composite for common queries

## 🛠️ Development

### Run Migration
```bash
node scripts/run-migration-011.js
```

### Verify Table
```bash
node scripts/verify-analytics-table.js
```

### Build Check
```bash
npm run build
```

## 📝 Next Steps

### Suggested Manual Tracking Points
1. **Bottom Navigation Clicks**
   ```typescript
   <button onClick={() => {
     trackClick('bottom-nav', 'Go to Daily Report');
     router.push('/');
   }}>
   ```

2. **Summary Cards**
   ```typescript
   <div onClick={() => {
     trackClick('card', 'Open Behavior Summary');
     router.push('/summary-behavior');
   }}>
   ```

3. **Tab Switches**
   ```typescript
   setActiveTab(tab);
   trackClick('tab', `Switch to ${tab}`);
   ```

4. **Form Submissions** (Admin)
   ```typescript
   trackClick('form', 'Submit New Daily Report');
   ```

5. **Export/Download Actions**
   ```typescript
   trackClick('action', 'Export Data');
   ```

### Analytics Enhancements
1. **Custom Events**
   - เพิ่ม event types ใหม่ตามความต้องการ
   - เช่น: 'form_submit', 'download', 'error'

2. **User Segmentation**
   - แยกสถิติตาม role (parent vs teacher)
   - แยกตาม cohort
   - แยกตามช่วงเวลา

3. **Real-time Dashboard**
   - Live activity feed
   - WebSocket updates
   - Alert system

4. **Advanced Analytics**
   - Funnel analysis
   - Retention metrics
   - User cohort analysis
   - A/B testing support

## 🎯 Key Metrics to Watch

1. **Engagement**
   - Average session duration
   - Pages per session
   - Return rate

2. **Popular Features**
   - Most used pages
   - Most clicked buttons
   - Common workflows

3. **Pain Points**
   - Pages with short duration (user left quickly)
   - Navigation dead-ends
   - Error patterns

4. **User Behavior**
   - Peak usage hours
   - Common user journeys
   - Feature adoption rate

## 🔍 Troubleshooting

### Analytics Not Tracking
1. Check user is authenticated (LINE or Admin)
2. Check console for errors
3. Verify `useAnalytics()` is called in UserLayout
4. Check API endpoint `/api/analytics` returns 201

### Admin Dashboard Empty
1. Generate some traffic on user side first
2. Check date filter
3. Verify admin is logged in
4. Check `/api/analytics/stats` returns data

### Build Errors
```bash
# Clean and rebuild
rm -rf .next
npm run build
```

## 📚 Resources

- Database migration: `db/migrations/011_create_user_analytics.sql`
- API routes: `app/api/analytics/`
- Hook: `lib/useAnalytics.ts`
- Admin page: `app/admin/analytics/page.tsx`
- Scripts: `scripts/run-migration-011.js`, `scripts/verify-analytics-table.js`
