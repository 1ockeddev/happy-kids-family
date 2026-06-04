import { queryOne, query } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/line-register
// เรียกตอน LIFF โหลด — upsert user แล้ว return ข้อมูล
// ลำดับการทำงาน:
// 1. ถ้ามี user ที่มี line_user_id นี้อยู่แล้ว → update line_display_name + picture (ไม่แก้ display_name)
// 2. ถ้าไม่มี → หา user ที่ยังไม่มี line_user_id (NULL) และ display_name ตรงกัน → ผูก LINE ID เข้าไป
// 3. ถ้าไม่เจอทั้ง 2 กรณี → สร้าง user ใหม่ role=parent, status=active
// หมายเหตุ: line_display_name คือชื่อจาก LINE (อัพเดทอัตโนมัติ), display_name คือชื่อที่แสดง (แก้ได้จาก admin)
export async function POST(req: NextRequest) {
  try {
    const { line_user_id, display_name, picture_url } = await req.json();
    if (!line_user_id) return badRequest('line_user_id จำเป็น');

    // 1. ตรวจสอบว่ามี user ที่มี line_user_id นี้อยู่แล้วหรือไม่
    let user = await queryOne(
      `SELECT * FROM app_user WHERE line_user_id = $1`,
      [line_user_id]
    );

    if (user) {
      // มีอยู่แล้ว → อัพเดท line_display_name + picture_url เท่านั้น (ไม่แก้ display_name)
      user = await queryOne(
        `UPDATE app_user SET
           line_display_name = $2,
           picture_url = $3
         WHERE line_user_id = $1
         RETURNING *`,
        [line_user_id, display_name ?? null, picture_url ?? null]
      );
    } else {
      // 2. ไม่มี → หา user ที่ยังไม่มี line_user_id และ display_name ตรงกัน
      const existingUser = await queryOne(
        `SELECT * FROM app_user 
         WHERE line_user_id IS NULL 
         AND display_name = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [display_name]
      );

      if (existingUser) {
        // เจอ user ที่รอผูก → ผูก LINE ID เข้าไป พร้อมบันทึก line_display_name
        user = await queryOne(
          `UPDATE app_user SET
             line_user_id = $1,
             line_display_name = $2,
             picture_url = $3
           WHERE id = $4
           RETURNING *`,
          [line_user_id, display_name ?? null, picture_url ?? null, existingUser.id]
        );
      } else {
        // 3. ไม่เจอทั้ง 2 กรณี → สร้างใหม่ (display_name และ line_display_name ใช้ค่าเดียวกัน)
        user = await queryOne(
          `INSERT INTO app_user (id, line_user_id, role, status, display_name, line_display_name, picture_url)
           VALUES (gen_random_uuid(), $1, 'parent', 'active', $2, $2, $3)
           RETURNING *`,
          [line_user_id, display_name ?? null, picture_url ?? null]
        );
      }
    }

    // ตรวจสอบสถานะ
    if (user?.status === 'inactive') {
      return NextResponse.json({ data: null, error: 'account_inactive' }, { status: 403 });
    }

    return ok(user);
  } catch (err) {
    return serverError(err);
  }
}
