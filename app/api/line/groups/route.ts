import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { serverError } from '@/lib/api-helpers';

// GET - List all groups
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'active'; // 'active', 'inactive', 'all'

    let queryText = `
      SELECT 
        g.id,
        g.line_group_id,
        g.group_name,
        g.group_type,
        g.status,
        g.picture_url,
        g.joined_at,
        g.left_at,
        g.created_at,
        g.updated_at,
        COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'active') as member_count,
        COUNT(DISTINCT e.id) as event_count
      FROM line_groups g
      LEFT JOIN line_group_members m ON g.id = m.group_id
      LEFT JOIN line_group_events e ON g.id = e.group_id
    `;

    const params: string[] = [];
    
    if (status !== 'all') {
      queryText += ` WHERE g.status = $1`;
      params.push(status);
    }

    queryText += `
      GROUP BY g.id, g.line_group_id, g.group_name, g.group_type, g.status, 
               g.picture_url, g.joined_at, g.left_at, g.created_at, g.updated_at
      ORDER BY g.joined_at DESC
    `;

    const groups = await query(queryText, params);

    return NextResponse.json({ groups });
  } catch (err) {
    return serverError(err);
  }
}
