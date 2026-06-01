import { query } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// GET /api/holidays?cohort_id=...&start_date=...&end_date=...
// Returns list of holidays
export async function GET(req: NextRequest) {
  try {
    const cohort_id = req.nextUrl.searchParams.get('cohort_id');
    const start_date = req.nextUrl.searchParams.get('start_date');
    const end_date = req.nextUrl.searchParams.get('end_date');

    let sql = `
      SELECT 
        id, 
        to_char(date, 'YYYY-MM-DD') AS date,
        name_th, 
        name_en, 
        type, 
        cohort_id,
        created_at,
        updated_at
      FROM holidays
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;

    // Filter by cohort (include NULL cohort_id = applies to all)
    if (cohort_id) {
      paramCount++;
      sql += ` AND (cohort_id = $${paramCount} OR cohort_id IS NULL)`;
      params.push(cohort_id);
    } else {
      sql += ` AND cohort_id IS NULL`;
    }

    // Filter by date range
    if (start_date) {
      paramCount++;
      sql += ` AND date >= $${paramCount}`;
      params.push(start_date);
    }
    if (end_date) {
      paramCount++;
      sql += ` AND date <= $${paramCount}`;
      params.push(end_date);
    }

    sql += ` ORDER BY date ASC`;

    const rows = await query(sql, params);
    return ok(rows);
  } catch (err) {
    console.error('GET holidays error:', err);
    return serverError(err);
  }
}

// POST /api/holidays
// Create a new holiday
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, name_th, name_en, type, cohort_id } = body;

    if (!date || !name_th || !type) {
      return badRequest('date, name_th, และ type จำเป็น');
    }

    // Convert empty string to null for cohort_id
    const cohortIdValue = cohort_id && cohort_id.trim() !== '' ? cohort_id : null;

    const rows = await query(
      `INSERT INTO holidays (date, name_th, name_en, type, cohort_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING 
         id, 
         to_char(date, 'YYYY-MM-DD') AS date,
         name_th, 
         name_en, 
         type, 
         cohort_id`,
      [date, name_th, name_en || null, type, cohortIdValue]
    );

    return ok(rows[0]);
  } catch (err: any) {
    console.error('POST holiday error:', err);
    if (err.code === '23505') { // Unique constraint violation
      return badRequest('วันหยุดนี้มีอยู่แล้ว');
    }
    return serverError(err);
  }
}
