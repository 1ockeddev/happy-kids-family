import { queryOne } from '@/lib/db';
import { ok, notFound, noContent, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { time, type, action } = body;
    
    const row = await queryOne(
      `UPDATE child_excretion SET
        time   = $1,
        type   = $2,
        action = $3
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
