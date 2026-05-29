import { query } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// GET /api/report/dates?child_id=...
// Returns all days that have a daily record for the child's cohort (by enrollment),
// joined with their report_id if one exists — newest first.
export async function GET(req: NextRequest) {
  try {
    const child_id = req.nextUrl.searchParams.get('child_id') ?? '';
    if (!child_id) return badRequest('child_id จำเป็น');

    const rows = await query(
      `SELECT
         to_char(d.date, 'YYYY-MM-DD') AS date,
         d.id          AS daily_id,
         dr.id         AS report_id
       FROM enrollment e
       JOIN daily d ON d.cohort_id = e.cohort_id
       LEFT JOIN daily_report dr
         ON dr.daily_id = d.id AND dr.child_id = e.child_id
       WHERE e.child_id = $1
         AND dr.id IS NOT NULL          -- only days that have a report
       ORDER BY d.date DESC`,
      [child_id]
    );
    return ok(rows);
  } catch (err) {
    return serverError(err);
  }
}
