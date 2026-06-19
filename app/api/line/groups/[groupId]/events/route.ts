import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { serverError } from '@/lib/api-helpers';

// GET - List events in a group
export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get('eventType'); // 'message', 'join', 'leave', etc.
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let queryText = `
      SELECT 
        e.id,
        e.line_user_id,
        e.event_type,
        e.message_type,
        e.message_text,
        e.message_data,
        e.created_at,
        m.display_name as user_display_name
      FROM line_group_events e
      LEFT JOIN line_group_members m ON e.group_id = m.group_id AND e.line_user_id = m.line_user_id
      WHERE e.group_id = (
        SELECT id FROM line_groups WHERE line_group_id = $1
      )
    `;

    const params_arr: any[] = [groupId];

    if (eventType) {
      queryText += ` AND e.event_type = $${params_arr.length + 1}`;
      params_arr.push(eventType);
    }

    queryText += ` ORDER BY e.created_at DESC LIMIT $${params_arr.length + 1} OFFSET $${params_arr.length + 2}`;
    params_arr.push(limit, offset);

    const events = await query(queryText, params_arr);

    // Count total events
    let countQuery = `
      SELECT COUNT(*) as total
      FROM line_group_events e
      WHERE e.group_id = (
        SELECT id FROM line_groups WHERE line_group_id = $1
      )
    `;
    
    const countParams: any[] = [groupId];
    
    if (eventType) {
      countQuery += ` AND e.event_type = $2`;
      countParams.push(eventType);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult[0]?.total || '0');

    return NextResponse.json({ 
      events,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (err) {
    return serverError(err);
  }
}
