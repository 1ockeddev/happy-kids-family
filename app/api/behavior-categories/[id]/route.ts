import { queryOne } from '@/lib/db';
import { ok, notFound, noContent, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name_en, name_th, sort_order, is_active, cohort_ids } = body;
    const row = await queryOne(
      `UPDATE behavior_category SET
        name_en    = COALESCE($1, name_en),
        name_th    = COALESCE($2, name_th),
        sort_order = COALESCE($3, sort_order),
        is_active  = COALESCE($4, is_active),
        cohort_ids = COALESCE($5, cohort_ids)
       WHERE id = $6 RETURNING *`,
      [name_en ?? null, name_th ?? null, sort_order ?? null, is_active ?? null,
       cohort_ids ?? null, id]
    );
    if (!row) return notFound('ไม่พบหมวดหมู่');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(
      `UPDATE behavior_category SET is_active = false WHERE id = $1 RETURNING id`, [id]
    );
    if (!row) return notFound('ไม่พบหมวดหมู่');
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
