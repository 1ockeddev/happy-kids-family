import { query, queryOne } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

// PUT /api/users/:id/children { child_ids: string[] }
// replace ความสัมพันธ์ทั้งหมด
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { child_ids } = await req.json();
    if (!Array.isArray(child_ids)) return badRequest('child_ids ต้องเป็น array');

    // ลบเก่าทั้งหมดก่อน
    await query(`DELETE FROM parent_child WHERE parent_id = $1`, [id]);

    // insert ใหม่
    if (child_ids.length > 0) {
      await Promise.all(
        child_ids.map(child_id =>
          queryOne(
            `INSERT INTO parent_child (parent_id, child_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, child_id]
          )
        )
      );
    }
    return ok({ linked: child_ids.length });
  } catch (err) {
    return serverError(err);
  }
}

// GET /api/users/:id/children
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT c.* FROM child c
       JOIN parent_child pc ON pc.child_id = c.id
       JOIN app_user u ON u.id = pc.parent_id
       WHERE u.id = $1 AND c.deleted_at IS NULL
       ORDER BY c.name_th`,
      [id]
    );
    return ok(rows);
  } catch (err) {
    return serverError(err);
  }
}
