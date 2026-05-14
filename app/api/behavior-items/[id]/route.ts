import { queryOne } from '@/lib/db';
import { ok, notFound, noContent, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name_en, name_th, max_score, sort_order, is_active } = body;
    const row = await queryOne(
      `UPDATE behavior_item SET
        name_en = COALESCE($1, name_en),
        name_th = COALESCE($2, name_th),
        max_score = COALESCE($3, max_score),
        sort_order = COALESCE($4, sort_order),
        is_active = COALESCE($5, is_active)
       WHERE id = $6 RETURNING *`,
      [name_en ?? null, name_th ?? null, max_score ?? null, sort_order ?? null, is_active ?? null, id]
    );
    if (!row) return notFound('ไม่พบรายการ');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(
      `UPDATE behavior_item SET is_active = false WHERE id = $1 RETURNING id`, [id]
    );
    if (!row) return notFound('ไม่พบรายการ');
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
