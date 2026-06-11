import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Helper: Get user from request (supports both admin session and LINE user_id)
async function getUserFromRequest(req: NextRequest) {
  // Try admin session first
  const session = await getSessionFromRequest(req);
  if (session) {
    const result = await query(
      `SELECT id, role, display_name FROM app_user WHERE username = $1 LIMIT 1`,
      [session.username]
    );
    if (result.length > 0) return result[0];
  }

  // Try LINE user_id from header or body
  const lineUserId = req.headers.get('x-line-user-id');
  if (lineUserId) {
    const result = await query(
      `SELECT id, role, display_name FROM app_user WHERE line_user_id = $1 AND status = 'active' LIMIT 1`,
      [lineUserId]
    );
    if (result.length > 0) return result[0];
  }

  return null;
}

// POST - Track analytics event
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Retrieve analytics data (admin only)
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
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
        a.*,
        json_build_object(
          'id', u.id,
          'display_name', u.display_name,
          'role', u.role
        ) AS user
      FROM user_analytics a
      JOIN app_user u ON u.id = a.user_id
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
      sql += ` AND a.timestamp >= $${params.length}`;
    }

    if (date_to) {
      params.push(date_to);
      sql += ` AND a.timestamp <= $${params.length}`;
    }

    sql += ` ORDER BY a.timestamp DESC LIMIT ${limit}`;

    const data = await query(sql, params);

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
