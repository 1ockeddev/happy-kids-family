import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get recent user activities from all users (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT id, role FROM app_user WHERE username = $1 LIMIT 1`,
      [session.username]
    );

    if (result.length === 0 || result[0].role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '100');

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
        u.display_name,
        u.line_display_name,
        u.role
      FROM user_analytics a
      LEFT JOIN app_user u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

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
    console.error('Recent analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
