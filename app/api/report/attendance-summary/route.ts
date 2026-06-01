import { query } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// GET /api/report/attendance-summary?child_id=...
// Returns attendance summary for contribution graph
export async function GET(req: NextRequest) {
  try {
    const child_id = req.nextUrl.searchParams.get('child_id') ?? '';
    if (!child_id) return badRequest('child_id จำเป็น');

    const rows = await query(
      `SELECT DISTINCT
         to_char(d.date, 'YYYY-MM-DD') AS date,
         CASE
           WHEN dr.id IS NOT NULL THEN 'present'
           ELSE a.status
         END AS status
       FROM enrollment e
       JOIN daily d ON d.cohort_id = e.cohort_id
       LEFT JOIN attendance a ON a.daily_id = d.id AND a.child_id = $1
       LEFT JOIN daily_report dr ON dr.daily_id = d.id AND dr.child_id = $1
       WHERE e.child_id = $1
         AND d.date >= e.start_date
         AND (e.end_date IS NULL OR d.date <= e.end_date)
       ORDER BY date ASC`,
      [child_id]
    );
    return ok(rows);
  } catch (err) {
    console.error('Attendance summary error:', err);
    return serverError(err);
  }
}
