# Activity Log Implementation

## Overview
Implemented a comprehensive Activity Log table in the admin analytics page that shows which users accessed which pages, when they accessed them, and what actions they performed.

## What Was Added

### 1. New API Endpoint: `/api/analytics/recent`
**File**: `app/api/analytics/recent/route.ts`

- Fetches recent user activities from all users (admin only)
- Returns up to 100 most recent activities by default
- Supports date filtering (date_from, date_to)
- Joins with `app_user` table to get user display names and roles
- Includes all event types: page_view, click, navigation

**Response fields**:
- `user_id`, `display_name`, `line_display_name`, `role`
- `event_type`, `page_path`, `from_path`, `to_path`
- `element_type`, `element_label`
- `timestamp`

### 2. Updated Analytics Page
**File**: `app/admin/analytics/page.tsx`

**New State**:
```typescript
const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
const [loadingRecentActivities, setLoadingRecentActivities] = useState(true);
```

**New Function**:
```typescript
const fetchRecentActivities = async () => {
  // Fetches from /api/analytics/recent
  // Respects date filters
  // Displays up to 50 most recent activities
}
```

**Activity Log Table Features**:
- Shows timestamp (date + time) in Thai format
- Displays user name (display_name or line_display_name)
- Shows user role (ผู้ปกครอง/ครู/Admin)
- Event type with emoji indicators:
  - 👁️ เปิดหน้า (page_view)
  - 👆 คลิก (click)
  - 🔀 นำทาง (navigation)
- Page label (Thai translation of paths)
- Details column showing:
  - For clicks: element label/type
  - For navigation: from which page
- Clickable rows that select the user to view detailed timeline
- Hover effect for better UX

## How It Works

1. **On page load**: Fetches both stats and recent activities
2. **Date filter**: When user applies date filter, both stats and activities are refreshed
3. **Real-time tracking**: All user-side page views, clicks, and navigation are tracked via `usePageTracking()` hook
4. **Activity log display**: Shows the 50 most recent activities across all users
5. **Drill-down**: Clicking any row shows that user's detailed activity timeline

## User Flow

```
Admin visits /admin/analytics
  ↓
Activity Log Table loads automatically
  ↓
Shows recent activities from all users
  ↓
Admin can:
  - See who accessed what pages and when
  - Filter by date range
  - Click on any row to see detailed timeline for that user
  - See user side and admin side activities
```

## Technical Details

### Database Query
```sql
SELECT 
  a.*, 
  u.display_name, 
  u.line_display_name, 
  u.role
FROM user_analytics a
LEFT JOIN app_user u ON a.user_id = u.id
WHERE timestamp >= $date_from AND timestamp <= $date_to
ORDER BY timestamp DESC
LIMIT 50
```

### Event Types
- **page_view**: User opened a page
- **click**: User clicked an element (button, link, etc.)
- **navigation**: User navigated from one page to another

### Display Logic
- User name: `display_name` (admin-controlled) or fallback to `line_display_name`
- Role translation: parent → ผู้ปกครอง, teacher → ครู, admin → Admin
- Page translation: Uses `getPageLabel()` function for Thai labels
- Time format: Thai locale with short month names

## Benefits

1. **Visibility**: Admins can now see who is using the system
2. **Usage patterns**: Understand which pages are accessed most
3. **User engagement**: Track when users are active
4. **Troubleshooting**: Help users who report issues by checking their activity
5. **Data-driven decisions**: Make improvements based on actual usage data

## Related Files

- `app/admin/analytics/page.tsx` - Frontend UI
- `app/api/analytics/recent/route.ts` - Backend API for recent activities
- `app/api/analytics/route.ts` - Existing API for single user activities
- `app/api/analytics/stats/route.ts` - Stats aggregation API
- `lib/useAnalytics.ts` - Analytics tracking hooks (client-side)
- Database table: `user_analytics`

## Future Enhancements

Possible improvements:
1. Export activity log to CSV/Excel
2. More advanced filters (by role, by page, by event type)
3. Activity heatmap (time of day patterns)
4. Retention analysis (how often users return)
5. Session duration analysis
6. Real-time activity monitoring (WebSocket)
