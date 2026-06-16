import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Helper: Get user from request (supports both admin session and LINE user_id)
async function getUserFromRequest(req: NextRequest) {
  // Try LINE user_id from header first
  const lineUserId = req.headers.get('x-line-user-id');
  if (lineUserId) {
    console.log('[Analytics API] LINE user ID:', lineUserId);
    const result = await query(
      `SELECT id, role, display_name FROM app_user WHERE line_user_id = $1 AND status = 'active' LIMIT 1`,
      [lineUserId]
    );
    if (result.length > 0) {
      console.log('[Analytics API] User found:', result[0].display_name, 'Role:', result[0].role);
      return result[0];
    }
    console.log('[Analytics API] User not found for LINE ID:', lineUserId);
  }

  // Try admin session (admin doesn't exist in database, use system user)
  const session = await getSessionFromRequest(req);
  if (session) {
    console.log('[Analytics API] Admin session found:', session.username);
    // Use admin system user
    const result = await query(
      `SELECT id, role, display_name FROM app_user WHERE line_user_id = 'admin_system' LIMIT 1`
    );
    if (result.length > 0) {
      console.log('[Analytics API] Using admin system user');
      return result[0];
    }
  }

  console.log('[Analytics API] No user found');
  return null;
}

// POST - Track analytics event
export async function POST(req: NextRequest) {
  try {
    console.log('[Analytics API POST] Incoming request');
    const user = await getUserFromRequest(req);
    if (!user) {
      console.log('[Analytics API POST] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Analytics API POST] User authorized:', user.display_name);

    const body = await req.json();
    const {
      event_type,
      page_path,
      from_path,
      to_path,
      element_type,
      element_label,
      duration_seconds,
      session_id,
      user_agent,
      viewport_width,
      viewport_height,
    } = body;

    console.log('[Analytics API POST] Event:', event_type, 'Page:', page_path);

    // Validate required fields
    if (!event_type || !page_path) {
      return NextResponse.json(
        { error: 'event_type and page_path are required' },
        { status: 400 }
      );
    }

    // Insert analytics event
    const result = await query(
      `INSERT INTO user_analytics (
        user_id, event_type, page_path, from_path, to_path,
        element_type, element_label, duration_seconds, session_id,
        user_agent, viewport_width, viewport_height
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [
        user.id,
        event_type,
        page_path,
        from_path || null,
        to_path || null,
        element_type || null,
        element_label || null,
        duration_seconds || null,
        session_id || null,
        user_agent || null,
        viewport_width || null,
        viewport_height || null,
      ]
    );

    console.log('[Analytics API POST] Event saved, ID:', result[0].id);
    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 });
  } catch (error: any) {
    console.error('[Analytics API POST] Error:', error.message || error);
    console.error('[Analytics API POST] Stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Retrieve analytics data (admin only)
export async function GET(req: NextRequest) {
  try {
    // Check for admin session first
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');
    const event_type = searchParams.get('event_type');
    const page_path = searchParams.get('page_path');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '1000');

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
        a.session_id,
        a.user_agent,
        a.viewport_width,
        a.viewport_height,
        u.display_name,
        u.line_display_name,
        u.role
      FROM user_analytics a
      LEFT JOIN app_user u ON u.id = a.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (user_id) {
      params.push(user_id);
      sql += ` AND a.user_id = $${params.length}`;
    }

    if (event_type) {
      params.push(event_type);
      sql += ` AND a.event_type = $${params.length}`;
    }

    if (page_path) {
      params.push(page_path);
      sql += ` AND a.page_path = $${params.length}`;
    }

    if (date_from) {
      params.push(date_from);
      sql += ` AND a.timestamp >= $${params.length}::timestamptz`;
    }

    if (date_to) {
      params.push(date_to);
      sql += ` AND a.timestamp <= $${params.length}::timestamptz`;
    }

    sql += ` ORDER BY a.timestamp DESC LIMIT ${limit}`;

    const data = await query(sql, params);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
