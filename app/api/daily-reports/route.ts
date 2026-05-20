import { query, queryOne } from '@/lib/db';
import { ok, created, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const search   = req.nextUrl.searchParams.get('search')   ?? '';
    const daily_id = req.nextUrl.searchParams.get('daily_id') ?? '';
    const child_id = req.nextUrl.searchParams.get('child_id') ?? '';
    const rows = await query(
      `SELECT dr.*,
        json_build_object('id', c.id, 'name_th', c.name_th, 'name_en', c.name_en) AS child,
        json_build_object(
          'id', d.id, 'date', to_char(d.date, 'YYYY-MM-DD'), 'activity', d.activity, 'food', d.food, 'fruit', d.fruit,
          'cohort', json_build_object('id', co.id, 'name', co.name)
        ) AS daily,
        COALESCE(
          json_agg(
            json_build_object('id', ex.id, 'time', ex.time, 'type', ex.type, 'action', ex.action)
            ORDER BY ex.time
          ) FILTER (WHERE ex.id IS NOT NULL),
          '[]'
        ) AS excretions
       FROM daily_report dr
       JOIN child c  ON c.id  = dr.child_id
       JOIN daily d  ON d.id  = dr.daily_id
       JOIN cohort co ON co.id = d.cohort_id
       LEFT JOIN child_excretion ex ON ex.daily_id = dr.daily_id AND ex.child_id = dr.child_id
       WHERE ($1 = '' OR c.name_th ILIKE $2 OR c.name_en ILIKE $2)
         AND ($3 = '' OR dr.daily_id::text = $3)
         AND ($4 = '' OR dr.child_id::text = $4)
       GROUP BY dr.id, c.id, d.id, co.id
       ORDER BY d.date DESC, c.name_th`,
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
    const { daily_id, child_id, nap_from, nap_to,
            milk1, milk1_note, milk2, milk2_note,
            food_amount, food_note, fruit_amount, fruit_note,
            note, created_by } = body;
    if (!daily_id || !child_id) return badRequest('daily_id และ child_id จำเป็น');
    const row = await queryOne(
      `INSERT INTO daily_report
         (daily_id, child_id, nap_from, nap_to,
          milk1, milk1_note, milk2, milk2_note,
          food_amount, food_note, fruit_amount, fruit_note,
          note, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (daily_id, child_id) DO UPDATE SET
         nap_from=$3, nap_to=$4,
         milk1=$5, milk1_note=$6, milk2=$7, milk2_note=$8,
         food_amount=$9, food_note=$10, fruit_amount=$11, fruit_note=$12,
         note=$13, updated_by=$14, updated_at=NOW()
       RETURNING *`,
      [daily_id, child_id,
       nap_from ?? null, nap_to ?? null,
       milk1 ?? 'skip', milk1_note ?? null,
       milk2 ?? 'skip', milk2_note ?? null,
       food_amount ?? 'skip', food_note ?? null,
       fruit_amount ?? 'skip', fruit_note ?? null,
       note ?? null, created_by ?? null]
    );
    return created(row);
  } catch (err) {
    return serverError(err);
  }
}
