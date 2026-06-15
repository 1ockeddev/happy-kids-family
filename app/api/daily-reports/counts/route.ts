import { query } from '@/lib/db';
import { ok, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// GET report counts for multiple daily records at once
// Example: /api/daily-reports/counts?daily_ids=uuid1,uuid2,uuid3
export async function GET(req: NextRequest) {
  try {
    const dailyIdsParam = req.nextUrl.searchParams.get('daily_ids') ?? '';
    
    if (!dailyIdsParam) {
      return ok([]);
    }
    
    const dailyIds = dailyIdsParam.split(',').filter(id => id.trim());
    
    if (dailyIds.length === 0) {
      return ok([]);
    }
    
    // Use a single query to get counts for all daily_ids
    const rows = await query<{ daily_id: string; count: string }>(
      `SELECT daily_id, COUNT(*)::text as count
       FROM daily_report
       WHERE daily_id = ANY($1::uuid[])
       GROUP BY daily_id`,
      [dailyIds]
    );
    
    // Convert to object format: { daily_id: count }
    const counts: Record<string, number> = {};
    rows.forEach(row => {
      counts[row.daily_id] = parseInt(row.count, 10);
    });
    
    // Fill in zeros for daily_ids with no reports
    dailyIds.forEach(id => {
      if (!(id in counts)) {
        counts[id] = 0;
      }
    });
    
    return ok(counts);
  } catch (err) {
    return serverError(err);
  }
}
