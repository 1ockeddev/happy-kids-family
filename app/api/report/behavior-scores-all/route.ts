import { query } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// GET /api/report/behavior-scores-all?child_id=&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
// Returns all child_behavior_score records with details
export async function GET(req: NextRequest) {
  try {
    const child_id  = req.nextUrl.searchParams.get('child_id')  ?? '';
    const date_from = req.nextUrl.searchParams.get('date_from') ?? '';
    const date_to   = req.nextUrl.searchParams.get('date_to')   ?? '';
    if (!child_id) return badRequest('child_id จำเป็น');

    // Get all behavior scores with full details
    const scores = await query(
      `SELECT
         cbs.id,
         cbs.score,
         cbs.note,
         to_char(d.date, 'YYYY-MM-DD') AS date,
         d.date AS date_raw,
         bi.id           AS item_id,
         bi.name_th      AS item_name_th,
         bi.name_en      AS item_name_en,
         bi.max_score,
         bc.id           AS category_id,
         bc.name_th      AS category_name_th,
         bc.name_en      AS category_name_en,
         bc.sort_order   AS category_sort,
         bi.sort_order   AS item_sort
       FROM child_behavior_score cbs
       JOIN behavior_item bi     ON bi.id  = cbs.item_id
       JOIN behavior_category bc ON bc.id  = bi.category_id
       JOIN daily d              ON d.id   = cbs.daily_id
       WHERE cbs.child_id = $1
         AND cbs.score IS NOT NULL
         AND ($2 = '' OR d.date >= $2::date)
         AND ($3 = '' OR d.date <= $3::date)
       ORDER BY d.date DESC, bc.sort_order, bi.sort_order`,
      [child_id, date_from, date_to]
    );

    return ok(scores);
  } catch (err) {
    return serverError(err);
  }
}
