import { query } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// GET /api/report/line-children?line_user_id=Uxxxxx
// ดึงรายชื่อลูกที่ผูกกับ LINE userId นี้
// ถ้าไม่พบ → return [] (ไม่ใช่ error เพื่อให้แสดง UI "ยังไม่มีข้อมูล")
export async function GET(req: NextRequest) {
  try {
    const line_user_id = req.nextUrl.searchParams.get('line_user_id') ?? '';
    if (!line_user_id) return badRequest('line_user_id จำเป็น');

    const rows = await query(
      `SELECT c.id, c.name_th, c.name_en, c.photo_url, c.birthdate
       FROM app_user u
       JOIN parent_child pc ON pc.parent_id = u.id
       JOIN child c         ON c.id = pc.child_id
       WHERE u.line_user_id = $1
         AND u.status = 'active' 
         AND c.deleted_at IS NULL
       ORDER BY c.name_th`,
      [line_user_id]
    );
    return ok(rows);
  } catch (err) {
    return serverError(err);
  }
}
