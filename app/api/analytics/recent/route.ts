import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get recent user activities from all users (admin only)
export async function GET(req: NextRequest) {
  try {
    console.log('[Analytics Recent] Starting request...');
    
    const session = await getSessionFromRequest(req);
    
    if (!session) {
      console.log('[Analytics Recent] No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Analytics Recent] Session found:', session.username, 'role:', session.role);

    // Admin session doesn't have a user in database
    // Just verify role from session
    if (session.role !== 'admin') {
      console.log('[Analytics Recent] Not admin:', session.role);
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    console.log('[Analytics Recent] Admin authorized');

    const { searchParams } = new URL(req.url);
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '100');

    console.log('[Analytics Recent] Query params:', { date_from, date_to, limit });

    let sql = `
      SELECT 
        a.id,
        a.user_id,
        a.event_type,
        a.page_path,
        a.from_path,
        a.to_path,
        a.element_type,
        a.element_label,
        a.duration_seconds,
        a.timestamp,
        COALESCE(u.display_name, u.line_display_name) as display_name,
        u.line_display_name,
        u.role
      FROM user_analytics a
      LEFT JOIN app_user u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date_from) {
      params.push(date_from);
      sql += ` AND a.timestamp >= $${params.length}::date`;
    }

    if (date_to) {
      params.push(date_to);
      sql += ` AND a.timestamp <= ($${params.length}::date + interval '1 day')`;
    }

    sql += ` ORDER BY a.timestamp DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    console.log('[Analytics Recent] Executing query...');

    const data = await query(sql, params);

    console.log('[Analytics Recent] Query successful, rows:', data.length);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('[Analytics Recent] Error:', error.message || error);
    console.error('[Analytics Recent] Stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
