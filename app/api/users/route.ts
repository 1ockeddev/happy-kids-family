import { query, queryOne } from '@/lib/db';
import { ok, created, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') ?? '';
    const role = req.nextUrl.searchParams.get('role') ?? '';
    const rows = await query(
      `SELECT u.*,
        CASE WHEN tp.user_id IS NOT NULL THEN
          json_build_object(
            'can_manage_daily', tp.can_manage_daily,
            'can_manage_attendance', tp.can_manage_attendance,
            'can_manage_report', tp.can_manage_report
          )
        END AS permissions
       FROM app_user u
       LEFT JOIN teacher_permission tp ON tp.user_id = u.id
       WHERE ($1 = '' OR u.display_name ILIKE $2 OR u.line_user_id ILIKE $2)
         AND ($3 = '' OR u.role::text = $3)
       ORDER BY u.created_at DESC`,
      [search, `%${search}%`, role]
    );
    return ok(rows);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { line_user_id, role, status, display_name } = body;
    if (!line_user_id || !role) return badRequest('line_user_id และ role จำเป็น');
    const { picture_url } = body;
    const row = await queryOne(
      `INSERT INTO app_user (id, line_user_id, role, status, display_name, picture_url)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING *`,
      [line_user_id, role, status ?? 'active', display_name ?? null, picture_url ?? null]
    );
    return created(row);
  } catch (err) {
    return serverError(err);
  }
}
