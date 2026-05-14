import { query, queryOne } from '@/lib/db';
import { ok, created, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const daily_id = req.nextUrl.searchParams.get('daily_id') ?? '';
    const child_id = req.nextUrl.searchParams.get('child_id') ?? '';
    if (!daily_id || !child_id) return badRequest('daily_id และ child_id จำเป็น');
    const rows = await query(
      `SELECT * FROM child_excretion
       WHERE daily_id = $1 AND child_id = $2
       ORDER BY time`,
      [daily_id, child_id]
    );
    return ok(rows);
  } catch (err) { return serverError(err); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { daily_id, child_id, time, type, action } = body;
    if (!daily_id || !child_id) return badRequest('daily_id และ child_id จำเป็น');
    const row = await queryOne(
      `INSERT INTO child_excretion (daily_id, child_id, time, type, action)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [daily_id, child_id, time ?? null, type ?? null, action ?? null]
    );
    return created(row);
  } catch (err) { return serverError(err); }
}
