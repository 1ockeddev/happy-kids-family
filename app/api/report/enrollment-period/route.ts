import { query } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// GET /api/report/enrollment-period?child_id=...
// Returns enrollment period (start_date, end_date)
export async function GET(req: NextRequest) {
  try {
    const child_id = req.nextUrl.searchParams.get('child_id') ?? '';
    if (!child_id) return badRequest('child_id จำเป็น');

    const rows = await query(
      `SELECT
         to_char(MIN(e.start_date), 'YYYY-MM-DD') AS start_date,
         to_char(
           GREATEST(
             MAX(COALESCE(e.end_date, CURRENT_DATE + INTERVAL '1 year')),
             (SELECT MAX(d.date) 
              FROM daily_report dr
              JOIN daily d ON dr.daily_id = d.id
              WHERE dr.child_id = $1)
           ), 
           'YYYY-MM-DD'
         ) AS end_date
       FROM enrollment e
       WHERE e.child_id = $1`,
      [child_id]
    );
    
    if (!rows.length || !rows[0].start_date) {
      return ok({ start_date: null, end_date: null });
    }
    
    return ok({
      start_date: rows[0].start_date,
      end_date: rows[0].end_date
    });
  } catch (err) {
    console.error('Enrollment period error:', err);
    return serverError(err);
  }
}
