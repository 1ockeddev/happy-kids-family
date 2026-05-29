import { query } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// GET /api/report/child-parents?child_id=xxx
// ดึงผู้ปกครองทุกคนที่ผูกกับลูกคนนี้
export async function GET(req: NextRequest) {
  try {
    const child_id = req.nextUrl.searchParams.get('child_id') ?? '';
    if (!child_id) return badRequest('child_id จำเป็น');

    const rows = await query(
      `SELECT u.id, u.display_name, u.picture_url, u.line_user_id
       FROM app_user u
       JOIN parent_child pc ON pc.parent_id = u.id
       WHERE pc.child_id = $1
         AND u.status = 'active'
       ORDER BY u.display_name`,
      [child_id]
    );
    return ok(rows);
  } catch (err) {
    return serverError(err);
  }
}
