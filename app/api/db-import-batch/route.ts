import { getPool } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// Batch import - process tables one by one to avoid timeout
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

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
};

// POST /api/db-import-batch
// Import one table at a time
// body: { table: string, rows: any[], overwrite: boolean }
export async function POST(req: NextRequest) {
  let payload: {
    table: string;
    rows: unknown[];
    overwrite?: boolean;
  };
  
  try { payload = await req.json(); }
  catch { return badRequest('JSON ไม่ถูกต้อง'); }

  const { table, rows, overwrite = false } = payload;

  if (!table || !TABLE_COLUMNS[table]) {
    return badRequest(`ไม่รู้จักตาราง: ${table}`);
  }

  if (!Array.isArray(rows)) {
    return badRequest('rows ต้องเป็น array');
  }

  const pool = getPool();
  const client = await pool.connect();

  const stats = {
    table,
    inserted: 0,
    skipped: 0,
    overwritten: 0,
    conflicts: [] as { id: string; preview: string }[],
    errors: [] as string[],
  };

  try {
    await client.query('BEGIN');
    await client.query('SET session_replication_role = replica');

    const allowedCols = TABLE_COLUMNS[table] ?? [];

    for (const row of rows as Record<string, unknown>[]) {
      const cols = Object.keys(row).filter(k => allowedCols.includes(k));
      if (!cols.length) {
        stats.skipped++;
        continue;
      }

      // Prepare values
      const vals = cols.map(c => {
        const val = row[c];
        // Convert empty string to null for optional fields
        if (val === '' && (c.includes('note') || c.includes('_to') || c.includes('_from') || c === 'end_date' || c === 'deleted_at' || c === 'updated_by' || c === 'updated_at')) {
          return null;
        }
        return val;
      });

      const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
      const colList = cols.map(c => `"${c}"`).join(', ');

      // Check conflict
      const hasId = cols.includes('id');
      const hasPK = cols.includes('parent_id') && cols.includes('child_id');
      let conflict = false;
      let existingId = null;

      if (hasId) {
        const existing = await client.query(
          `SELECT id FROM "${table}" WHERE id = $1 LIMIT 1`,
          [row['id']]
        );
        conflict = existing.rows.length > 0;
        if (conflict) existingId = existing.rows[0].id;
      } else if (hasPK) {
        const existing = await client.query(
          `SELECT 1 FROM "${table}" WHERE parent_id = $1 AND child_id = $2 LIMIT 1`,
          [row['parent_id'], row['child_id']]
        );
        conflict = existing.rows.length > 0;
      }

      // Check other unique constraints
      if (!conflict) {
        if (table === 'daily_report' && cols.includes('daily_id') && cols.includes('child_id')) {
          const existing = await client.query(
            `SELECT id FROM daily_report WHERE daily_id = $1 AND child_id = $2 LIMIT 1`,
            [row['daily_id'], row['child_id']]
          );
          if (existing.rows.length > 0) {
            conflict = true;
            existingId = existing.rows[0].id;
          }
        } else if (table === 'daily' && cols.includes('cohort_id') && cols.includes('date')) {
          const existing = await client.query(
            `SELECT id FROM daily WHERE cohort_id = $1 AND date = $2 LIMIT 1`,
            [row['cohort_id'], row['date']]
          );
          if (existing.rows.length > 0) {
            conflict = true;
            existingId = existing.rows[0].id;
          }
        }
      }

      if (conflict) {
        const preview = (row['name_th'] ?? row['display_name'] ?? row['id'] ?? '?') as string;
        stats.conflicts.push({ id: String(row['id'] ?? ''), preview });

        if (!overwrite) {
          stats.skipped++;
          continue;
        }

        // Overwrite
        try {
          await client.query('SAVEPOINT sp1');
          
          if (hasId && existingId) {
            const setClauses = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
            await client.query(
              `UPDATE "${table}" SET ${setClauses} WHERE id = $${cols.length + 1}`,
              [...vals, existingId || row['id']]
            );
          } else if (hasPK) {
            const setClauses = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
            await client.query(
              `UPDATE "${table}" SET ${setClauses} WHERE parent_id = $${cols.length + 1} AND child_id = $${cols.length + 2}`,
              [...vals, row['parent_id'], row['child_id']]
            );
          } else if (existingId) {
            const setClauses = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
            await client.query(
              `UPDATE "${table}" SET ${setClauses} WHERE id = $${cols.length + 1}`,
              [...vals, existingId]
            );
          }
          
          await client.query('RELEASE SAVEPOINT sp1');
          stats.overwritten++;
        } catch (err: any) {
          stats.errors.push(`${row['id']}: ${err.message || 'Update failed'}`);
          await client.query('ROLLBACK TO SAVEPOINT sp1');
          stats.skipped++;
        }
        continue;
      }

      // No conflict - insert
      try {
        await client.query('SAVEPOINT sp1');
        await client.query(
          `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`,
          vals
        );
        await client.query('RELEASE SAVEPOINT sp1');
        stats.inserted++;
      } catch (err: any) {
        stats.errors.push(`${row['id'] || 'unknown'}: ${err.message || 'Insert failed'}`);
        await client.query('ROLLBACK TO SAVEPOINT sp1');
        stats.skipped++;
      }
    }

    await client.query('SET session_replication_role = DEFAULT');
    await client.query('COMMIT');

    return ok({ stats });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return serverError(err);
  } finally {
    client.release();
  }
}
