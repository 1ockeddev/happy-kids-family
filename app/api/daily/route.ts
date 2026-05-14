import { query, queryOne } from '@/lib/db';
import { ok, created, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') ?? '';
    const date = req.nextUrl.searchParams.get('date') ?? '';
    const cohort_id = req.nextUrl.searchParams.get('cohort_id') ?? '';
    const rows = await query(
      `SELECT d.*,
        json_build_object('id', co.id, 'name', co.name, 'level', co.level) AS cohort
       FROM daily d
       JOIN cohort co ON co.id = d.cohort_id
       WHERE ($1 = '' OR co.name ILIKE $2 OR d.activity ILIKE $2)
         AND ($3 = '' OR d.date::text = $3)
         AND ($4 = '' OR d.cohort_id::text = $4)
       ORDER BY d.date DESC, co.name`,
      [search, `%${search}%`, date, cohort_id]
    );
    return ok(rows);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cohort_id, date, activity, food, fruit, note, created_by } = body;
    if (!cohort_id || !date) return badRequest('cohort_id และ date จำเป็น');
    const row = await queryOne(
      `INSERT INTO daily (cohort_id, date, activity, food, fruit, note, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [cohort_id, date, activity ?? null, food ?? null, fruit ?? null, note ?? null, created_by ?? null]
    );
    return created(row);
  } catch (err) {
    return serverError(err);
  }
}
