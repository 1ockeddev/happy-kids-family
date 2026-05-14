import { query, queryOne } from '@/lib/db';
import { ok, created, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') ?? '';
    const daily_id = req.nextUrl.searchParams.get('daily_id') ?? '';
    const child_id = req.nextUrl.searchParams.get('child_id') ?? '';
    const rows = await query(
      `SELECT a.*,
        json_build_object('id', c.id, 'name_th', c.name_th, 'name_en', c.name_en) AS child
       FROM attendance a
       JOIN child c ON c.id = a.child_id
       WHERE ($1 = '' OR c.name_th ILIKE $2 OR c.name_en ILIKE $2)
         AND ($3 = '' OR a.daily_id::text = $3)
         AND ($4 = '' OR a.child_id::text = $4)
       ORDER BY c.name_th`,
      [search, `%${search}%`, daily_id, child_id]
    );
    return ok(rows);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { daily_id, child_id, status, note, created_by } = body;
    if (!daily_id || !child_id) return badRequest('daily_id และ child_id จำเป็น');
    const row = await queryOne(
      `INSERT INTO attendance (daily_id, child_id, status, note, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (daily_id, child_id)
       DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note, updated_by = EXCLUDED.created_by, updated_at = NOW()
       RETURNING *`,
      [daily_id, child_id, status ?? 'present', note ?? null, created_by ?? null]
    );
    return created(row);
  } catch (err) {
    return serverError(err);
  }
}
