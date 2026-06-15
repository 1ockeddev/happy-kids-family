import { getPool } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// Vercel timeout configuration - extend to 60 seconds for import operations
export const maxDuration = 60; // Maximum execution time in seconds
export const dynamic = 'force-dynamic'; // Disable caching

const TABLES_ORDER = [
  'app_user', 'child', 'cohort',
  'parent_child', 'teacher_permission', 'enrollment',
  'daily', 'attendance', 'daily_report',
  'behavior_category', 'behavior_item', 'child_behavior_score', 'child_excretion',
  'holidays', 'user_analytics',
];

const TABLE_COLUMNS: Record<string, string[]> = {
  app_user:             ['id','line_user_id','role','status','display_name','picture_url','created_at'],
  child:                ['id','name_en','name_th','firstname_en','lastname_en','firstname_th','lastname_th','nickname_en','nickname_th','birthdate','photo_url','deleted_at','created_at'],
  cohort:               ['id','name','level','academic_year','start_date','end_date','created_at'],
  parent_child:         ['parent_id','child_id'],
  teacher_permission:   ['user_id','can_manage_daily','can_manage_attendance','can_manage_report'],
  enrollment:           ['id','child_id','cohort_id','start_date','end_date','graduated','created_at'],
  daily:                ['id','cohort_id','date','activity','food','fruit','note','created_by','updated_by','updated_at','created_at'],
  attendance:           ['id','daily_id','child_id','status','note','created_by','updated_by','updated_at','created_at'],
  daily_report:         ['id','daily_id','child_id','nap_from','nap_to','nap_note','milk1','milk1_note','milk2','milk2_note','food_amount','food_note','fruit_amount','fruit_note','note','created_by','updated_by','updated_at','created_at'],
  behavior_category:    ['id','name_en','name_th','sort_order','is_active','cohort_ids','created_at'],
  behavior_item:        ['id','category_id','name_en','name_th','max_score','sort_order','is_active','created_at'],
  child_behavior_score: ['id','daily_id','child_id','item_id','score','note','created_at'],
  child_excretion:      ['id','daily_id','child_id','time','type','action','created_at'],
  holidays:             ['id','date','name_th','name_en','type','cohort_id','created_at','updated_at'],
  user_analytics:       ['id','user_id','event_type','page_path','from_path','to_path','element_type','element_label','duration_seconds','timestamp','session_id','user_agent','viewport_width','viewport_height','created_at'],
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
    errors?: string[];
  }> = {};

  try {
    await client.query('BEGIN');
    await client.query('SET session_replication_role = replica');

    for (const table of TABLES_ORDER) {
      const rows = payload.tables[table];
      stats[table] = { inserted: 0, skipped: 0, overwritten: 0, conflicts: [], errors: [] };
      if (!rows?.length) continue;

      const allowedCols  = TABLE_COLUMNS[table] ?? [];
      const doOverwrite  = overwriteTables.has(table);

      for (const row of rows as Record<string, unknown>[]) {
        const cols = Object.keys(row).filter(k => allowedCols.includes(k));
        if (!cols.length) { stats[table].skipped++; continue; }

        // Prepare values - convert empty strings to null for certain fields
        const vals = cols.map(c => {
          const val = row[c];
          // Convert empty string to null for optional fields
          if (val === '' && (c.includes('note') || c.includes('_to') || c.includes('_from') || c === 'end_date' || c === 'deleted_at' || c === 'updated_by' || c === 'updated_at')) {
            return null;
          }
          return val;
        });
        
        const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
        const colList      = cols.map(c => `"${c}"`).join(', ');

        // check conflict
        const hasId   = cols.includes('id');
        const hasPK   = cols.includes('parent_id') && cols.includes('child_id');
        const isHoliday = table === 'holidays';
        const isDailyReport = table === 'daily_report';
        const isBehaviorScore = table === 'child_behavior_score';
        const isEnrollment = table === 'enrollment';
        const isDaily = table === 'daily';
        const isAttendance = table === 'attendance';
        let conflict  = false;
        let existingId = null;

        if (hasId) {
          const existing = await client.query(
            `SELECT id FROM "${table}" WHERE id = $1 LIMIT 1`, [row['id']]
          );
          conflict = existing.rows.length > 0;
          if (conflict) existingId = existing.rows[0].id;
        } else if (hasPK) {
          const existing = await client.query(
            `SELECT 1 FROM "${table}" WHERE parent_id = $1 AND child_id = $2 LIMIT 1`,
            [row['parent_id'], row['child_id']]
          );
          conflict = existing.rows.length > 0;
        } else if (isHoliday) {
          // holidays has unique constraint on (date, cohort_id)
          const existing = await client.query(
            `SELECT id FROM holidays WHERE date = $1 AND (cohort_id = $2 OR (cohort_id IS NULL AND $2 IS NULL)) LIMIT 1`,
            [row['date'], row['cohort_id']]
          );
          conflict = existing.rows.length > 0;
          if (conflict) existingId = existing.rows[0].id;
        }
        
        // Check unique constraints for tables with composite keys
        if (!conflict) {
          if (isDailyReport && cols.includes('daily_id') && cols.includes('child_id')) {
            const existing = await client.query(
              `SELECT id FROM daily_report WHERE daily_id = $1 AND child_id = $2 LIMIT 1`,
              [row['daily_id'], row['child_id']]
            );
            if (existing.rows.length > 0) {
              conflict = true;
              existingId = existing.rows[0].id;
            }
          } else if (isBehaviorScore && cols.includes('daily_id') && cols.includes('child_id') && cols.includes('item_id')) {
            const existing = await client.query(
              `SELECT id FROM child_behavior_score WHERE daily_id = $1 AND child_id = $2 AND item_id = $3 LIMIT 1`,
              [row['daily_id'], row['child_id'], row['item_id']]
            );
            if (existing.rows.length > 0) {
              conflict = true;
              existingId = existing.rows[0].id;
            }
          } else if (table === 'child_excretion' && cols.includes('daily_id') && cols.includes('child_id') && cols.includes('time') && cols.includes('type') && cols.includes('action')) {
            // Check for duplicate excretion entries
            const existing = await client.query(
              `SELECT id FROM child_excretion WHERE daily_id = $1 AND child_id = $2 AND time = $3 AND type = $4 AND action = $5 LIMIT 1`,
              [row['daily_id'], row['child_id'], row['time'], row['type'], row['action']]
            );
            if (existing.rows.length > 0) {
              conflict = true;
              existingId = existing.rows[0].id;
            }
          } else if (isEnrollment && cols.includes('child_id') && cols.includes('cohort_id') && cols.includes('start_date')) {
            const existing = await client.query(
              `SELECT id FROM enrollment WHERE child_id = $1 AND cohort_id = $2 AND start_date = $3 LIMIT 1`,
              [row['child_id'], row['cohort_id'], row['start_date']]
            );
            if (existing.rows.length > 0) {
              conflict = true;
              existingId = existing.rows[0].id;
            }
          } else if (isDaily && cols.includes('cohort_id') && cols.includes('date')) {
            const existing = await client.query(
              `SELECT id FROM daily WHERE cohort_id = $1 AND date = $2 LIMIT 1`,
              [row['cohort_id'], row['date']]
            );
            if (existing.rows.length > 0) {
              conflict = true;
              existingId = existing.rows[0].id;
            }
          } else if (isAttendance && cols.includes('daily_id') && cols.includes('child_id')) {
            const existing = await client.query(
              `SELECT id FROM attendance WHERE daily_id = $1 AND child_id = $2 LIMIT 1`,
              [row['daily_id'], row['child_id']]
            );
            if (existing.rows.length > 0) {
              conflict = true;
              existingId = existing.rows[0].id;
            }
          }
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
              await client.query('SAVEPOINT sp1');
              
              let updateResult;
              if (hasId && existingId) {
                // UPDATE with id (use existing id if found via unique constraint)
                const setClauses = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
                updateResult = await client.query(
                  `UPDATE "${table}" SET ${setClauses} WHERE id = $${cols.length + 1}`,
                  [...vals, existingId || row['id']]
                );
              } else if (hasPK) {
                // UPDATE with composite PK (parent_id, child_id)
                const setClauses = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
                updateResult = await client.query(
                  `UPDATE "${table}" SET ${setClauses} WHERE parent_id = $${cols.length + 1} AND child_id = $${cols.length + 2}`,
                  [...vals, row['parent_id'], row['child_id']]
                );
              } else if (isHoliday) {
                // UPDATE holidays with unique constraint (date, cohort_id)
                const setClauses = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
                updateResult = await client.query(
                  `UPDATE holidays SET ${setClauses} WHERE date = $${cols.length + 1} AND (cohort_id = $${cols.length + 2} OR (cohort_id IS NULL AND $${cols.length + 2}::uuid IS NULL))`,
                  [...vals, row['date'], row['cohort_id']]
                );
              } else if (existingId) {
                // Generic UPDATE using existingId found via unique constraint
                // This covers: daily_report, child_behavior_score, enrollment, daily, attendance
                const setClauses = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
                updateResult = await client.query(
                  `UPDATE "${table}" SET ${setClauses} WHERE id = $${cols.length + 1}`,
                  [...vals, existingId]
                );
              }
              
              await client.query('RELEASE SAVEPOINT sp1');
              
              // Check if update actually affected any rows
              if (updateResult && updateResult.rowCount && updateResult.rowCount > 0) {
                stats[table].overwritten++;
              } else {
                console.warn(`UPDATE returned 0 rows for ${table}, id:`, row['id']);
                stats[table].skipped++;
              }
            } catch (err: any) {
              console.error(`Update error for ${table}, id: ${row['id']}:`, err.message, err.code);
              const errorMsg = `${row['id']}: ${err.message || err.code || 'Unknown error'}`;
              if (!stats[table].errors) stats[table].errors = [];
              stats[table].errors!.push(errorMsg);
              await client.query('ROLLBACK TO SAVEPOINT sp1');
              stats[table].skipped++;
            }
          }
          continue;
        }

        // no conflict — insert
        if (!isDryRun) {
          try {
            await client.query('SAVEPOINT sp1');
            await client.query(
              `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`, vals
            );
            await client.query('RELEASE SAVEPOINT sp1');
            stats[table].inserted++;
          } catch (err) {
            console.error(`Insert error for ${table}:`, err);
            const errorMsg = `${row['id'] || 'unknown'}: ${(err as any).message || (err as any).code || 'Unknown error'}`;
            if (!stats[table].errors) stats[table].errors = [];
            stats[table].errors!.push(errorMsg);
            await client.query('ROLLBACK TO SAVEPOINT sp1');
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
    await client.query('ROLLBACK').catch(() => {});
    return serverError(err);
  } finally {
    client.release();
  }
}
