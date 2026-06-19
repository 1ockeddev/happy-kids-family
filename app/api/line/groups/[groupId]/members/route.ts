import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { serverError } from '@/lib/api-helpers';

// GET - List members of a group
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await context.params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'active'; // 'active', 'left', 'all'

    let queryText = `
      SELECT 
        m.id,
        m.line_user_id,
        m.display_name,
        m.picture_url,
        m.role,
        m.joined_at,
        m.left_at,
        m.status,
        m.created_at,
        m.updated_at,
        u.id as app_user_id,
        u.role as app_user_role
      FROM line_group_members m
      LEFT JOIN app_user u ON m.line_user_id = u.line_user_id
      WHERE m.group_id = (
        SELECT id FROM line_groups WHERE line_group_id = $1
      )
    `;

    const params_arr: string[] = [groupId];

    if (status !== 'all') {
      queryText += ` AND m.status = $2`;
      params_arr.push(status);
    }

    queryText += ` ORDER BY m.joined_at DESC`;

    const members = await query(queryText, params_arr);

    return NextResponse.json({ members });
  } catch (err) {
    return serverError(err);
  }
}
