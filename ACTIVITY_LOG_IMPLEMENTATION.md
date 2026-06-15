# Activity Log Implementation

## Overview
Implemented a comprehensive Activity Log table in the admin analytics page that shows which users accessed which pages, when they accessed them, and what actions they performed. Now includes **both User-side and Admin-side tracking**.

## What Was Added

### 1. User-side Analytics Tracking
**Files**: 
- `lib/useAnalytics.ts` - Analytics hooks for user pages
- `app/api/analytics/route.ts` - API for tracking user activities

Tracks LINE-authenticated users on pages like `/`, `/summary-behavior`, etc.

### 2. Admin-side Analytics Tracking (NEW)
**Files**:
- `lib/useAdminAnalytics.ts` - Analytics hooks for admin pages
- `app/api/analytics/admin/route.ts` - API for tracking admin activities
- `app/admin/layout.tsx` - Added `useAdminPageTracking()` hook

Tracks session-authenticated admins/teachers on pages like `/admin/daily`, `/admin/children`, etc.

### 3. API Endpoint: `/api/analytics/recent`
**File**: `app/api/analytics/recent/route.ts`

- Fetches recent activities from **all users** (both user-side and admin-side)
- Returns up to 100 most recent activities by default
- Supports date filtering (date_from, date_to)
- Joins with `app_user` table to get user display names and roles
- Includes all event types: page_view, click, navigation

**Response fields**:
- `user_id`, `display_name`, `line_display_name`, `role`
- `event_type`, `page_path`, `from_path`, `to_path`
- `element_type`, `element_label`
- `timestamp`

### 4. Updated Analytics Page
**File**: `app/admin/analytics/page.tsx`

**New Features**:
- **Activity Filter Buttons**: ทั้งหมด / User Side / Admin Side
- **Side Column**: Shows whether activity is from User or Admin side (color-coded)
- **Enhanced Page Labels**: Includes Thai labels for all admin pages

**Activity Log Table Features**:
- Shows timestamp (date + time) in Thai format
- Displays user name (display_name or line_display_name)
- Shows user role (ผู้ปกครอง/ครู/Admin)
- **NEW: Side indicator** (User = green, Admin = red)
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
- **Filter by side**: Can view only User activities, only Admin activities, or all

## How It Works

### User-side Tracking
1. User opens Mini App (or dev mode with mocked LINE ID)
2. `usePageTracking()` hook in `(user)/layout.tsx` tracks all page views and navigation
3. Data sent to `/api/analytics` with LINE user ID in header
4. Stored in `user_analytics` table

### Admin-side Tracking
1. Admin/teacher logs in via session auth
2. `useAdminPageTracking()` hook in `admin/layout.tsx` tracks all page views and navigation
3. Data sent to `/api/analytics/admin` with session cookie
4. User identified from session, stored in same `user_analytics` table

### Activity Log Display
1. On page load: Fetches both stats and recent activities
2. Date filter: When user applies date filter, both stats and activities are refreshed
3. **Side filter**: Toggle between User Side, Admin Side, or All activities
4. Activity log display: Shows the 50 most recent activities across all users
5. Drill-down: Clicking any row shows that user's detailed activity timeline

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

**User-side Tracking**:
- `lib/useAnalytics.ts` - Analytics tracking hooks (client-side)
- `app/api/analytics/route.ts` - API for user analytics
- `app/(user)/layout.tsx` - Includes `usePageTracking()` hook

**Admin-side Tracking**:
- `lib/useAdminAnalytics.ts` - Admin analytics tracking hooks (client-side)
- `app/api/analytics/admin/route.ts` - API for admin analytics
- `app/admin/layout.tsx` - Includes `useAdminPageTracking()` hook

**Aggregation & Display**:
- `app/admin/analytics/page.tsx` - Frontend UI with filters
- `app/api/analytics/recent/route.ts` - Backend API for recent activities
- `app/api/analytics/stats/route.ts` - Stats aggregation API

**Database**: `user_analytics` table (stores both user and admin activities)

## Future Enhancements

Possible improvements:
1. Export activity log to CSV/Excel
2. More advanced filters (by role, by page, by event type)
3. Activity heatmap (time of day patterns)
4. Retention analysis (how often users return)
5. Session duration analysis
6. Real-time activity monitoring (WebSocket)
