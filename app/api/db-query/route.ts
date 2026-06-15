import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Vercel timeout configuration
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const ALLOWED_TABLES = [
  'app_user', 'child', 'cohort',
  'parent_child', 'teacher_permission', 'enrollment',
  'daily', 'attendance', 'daily_report',
  'behavior_category', 'behavior_item', 'child_behavior_score', 'child_excretion',
  'holidays', 'user_analytics',
];

export async function GET(req: NextRequest) {
  try {
    const table = req.nextUrl.searchParams.get('table') ?? '';
    const fieldsParam = req.nextUrl.searchParams.get('fields') ?? '*';
    const whereClause = req.nextUrl.searchParams.get('where') ?? '';
    const limitParam = req.nextUrl.searchParams.get('limit') ?? '';
    
    // Validate table
    if (!table || !ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }
    
    // Build SELECT clause
    let selectClause: string;
    if (fieldsParam === '*') {
      selectClause = '*';
    } else {
      // Parse and validate field names
      const fields = fieldsParam.split(',').map(f => f.trim()).filter(Boolean);
      if (fields.length === 0) {
        selectClause = '*';
      } else {
        // Escape field names to prevent SQL injection
        selectClause = fields.map(f => `"${f.replace(/"/g, '""')}"`).join(', ');
      }
    }
    
    // Build WHERE clause
    let whereSQL = '';
    if (whereClause) {
      // Basic validation - don't allow dangerous keywords
      const dangerous = /;|\bdrop\b|\bdelete\b|\btruncate\b|\balter\b|\bcreate\b|\binsert\b|\bupdate\b/i;
      if (dangerous.test(whereClause)) {
        return NextResponse.json({ error: 'Invalid WHERE clause - contains dangerous keywords' }, { status: 400 });
      }
      whereSQL = ` WHERE ${whereClause}`;
    }
    
    // Build LIMIT clause
    let limitSQL = '';
    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (isNaN(limit) || limit < 1) {
        return NextResponse.json({ error: 'Invalid LIMIT value' }, { status: 400 });
      }
      limitSQL = ` LIMIT ${limit}`;
    }
    
    // Execute query
    const sql = `SELECT ${selectClause} FROM "${table}"${whereSQL}${limitSQL}`;
    console.log('[DB Query] Executing:', sql);
    
    const rows = await query(sql, []);
    
    return NextResponse.json({
      data: rows,
      meta: {
        table,
        rowCount: rows.length,
        sql,
      },
    });
  } catch (err) {
    console.error('[DB Query] Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Query execution failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
