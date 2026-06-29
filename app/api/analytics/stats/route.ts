import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Retrieve aggregated analytics stats (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    console.log('[Analytics Stats] Session:', session);
    
    if (!session || session.role !== 'admin') {
      console.log('[Analytics Stats] Unauthorized - session:', session);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const user_id = searchParams.get('user_id');

    console.log('[Analytics Stats] Filters:', { date_from, date_to, user_id });

    let dateFilter = '';
    const params: any[] = [];

    if (user_id) {
      params.push(user_id);
      dateFilter += ` AND user_id = $${params.length}`;
    }

    if (date_from) {
      params.push(date_from);
      dateFilter += ` AND timestamp >= $${params.length}`;
    }

    if (date_to) {
      params.push(date_to);
      dateFilter += ` AND timestamp <= $${params.length}`;
    }

    console.log('[Analytics Stats] Date filter:', dateFilter, 'Params:', params);

    // 1. Most visited pages
    const mostVisitedPages = await query(
      `SELECT 
        page_path,
        COUNT(*) as visit_count,
        AVG(duration_seconds) as avg_duration_seconds,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_analytics
      WHERE event_type = 'page_view' ${dateFilter}
      GROUP BY page_path
      ORDER BY visit_count DESC
      LIMIT 20`,
      params
    );
    console.log('[Analytics Stats] Most visited pages:', mostVisitedPages.length);

    // 2. Most clicked elements
    const mostClickedElements = await query(
      `SELECT 
        element_type,
        element_label,
        page_path,
        COUNT(*) as click_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_analytics
      WHERE event_type = 'click' ${dateFilter}
      GROUP BY element_type, element_label, page_path
      ORDER BY click_count DESC
      LIMIT 20`,
      params
    );
    console.log('[Analytics Stats] Most clicked elements:', mostClickedElements.length);

    // 3. User navigation patterns (from -> to)
    const navigationPatterns = await query(
      `SELECT 
        from_path,
        to_path,
        COUNT(*) as navigation_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_analytics
      WHERE event_type = 'navigation' AND from_path IS NOT NULL AND to_path IS NOT NULL ${dateFilter}
      GROUP BY from_path, to_path
      ORDER BY navigation_count DESC
      LIMIT 20`,
      params
    );
    console.log('[Analytics Stats] Navigation patterns:', navigationPatterns.length);

    // 4. Daily activity (last 30 days)
    const dailyActivity = await query(
      `SELECT 
        DATE(timestamp) as date,
        COUNT(*) as total_events,
        COUNT(DISTINCT user_id) as active_users,
        SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as page_views,
        SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) as clicks
      FROM user_analytics
      WHERE timestamp >= NOW() - INTERVAL '30 days' ${dateFilter}
      GROUP BY DATE(timestamp)
      ORDER BY date DESC`,
      params
    );
    console.log('[Analytics Stats] Daily activity:', dailyActivity.length);

    // 5. User engagement (top active users)
    // When filtering by user_id, still show all users but the stats will be for the selected user
    const topActiveUsersFilter = user_id ? '' : dateFilter; // Don't filter by user for the list
    const topActiveUsers = await query(
      `SELECT 
        u.id as user_id,
        u.display_name,
        u.role,
        COUNT(*) as activity_count,
        SUM(CASE WHEN a.event_type = 'page_view' THEN 1 ELSE 0 END) as page_views,
        SUM(CASE WHEN a.event_type = 'click' THEN 1 ELSE 0 END) as clicks,
        SUM(a.duration_seconds) as total_time_seconds,
        MAX(a.timestamp) as last_active,
        COUNT(*) as total_events
      FROM user_analytics a
      JOIN app_user u ON u.id = a.user_id
      WHERE 1=1 ${topActiveUsersFilter}
      GROUP BY u.id, u.display_name, u.role
      ORDER BY activity_count DESC
      LIMIT 20`,
      user_id ? [] : params
    );
    console.log('[Analytics Stats] Top active users:', topActiveUsers.length);

    // 6. Average session duration by page
    const avgDurationByPage = await query(
      `SELECT 
        page_path,
        AVG(duration_seconds) as avg_duration_seconds,
        MIN(duration_seconds) as min_duration_seconds,
        MAX(duration_seconds) as max_duration_seconds,
        COUNT(*) as sample_size
      FROM user_analytics
      WHERE event_type = 'page_view' AND duration_seconds IS NOT NULL ${dateFilter}
      GROUP BY page_path
      ORDER BY avg_duration_seconds DESC`,
      params
    );
    console.log('[Analytics Stats] Avg duration by page:', avgDurationByPage.length);

    // 7. Hourly activity pattern (all time)
    const hourlyPattern = await query(
      `SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        COUNT(*) as event_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_analytics
      WHERE 1=1 ${dateFilter}
      GROUP BY EXTRACT(HOUR FROM timestamp)
      ORDER BY hour`,
      params
    );
    console.log('[Analytics Stats] Hourly pattern:', hourlyPattern.length);

    const result = {
      mostVisitedPages,
      mostClickedElements,
      navigationPatterns,
      dailyActivity,
      topActiveUsers,
      avgDurationByPage,
      hourlyPattern,
    };

    console.log('[Analytics Stats] Returning result with', topActiveUsers.length, 'users');
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[Analytics Stats] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
