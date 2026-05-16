import { query } from '@/lib/db';
import { serverError } from '@/lib/api-helpers';
import { NextResponse } from 'next/server';

// ลำดับ FK-safe
const TABLES = [
  'app_user', 'child', 'cohort',
  'parent_child', 'teacher_permission', 'enrollment',
  'daily', 'attendance', 'daily_report',
  'behavior_category', 'behavior_item', 'child_behavior_score', 'child_excretion',
];

export async function GET() {
  try {
    const exported: Record<string, unknown[]> = {};
    for (const table of TABLES) {
      const rows = await query(`SELECT * FROM ${table} ORDER BY created_at NULLS LAST`, []);
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
