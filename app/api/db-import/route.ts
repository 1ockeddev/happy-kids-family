import { getPool } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

const TABLES_ORDER = [
  'app_user', 'child', 'cohort',
  'parent_child', 'teacher_permission', 'enrollment',
  'daily', 'attendance', 'daily_report',
  'behavior_category', 'behavior_item', 'child_behavior_score', 'child_excretion',
];

const TABLE_COLUMNS: Record<string, string[]> = {
  app_user:             ['id','line_user_id','role','status','display_name','picture_url','created_at'],
  child:                ['id','name_en','name_th','photo_url','deleted_at','created_at'],
  cohort:               ['id','name','level','academic_year','start_date','end_date','created_at'],
  parent_child:         ['parent_id','child_id'],
  teacher_permission:   ['user_id','can_manage_daily','can_manage_attendance','can_manage_report'],
  enrollment:           ['id','child_id','cohort_id','start_date','end_date','graduated','created_at'],
  daily:                ['id','cohort_id','date','activity','food','fruit','note','created_by','updated_by','updated_at','created_at'],
  attendance:           ['id','daily_id','child_id','status','note','created_by','updated_by','updated_at','created_at'],
  daily_report:         ['id','daily_id','child_id','nap_from','nap_to','milk1','milk1_note','milk2','milk2_note','food_amount','food_note','fruit_amount','fruit_note','note','created_by','updated_by','updated_at','created_at'],
  behavior_category:    ['id','name_en','name_th','sort_order','is_active','cohort_ids','created_at'],
  behavior_item:        ['id','category_id','name_en','name_th','max_score','sort_order','is_active','created_at'],
  child_behavior_score: ['id','daily_id','child_id','item_id','score','note','created_at'],
  child_excretion:      ['id','daily_id','child_id','time','type','action','created_at'],
};

// ── POST /api/db-import ──────────────────────────────────────
// body: {
//   version, tables,
//   overwrite_tables?: string[]   // tables ที่ยอมให้ overwrite
//   dry_run?: boolean             // ถ้า true → แค่วิเคราะห์ conflict ไม่ write
// }
export async function POST(req: NextRequest) {
  let payload: {
    version: number;
    tables: Record<string, unknown[]>;
    overwrite_tables?: string[];
    dry_run?: boolean;
  };
  try { payload = await req.json(); }
  catch { return badRequest('JSON ไม่ถูกต้อง'); }

  if (!payload?.tables) return badRequest('ไม่พบ field "tables"');
  if (payload.version !== 1) return badRequest('version ไม่รองรับ');

  const overwriteTables = new Set(payload.overwrite_tables ?? []);
  const isDryRun = payload.dry_run === true;

  const pool   = getPool();
  const client = await pool.connect();

  const stats: Record<string, {
    inserted: number; skipped: number; overwritten: number;
    conflicts: { id: string; preview: string }[];
  }> = {};

  try {
    await client.query('BEGIN');
    await client.query('SET session_replication_role = replica');
    // Disable foreign key checks during import
    await client.query('SET CONSTRAINTS ALL DEFERRED');

    for (const table of TABLES_ORDER) {
      const rows = payload.tables[table];
      stats[table] = { inserted: 0, skipped: 0, overwritten: 0, conflicts: [] };
      if (!rows?.length) continue;

      const allowedCols  = TABLE_COLUMNS[table] ?? [];
      const doOverwrite  = overwriteTables.has(table);

      for (const row of rows as Record<string, unknown>[]) {
        const cols = Object.keys(row).filter(k => allowedCols.includes(k));
        if (!cols.length) { stats[table].skipped++; continue; }

        const vals         = cols.map(c => row[c]);
        const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
        const colList      = cols.map(c => `"${c}"`).join(', ');

        // check conflict
        const hasId   = cols.includes('id');
        const hasPK   = cols.includes('parent_id') && cols.includes('child_id');
        let conflict  = false;

        try {
          if (hasId) {
            const existing = await client.query(
              `SELECT id FROM "${table}" WHERE id = $1 LIMIT 1`, [row['id']]
            );
            conflict = existing.rows.length > 0;
          } else if (hasPK) {
            const existing = await client.query(
              `SELECT 1 FROM "${table}" WHERE parent_id = $1 AND child_id = $2 LIMIT 1`,
              [row['parent_id'], row['child_id']]
            );
            conflict = existing.rows.length > 0;
          }
        } catch (e) {
          // If conflict check fails, treat as skipped
          stats[table].skipped++;
          continue;
        }

        if (conflict) {
          // เก็บ conflict info สำหรับ dry_run
          const preview = (row['name_th'] ?? row['display_name'] ?? row['id'] ?? '?') as string;
          stats[table].conflicts.push({ id: String(row['id'] ?? ''), preview });

          if (!doOverwrite || isDryRun) {
            stats[table].skipped++;
            continue;
          }
          // overwrite mode
          if (!isDryRun) {
            try {
              const setClauses = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
              const whereClause = hasId ? `id = $${cols.length + 1}` : `parent_id = $${cols.length + 1} AND child_id = $${cols.length + 2}`;
              const updateVals = hasId ? [...vals, row['id']] : [...vals, row['parent_id'], row['child_id']];
              await client.query(
                `UPDATE "${table}" SET ${setClauses} WHERE ${whereClause}`,
                updateVals
              );
              stats[table].overwritten++;
            } catch (e) {
              stats[table].skipped++;
            }
          }
          continue;
        }

        // no conflict — insert
        if (!isDryRun) {
          try {
            await client.query(
              `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`, vals
            );
            stats[table].inserted++;
          } catch (e) {
            // Log error but continue with next row
            stats[table].skipped++;
          }
        } else {
          stats[table].inserted++; // preview count
        }
      }
    }

    await client.query('SET session_replication_role = DEFAULT');

    if (isDryRun) {
      await client.query('ROLLBACK');
    } else {
      await client.query('COMMIT');
    }

    return ok({ dry_run: isDryRun, stats });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      // Ignore rollback errors
    }
    return serverError(err);
  } finally {
    client.release();
  }
}
