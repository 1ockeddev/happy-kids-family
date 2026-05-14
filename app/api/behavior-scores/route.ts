import { query, queryOne } from '@/lib/db';
import { ok, created, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const daily_id = req.nextUrl.searchParams.get('daily_id') ?? '';
    const child_id = req.nextUrl.searchParams.get('child_id') ?? '';
    if (!daily_id || !child_id) return badRequest('daily_id และ child_id จำเป็น');
    const rows = await query(
      `SELECT cbs.*,
         bi.name_th, bi.name_en, bi.max_score, bi.sort_order AS item_sort,
         bc.id AS category_id, bc.name_th AS category_name_th, bc.name_en AS category_name_en, bc.sort_order AS cat_sort
       FROM child_behavior_score cbs
       JOIN behavior_item bi ON bi.id = cbs.item_id
       JOIN behavior_category bc ON bc.id = bi.category_id
       WHERE cbs.daily_id = $1 AND cbs.child_id = $2
         AND cbs.score IS NOT NULL
       ORDER BY bc.sort_order, bi.sort_order`,
      [daily_id, child_id]
    );
    return ok(rows);
  } catch (err) { return serverError(err); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { daily_id, child_id, item_id, score, note } = body;
    if (!daily_id || !child_id || !item_id) return badRequest('daily_id, child_id, item_id จำเป็น');
    const row = await queryOne(
      `INSERT INTO child_behavior_score (daily_id, child_id, item_id, score, note)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (daily_id, child_id, item_id) DO UPDATE SET score=$4, note=$5
       RETURNING *`,
      [daily_id, child_id, item_id, score ?? null, note ?? null]
    );
    return created(row);
  } catch (err) { return serverError(err); }
}
