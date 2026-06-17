import { query, queryOne } from '@/lib/db';
import { ok, created, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') ?? '';
    const role   = req.nextUrl.searchParams.get('role')   ?? '';
    const status = req.nextUrl.searchParams.get('status') ?? '';
    const rows = await query(
      `SELECT u.*,
        CASE WHEN tp.user_id IS NOT NULL THEN
          json_build_object('can_manage_daily', tp.can_manage_daily, 'can_manage_attendance', tp.can_manage_attendance, 'can_manage_report', tp.can_manage_report)
        ELSE NULL END AS permissions,
        (SELECT MAX(timestamp) FROM user_analytics WHERE user_id = u.id) AS last_activity
       FROM app_user u
       LEFT JOIN teacher_permission tp ON tp.user_id = u.id
       WHERE ($1 = '' OR u.display_name ILIKE $2 OR u.line_user_id ILIKE $2)
         AND ($3 = '' OR u.role::text = $3)
         AND ($4 = '' OR u.status::text = $4)
       ORDER BY u.created_at DESC`,
      [search, `%${search}%`, role, status]
    );
    return ok(rows);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { line_user_id, role, status, display_name, picture_url, can_select_cohort, default_cohort_id } = body;
    if (!role) return badRequest('role จำเป็น');

    // ถ้าไม่มี line_user_id → generate placeholder ที่ unique
    const finalLineId = (line_user_id && line_user_id.trim())
      ? line_user_id.trim()
      : null;  // NULL ได้แล้ว (UNIQUE NULL is not duplicate in PostgreSQL)

    // ถ้าใส่ line_user_id มา → ตรวจซ้ำ
    if (finalLineId) {
      const existing = await queryOne(
        `SELECT id FROM app_user WHERE line_user_id = $1`, [finalLineId]
      );
      if (existing) return badRequest('LINE ID นี้มีในระบบแล้ว');
    }

    const row = await queryOne(
      `INSERT INTO app_user (id, line_user_id, role, status, display_name, picture_url, can_select_cohort, default_cohort_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        finalLineId, 
        role, 
        status ?? 'active', 
        display_name ?? null, 
        picture_url ?? null,
        can_select_cohort ?? true,
        default_cohort_id ?? null
      ]
    );
    return created(row);
  } catch (err) {
    return serverError(err);
  }
}
