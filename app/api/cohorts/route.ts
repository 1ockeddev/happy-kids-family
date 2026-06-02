import { query, queryOne } from '@/lib/db';
import { ok, created, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') ?? '';
    const rows = await query(
      `SELECT 
         id,
         name,
         level,
         academic_year,
         to_char(start_date, 'YYYY-MM-DD') AS start_date,
         to_char(end_date, 'YYYY-MM-DD') AS end_date,
         created_at
       FROM cohort
       WHERE ($1 = '' OR name ILIKE $2 OR level ILIKE $2)
       ORDER BY academic_year DESC, name`,
      [search, `%${search}%`]
    );
    return ok(rows);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, level, academic_year, start_date, end_date } = body;
    if (!start_date || !end_date) return badRequest('start_date และ end_date จำเป็น');
    const row = await queryOne(
      `INSERT INTO cohort (name, level, academic_year, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name ?? null, level ?? null, academic_year ?? null, start_date, end_date]
    );
    return created(row);
  } catch (err) {
    return serverError(err);
  }
}
