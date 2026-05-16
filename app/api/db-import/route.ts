import { getPool } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

const TABLES_ORDER = [
  'app_user', 'child', 'cohort',
  'parent_child', 'teacher_permission', 'enrollment',
  'daily', 'attendance', 'daily_report',
  'behavior_category', 'behavior_item', 'child_behavior_score', 'child_excretion',
];

// column whitelist per table — prevent SQL injection via column names
const TABLE_COLUMNS: Record<string, string[]> = {
  app_user:              ['id','line_user_id','role','status','display_name','created_at'],
  child:                 ['id','name_en','name_th','photo_url','deleted_at','created_at'],
  cohort:                ['id','name','level','academic_year','start_date','end_date','created_at'],
  parent_child:          ['parent_id','child_id'],
  teacher_permission:    ['user_id','can_manage_daily','can_manage_attendance','can_manage_report'],
  enrollment:            ['id','child_id','cohort_id','start_date','end_date','graduated','created_at'],
  daily:                 ['id','cohort_id','date','activity','food','fruit','note','created_by','updated_by','updated_at','created_at'],
  attendance:            ['id','daily_id','child_id','status','note','created_by','updated_by','updated_at','created_at'],
  daily_report:          ['id','daily_id','child_id','nap_from','nap_to','milk1','milk2','food_amount','fruit_amount','note','created_by','updated_by','updated_at','created_at'],
  behavior_category:     ['id','name_en','name_th','sort_order','is_active','cohort_ids','created_at'],
  behavior_item:         ['id','category_id','name_en','name_th','max_score','sort_order','is_active','created_at'],
  child_behavior_score:  ['id','daily_id','child_id','item_id','score','note','created_at'],
  child_excretion:       ['id','daily_id','child_id','time','type','action','created_at'],
};

export async function POST(req: NextRequest) {
  let payload: { version: number; tables: Record<string, unknown[]> };
  try {
    payload = await req.json();
  } catch {
    return badRequest('JSON ไม่ถูกต้อง');
  }
  if (!payload?.tables) return badRequest('ไฟล์ไม่ถูกต้อง — ต้องมี field "tables"');
  if (payload.version !== 1) return badRequest('version ไม่รองรับ');

  const pool = getPool();
  const client = await pool.connect();
  const stats: Record<string, { inserted: number; skipped: number }> = {};

  try {
    await client.query('BEGIN');
    // disable triggers temporarily to avoid FK ordering issues
    await client.query('SET session_replication_role = replica');

    for (const table of TABLES_ORDER) {
      const rows = payload.tables[table];
      if (!rows?.length) { stats[table] = { inserted: 0, skipped: 0 }; continue; }
      const allowedCols = TABLE_COLUMNS[table] ?? [];
      let inserted = 0, skipped = 0;

      for (const row of rows as Record<string, unknown>[]) {
        // pick only known columns
        const cols = Object.keys(row).filter(k => allowedCols.includes(k));
        if (!cols.length) { skipped++; continue; }
        const vals = cols.map(c => row[c]);
        const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
        const colList = cols.map(c => `"${c}"`).join(', ');
        try {
          await client.query(
            `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            vals
          );
          inserted++;
        } catch {
          skipped++;
        }
      }
      stats[table] = { inserted, skipped };
    }

    await client.query('SET session_replication_role = DEFAULT');
    await client.query('COMMIT');
    return ok({ message: 'นำเข้าสำเร็จ', stats });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return serverError(err);
  } finally {
    client.release();
  }
}
