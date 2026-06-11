import { queryOne } from '@/lib/db';
import { ok, notFound, noContent, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(
      `SELECT dr.*,
        json_build_object('id', c.id, 'name_th', c.name_th, 'name_en', c.name_en) AS child,
        json_build_object('id', d.id, 'date', to_char(d.date, 'YYYY-MM-DD'), 'activity', d.activity, 'food', d.food, 'fruit', d.fruit,
          'cohort', json_build_object('id', co.id, 'name', co.name)) AS daily,
        COALESCE(
          (SELECT json_agg(
            json_build_object('id', ex.id, 'time', to_char(ex.time, 'HH24:MI'), 'type', ex.type, 'action', ex.action)
            ORDER BY ex.time
          ) FROM child_excretion ex
           WHERE ex.daily_id = dr.daily_id AND ex.child_id = dr.child_id),
          '[]'
        ) AS excretions
       FROM daily_report dr
       JOIN child c ON c.id = dr.child_id
       JOIN daily d ON d.id = dr.daily_id
       JOIN cohort co ON co.id = d.cohort_id
       WHERE dr.id = $1`, [id]
    );
    if (!row) return notFound('ไม่พบรายงาน');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nap_from, nap_to, nap_note, milk1, milk1_note, milk2, milk2_note, food_amount, food_note, fruit_amount, fruit_note, note, updated_by, created_by } = body;
    const row = await queryOne(
      `UPDATE daily_report SET
        nap_from     = COALESCE($1, nap_from),
        nap_to       = COALESCE($2, nap_to),
        nap_note     = $3,
        milk1        = COALESCE($4, milk1),
        milk1_note   = $5,
        milk2        = COALESCE($6, milk2),
        milk2_note   = $7,
        food_amount  = COALESCE($8, food_amount),
        food_note    = $9,
        fruit_amount = COALESCE($10, fruit_amount),
        fruit_note   = $11,
        note         = $12,
        updated_by   = $13,
        created_by   = COALESCE($14, created_by),
        updated_at   = NOW()
       WHERE id = $15 RETURNING *`,
      [nap_from ?? null, nap_to ?? null, nap_note ?? null,
       milk1 ?? null, milk1_note ?? null,
       milk2 ?? null, milk2_note ?? null,
       food_amount ?? null, food_note ?? null,
       fruit_amount ?? null, fruit_note ?? null,
       note ?? null, updated_by ?? null,
       created_by ?? null, id]
    );
    if (!row) return notFound('ไม่พบรายงาน');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(`DELETE FROM daily_report WHERE id = $1 RETURNING id`, [id]);
    if (!row) return notFound('ไม่พบรายงาน');
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
