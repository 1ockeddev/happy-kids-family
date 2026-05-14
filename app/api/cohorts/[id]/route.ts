import { queryOne } from '@/lib/db';
import { ok, notFound, noContent, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(`SELECT * FROM cohort WHERE id = $1`, [id]);
    if (!row) return notFound('ไม่พบห้องเรียน');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, level, academic_year, start_date, end_date } = body;
    const row = await queryOne(
      `UPDATE cohort SET
        name = COALESCE($1, name),
        level = COALESCE($2, level),
        academic_year = COALESCE($3, academic_year),
        start_date = COALESCE($4, start_date),
        end_date = COALESCE($5, end_date)
       WHERE id = $6 RETURNING *`,
      [name ?? null, level ?? null, academic_year ?? null, start_date ?? null, end_date ?? null, id]
    );
    if (!row) return notFound('ไม่พบห้องเรียน');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(`DELETE FROM cohort WHERE id = $1 RETURNING id`, [id]);
    if (!row) return notFound('ไม่พบห้องเรียน');
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
