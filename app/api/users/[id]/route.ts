import { queryOne } from '@/lib/db';
import { ok, notFound, noContent, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(`SELECT * FROM app_user WHERE id = $1`, [id]);
    if (!row) return notFound('ไม่พบผู้ใช้');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { display_name, role, status, line_user_id } = body;

    // ถ้าส่ง line_user_id มา → ตรวจซ้ำ (ยกเว้น user ตัวเอง)
    if (line_user_id) {
      const { queryOne: q } = await import('@/lib/db');
      const dup = await q(
        `SELECT id FROM app_user WHERE line_user_id = $1 AND id != $2`, [line_user_id, id]
      );
      if (dup) { return (await import('@/lib/api-helpers')).badRequest('LINE ID นี้มีในระบบแล้ว'); }
    }

    const row = await queryOne(
      `UPDATE app_user SET
        display_name = COALESCE($1, display_name),
        role         = COALESCE($2::user_role, role),
        status       = COALESCE($3::user_status, status),
        line_user_id = CASE WHEN $4::text IS NULL THEN line_user_id ELSE $4 END
       WHERE id = $5 RETURNING *`,
      [display_name ?? null, role ?? null, status ?? null, line_user_id ?? null, id]
    );
    if (!row) return notFound('ไม่พบผู้ใช้');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(
      `UPDATE app_user SET status = 'inactive' WHERE id = $1 RETURNING id`, [id]
    );
    if (!row) return notFound('ไม่พบผู้ใช้');
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
