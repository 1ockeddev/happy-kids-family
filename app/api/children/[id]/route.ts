import { queryOne } from '@/lib/db';
import { ok, notFound, badRequest, noContent, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

// GET /api/children/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(`SELECT * FROM child WHERE id = $1 AND deleted_at IS NULL`, [id]);
    if (!row) return notFound('ไม่พบนักเรียน');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

// PATCH /api/children/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name_en, name_th } = body;
    if (!name_th && !name_en) return badRequest('ต้องกรอกชื่ออย่างน้อยหนึ่งช่อง');
    const row = await queryOne(
      `UPDATE child SET name_en = COALESCE($1, name_en), name_th = COALESCE($2, name_th) WHERE id = $3 RETURNING *`,
      [name_en ?? null, name_th ?? null, id]
    );
    if (!row) return notFound('ไม่พบนักเรียน');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

// DELETE /api/children/[id] — soft delete
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(
      `UPDATE child SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );
    if (!row) return notFound('ไม่พบนักเรียน');
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
