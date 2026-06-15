import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST - Track admin analytics event
export async function POST(req: NextRequest) {
  try {
    // Get admin session
    const session = await getSessionFromRequest(req);
    if (!session) {
      console.log('[Admin Analytics] No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Admin Analytics] Session found:', session.username, 'role:', session.role);

    // Get or create admin system user
    let userResult = await query(
      `SELECT id, role, display_name FROM app_user WHERE line_user_id = 'admin_system' LIMIT 1`
    );

    if (userResult.length === 0) {
      console.log('[Admin Analytics] Creating admin system user...');
      userResult = await query(
        `INSERT INTO app_user (id, line_user_id, display_name, line_display_name, role, status) 
         VALUES (gen_random_uuid(), 'admin_system', 'Admin System', 'Admin', 'teacher', 'active') 
         RETURNING id, role, display_name`
      );
    }

    const user = userResult[0];
    console.log('[Admin Analytics] Using user:', user.display_name, 'ID:', user.id);

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
      console.log('[Admin Analytics] Missing required fields');
      return NextResponse.json(
        { error: 'event_type and page_path are required' },
        { status: 400 }
      );
    }

    console.log('[Admin Analytics] Inserting event:', event_type, page_path);

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

    console.log('[Admin Analytics] Event inserted successfully:', result[0].id);
    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 });
  } catch (error: any) {
    console.error('[Admin Analytics] Error:', error.message || error);
    console.error('[Admin Analytics] Stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
