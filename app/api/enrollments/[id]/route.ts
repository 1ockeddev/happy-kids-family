import { queryOne } from '@/lib/db';
import { ok, notFound, noContent, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(
      `SELECT e.*,
        json_build_object('id', c.id, 'name_th', c.name_th, 'name_en', c.name_en) AS child,
        json_build_object('id', co.id, 'name', co.name, 'level', co.level) AS cohort
       FROM enrollment e
       JOIN child c ON c.id = e.child_id
       JOIN cohort co ON co.id = e.cohort_id
       WHERE e.id = $1`,
      [id]
    );
    if (!row) return notFound('ไม่พบการลงทะเบียน');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { child_id, cohort_id, start_date, end_date, graduated, hidden } = body;
    const row = await queryOne(
      `UPDATE enrollment SET
        child_id = COALESCE($1, child_id),
        cohort_id = COALESCE($2, cohort_id),
        start_date = COALESCE($3, start_date),
        end_date = $4,
        graduated = COALESCE($5, graduated),
        hidden = COALESCE($6, hidden)
       WHERE id = $7 RETURNING *`,
      [child_id ?? null, cohort_id ?? null, start_date ?? null, end_date ?? null, graduated ?? null, hidden ?? null, id]
    );
    if (!row) return notFound('ไม่พบการลงทะเบียน');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(`DELETE FROM enrollment WHERE id = $1 RETURNING id`, [id]);
    if (!row) return notFound('ไม่พบการลงทะเบียน');
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
