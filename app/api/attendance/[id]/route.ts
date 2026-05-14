import { queryOne } from '@/lib/db';
import { ok, notFound, noContent, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(
      `SELECT a.*, json_build_object('id', c.id, 'name_th', c.name_th, 'name_en', c.name_en) AS child
       FROM attendance a JOIN child c ON c.id = a.child_id WHERE a.id = $1`, [id]
    );
    if (!row) return notFound('ไม่พบข้อมูล');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, note, updated_by } = body;
    const row = await queryOne(
      `UPDATE attendance SET
        status = COALESCE($1, status),
        note = COALESCE($2, note),
        updated_by = $3,
        updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [status ?? null, note ?? null, updated_by ?? null, id]
    );
    if (!row) return notFound('ไม่พบข้อมูล');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(`DELETE FROM attendance WHERE id = $1 RETURNING id`, [id]);
    if (!row) return notFound('ไม่พบข้อมูล');
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
