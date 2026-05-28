import { queryOne } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/line-register
// เรียกตอน LIFF โหลด — upsert user แล้ว return ข้อมูล
// ถ้ามีอยู่แล้ว → update display_name + picture ล่าสุด
// ถ้าใหม่ → สร้าง role=parent, status=active รอ admin ผูกลูก
export async function POST(req: NextRequest) {
  try {
    const { line_user_id, display_name, picture_url } = await req.json();
    if (!line_user_id) return badRequest('line_user_id จำเป็น');

    const row = await queryOne(
      `INSERT INTO app_user (id, line_user_id, role, status, display_name, picture_url)
       VALUES (gen_random_uuid(), $1, 'parent', 'active', $2, $3)
       ON CONFLICT (line_user_id) DO UPDATE SET
         display_name = COALESCE(EXCLUDED.display_name, app_user.display_name),
         picture_url  = COALESCE(EXCLUDED.picture_url,  app_user.picture_url)
       RETURNING id, line_user_id, role, status, display_name, picture_url`,
      [line_user_id, display_name ?? null, picture_url ?? null]
    );

    const user = await queryOne(
      `SELECT id, status FROM app_user WHERE line_user_id = $1`,
      [line_user_id]
    );
    if (user?.status === 'inactive') {
      return NextResponse.json({ data: null, error: 'account_inactive' }, { status: 403 });
    }

    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}
