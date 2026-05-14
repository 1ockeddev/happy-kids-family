import { query, queryOne } from '@/lib/db';
import { ok, created, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const category_id = req.nextUrl.searchParams.get('category_id') ?? '';
    const rows = await query(
      `SELECT bi.*,
        json_build_object('id', bc.id, 'name_th', bc.name_th, 'name_en', bc.name_en) AS category
       FROM behavior_item bi
       JOIN behavior_category bc ON bc.id = bi.category_id
       WHERE bi.is_active = true
         AND ($1 = '' OR bi.category_id::text = $1)
       ORDER BY bc.sort_order, bi.sort_order`,
      [category_id]
    );
    return ok(rows);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category_id, name_en, name_th, max_score, sort_order } = body;
    if (!category_id || !name_en || !name_th) return badRequest('category_id, name_en, name_th จำเป็น');
    const row = await queryOne(
      `INSERT INTO behavior_item (category_id, name_en, name_th, max_score, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [category_id, name_en, name_th, max_score ?? 3, sort_order ?? 0]
    );
    return created(row);
  } catch (err) {
    return serverError(err);
  }
}
