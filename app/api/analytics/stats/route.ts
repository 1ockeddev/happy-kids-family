import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Retrieve aggregated analytics stats (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');

    let dateFilter = '';
    const params: any[] = [];

    if (date_from) {
      params.push(date_from);
      dateFilter += ` AND timestamp >= $${params.length}`;
    }

    if (date_to) {
      params.push(date_to);
      dateFilter += ` AND timestamp <= $${params.length}`;
    }

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

    // 5. User engagement (top active users)
    const topActiveUsers = await query(
      `SELECT 
        u.id,
        u.display_name,
        u.role,
        COUNT(*) as total_events,
        SUM(CASE WHEN a.event_type = 'page_view' THEN 1 ELSE 0 END) as page_views,
        SUM(CASE WHEN a.event_type = 'click' THEN 1 ELSE 0 END) as clicks,
        SUM(a.duration_seconds) as total_time_seconds,
        MAX(a.timestamp) as last_active
      FROM user_analytics a
      JOIN app_user u ON u.id = a.user_id
      WHERE 1=1 ${dateFilter}
      GROUP BY u.id, u.display_name, u.role
      ORDER BY total_events DESC
      LIMIT 20`,
      params
    );

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

    return NextResponse.json({
      mostVisitedPages,
      mostClickedElements,
      navigationPatterns,
      dailyActivity,
      topActiveUsers,
      avgDurationByPage,
      hourlyPattern,
    }, { status: 200 });
  } catch (error) {
    console.error('Analytics stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
