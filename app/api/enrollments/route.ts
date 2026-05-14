import { query, queryOne } from '@/lib/db';
import { ok, created, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') ?? '';
    const cohort_id = req.nextUrl.searchParams.get('cohort_id') ?? '';
    const rows = await query(
      `SELECT e.*,
        json_build_object('id', c.id, 'name_th', c.name_th, 'name_en', c.name_en) AS child,
        json_build_object('id', co.id, 'name', co.name, 'level', co.level) AS cohort
       FROM enrollment e
       JOIN child c ON c.id = e.child_id
       JOIN cohort co ON co.id = e.cohort_id
       WHERE c.deleted_at IS NULL
         AND ($1 = '' OR c.name_th ILIKE $2 OR c.name_en ILIKE $2)
         AND ($3 = '' OR e.cohort_id::text = $3)
       ORDER BY c.name_th`,
      [search, `%${search}%`, cohort_id]
    );
    return ok(rows);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { child_id, cohort_id, start_date, end_date, graduated } = body;
    if (!child_id || !cohort_id || !start_date) return badRequest('child_id, cohort_id, start_date จำเป็น');
    const row = await queryOne(
      `INSERT INTO enrollment (child_id, cohort_id, start_date, end_date, graduated)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [child_id, cohort_id, start_date, end_date ?? null, graduated ?? false]
    );
    return created(row);
  } catch (err) {
    return serverError(err);
  }
}
