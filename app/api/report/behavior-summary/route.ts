import { query } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// GET /api/report/behavior-summary?child_id=&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
// Returns per-item avg score + per-day scores for sparkline
export async function GET(req: NextRequest) {
  try {
    const child_id  = req.nextUrl.searchParams.get('child_id')  ?? '';
    const date_from = req.nextUrl.searchParams.get('date_from') ?? '';
    const date_to   = req.nextUrl.searchParams.get('date_to')   ?? '';
    if (!child_id) return badRequest('child_id จำเป็น');

    // aggregate per item: avg, min, max, count
    const items = await query(
      `SELECT
         bi.id           AS item_id,
         bi.name_th, bi.name_en, bi.max_score, bi.sort_order AS item_sort,
         bc.id           AS category_id,
         bc.name_th      AS category_name_th,
         bc.name_en      AS category_name_en,
         bc.sort_order   AS cat_sort,
         ROUND(AVG(cbs.score)::numeric, 2)  AS avg_score,
         MIN(cbs.score)                     AS min_score,
         MAX(cbs.score)                     AS max_score,
         COUNT(cbs.score)                   AS days_recorded,
         -- array of (date, score) for sparkline, newest last
         json_agg(
           json_build_object('date', to_char(d.date,'YYYY-MM-DD'), 'score', cbs.score)
           ORDER BY d.date
         ) AS daily_scores
       FROM child_behavior_score cbs
       JOIN behavior_item bi     ON bi.id  = cbs.item_id
       JOIN behavior_category bc ON bc.id  = bi.category_id
       JOIN daily d              ON d.id   = cbs.daily_id
       WHERE cbs.child_id = $1
         AND cbs.score IS NOT NULL
         AND ($2 = '' OR d.date >= $2::date)
         AND ($3 = '' OR d.date <= $3::date)
       GROUP BY bi.id, bi.name_th, bi.name_en, bi.max_score, bi.sort_order,
                bc.id, bc.name_th, bc.name_en, bc.sort_order
       ORDER BY bc.sort_order, bi.sort_order`,
      [child_id, date_from, date_to]
    );

    return ok(items);
  } catch (err) {
    return serverError(err);
  }
}
