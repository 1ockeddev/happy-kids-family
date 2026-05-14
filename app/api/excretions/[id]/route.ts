import { queryOne } from '@/lib/db';
import { ok, notFound, noContent, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { time, type, action } = await req.json();
    const row = await queryOne(
      `UPDATE child_excretion SET
        time   = COALESCE($1, time),
        type   = COALESCE($2, type),
        action = COALESCE($3, action)
       WHERE id = $4 RETURNING *`,
      [time ?? null, type ?? null, action ?? null, id]
    );
    if (!row) return notFound('ไม่พบข้อมูล');
    return ok(row);
  } catch (err) { return serverError(err); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(`DELETE FROM child_excretion WHERE id=$1 RETURNING id`, [id]);
    if (!row) return notFound('ไม่พบข้อมูล');
    return noContent();
  } catch (err) { return serverError(err); }
}
