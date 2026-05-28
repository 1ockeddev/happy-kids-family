import { query } from '@/lib/db';
import { ok, serverError } from '@/lib/api-helpers';

// GET /api/report/children
// Returns children who have at least one daily_report record
export async function GET() {
  try {
    const rows = await query(
      `SELECT DISTINCT c.id, c.name_th, c.name_en, c.photo_url
       FROM child c
       JOIN daily_report dr ON dr.child_id = c.id
       AND u.status = 'active'
       WHERE c.deleted_at IS NULL
       ORDER BY c.name_th`
    );
    return ok(rows);
  } catch (err) {
    return serverError(err);
  }
}
