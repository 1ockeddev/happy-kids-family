import { query, queryOne } from '@/lib/db';
import { ok, created, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const cohort_id = req.nextUrl.searchParams.get('cohort_id') ?? '';
    const rows = await query(
      `SELECT bc.*,
        COALESCE(bc.cohort_ids, '{}') AS cohort_ids,
        COALESCE(
          json_agg(bi ORDER BY bi.sort_order) FILTER (WHERE bi.id IS NOT NULL),
          '[]'
        ) AS items
       FROM behavior_category bc
       LEFT JOIN behavior_item bi ON bi.category_id = bc.id AND bi.is_active = true
       WHERE bc.is_active = true
         AND ($1 = '' OR bc.cohort_ids @> ARRAY[$1::uuid]
              OR bc.cohort_ids = '{}')
       GROUP BY bc.id
       ORDER BY bc.sort_order`
    , [cohort_id]);
    return ok(rows);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name_en, name_th, sort_order, cohort_ids } = body;
    if (!name_en || !name_th) return badRequest('name_en และ name_th จำเป็น');
    const row = await queryOne(
      `INSERT INTO behavior_category (name_en, name_th, sort_order, cohort_ids)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name_en, name_th, sort_order ?? 0, cohort_ids ?? []]
    );
    return created(row);
  } catch (err) {
    return serverError(err);
  }
}
