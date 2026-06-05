import { query, queryOne } from '@/lib/db';
import { ok, created, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') ?? '';
    const cohort_id = req.nextUrl.searchParams.get('cohort_id') ?? '';
    const rows = await query(
      `SELECT 
         e.id,
         e.child_id,
         e.cohort_id,
         to_char(e.start_date, 'YYYY-MM-DD') AS start_date,
         to_char(e.end_date, 'YYYY-MM-DD') AS end_date,
         e.graduated,
         e.created_at,
         json_build_object(
           'id', c.id, 
           'name_th', c.name_th, 
           'name_en', c.name_en,
           'firstname_th', c.firstname_th,
           'firstname_en', c.firstname_en,
           'lastname_th', c.lastname_th,
           'lastname_en', c.lastname_en,
           'nickname_th', c.nickname_th,
           'nickname_en', c.nickname_en,
           'birthdate', c.birthdate::text,
           'photo_url', c.photo_url
         ) AS child,
         json_build_object('id', co.id, 'name', co.name, 'level', co.level) AS cohort
       FROM enrollment e
       JOIN child c ON c.id = e.child_id
       JOIN cohort co ON co.id = e.cohort_id
       WHERE c.deleted_at IS NULL
         AND ($1 = '' OR 
              c.name_th ILIKE $2 OR 
              c.name_en ILIKE $2 OR
              c.firstname_th ILIKE $2 OR
              c.firstname_en ILIKE $2 OR
              c.lastname_th ILIKE $2 OR
              c.lastname_en ILIKE $2 OR
              c.nickname_th ILIKE $2 OR
              c.nickname_en ILIKE $2)
         AND ($3 = '' OR e.cohort_id::text = $3)
       ORDER BY c.nickname_th, c.name_th`,
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
