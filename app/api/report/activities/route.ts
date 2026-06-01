import { query } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// GET /api/report/activities?child_id=...&start_date=...&end_date=...
// Returns activities for date range
export async function GET(req: NextRequest) {
  try {
    const child_id = req.nextUrl.searchParams.get('child_id') ?? '';
    const start_date = req.nextUrl.searchParams.get('start_date');
    const end_date = req.nextUrl.searchParams.get('end_date');

    if (!child_id) return badRequest('child_id จำเป็น');

    let sql = `
      SELECT 
        to_char(d.date, 'YYYY-MM-DD') AS date,
        d.activity
      FROM enrollment e
      JOIN daily d ON d.cohort_id = e.cohort_id
      WHERE e.child_id = $1
        AND d.date >= e.start_date
        AND (e.end_date IS NULL OR d.date <= e.end_date)
        AND d.activity IS NOT NULL
    `;
    const params: any[] = [child_id];
    let paramCount = 1;

    if (start_date) {
      paramCount++;
      sql += ` AND d.date >= $${paramCount}`;
      params.push(start_date);
    }
    if (end_date) {
      paramCount++;
      sql += ` AND d.date <= $${paramCount}`;
      params.push(end_date);
    }

    sql += ` ORDER BY d.date ASC`;

    const rows = await query(sql, params);
    return ok(rows);
  } catch (err) {
    console.error('Activities error:', err);
    return serverError(err);
  }
}
