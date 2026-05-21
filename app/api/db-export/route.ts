import { query } from '@/lib/db';
import { serverError } from '@/lib/api-helpers';
import { NextResponse } from 'next/server';

const TABLES = [
  'app_user', 'child', 'cohort',
  'parent_child', 'teacher_permission', 'enrollment',
  'daily', 'attendance', 'daily_report',
  'behavior_category', 'behavior_item', 'child_behavior_score', 'child_excretion',
];

export async function GET() {
  try {
    // ดึง column list จริงจาก DB — ไม่ต้อง hardcode
    const colRows = await query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = ANY($1)`,
      [TABLES]
    );
    const tableColumns: Record<string, Set<string>> = {};
    for (const { table_name, column_name } of colRows as { table_name: string; column_name: string }[]) {
      if (!tableColumns[table_name]) tableColumns[table_name] = new Set();
      tableColumns[table_name].add(column_name);
    }

    const exported: Record<string, unknown[]> = {};
    for (const table of TABLES) {
      const cols = tableColumns[table] ?? new Set();
      const order = cols.has('created_at') ? 'ORDER BY created_at NULLS LAST' : '';
      const rows  = await query(`SELECT * FROM "${table}" ${order}`, []);
      exported[table] = rows;
    }

    const payload = {
      version: 1,
      exported_at: new Date().toISOString(),
      tables: exported,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="kindergarten-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}
