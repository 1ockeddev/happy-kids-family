import { query } from '@/lib/db';
import { serverError } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';

// Vercel timeout configuration - extend to 60 seconds for export operations
export const maxDuration = 60; // Maximum execution time in seconds
export const dynamic = 'force-dynamic'; // Disable caching

const ALL_TABLES = [
  'app_user', 'child', 'cohort',
  'parent_child', 'teacher_permission', 'enrollment',
  'daily', 'attendance', 'daily_report',
  'behavior_category', 'behavior_item', 'child_behavior_score', 'child_excretion',
  'holidays', 'user_analytics',
];

// Helper: Convert rows to CSV
function rowsToCSV(rows: any[], columns: string[]): string {
  if (rows.length === 0) return '';
  
  // Header row
  const header = columns.join(',');
  
  // Data rows
  const data = rows.map(row => {
    return columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return '';
      // Escape quotes and wrap in quotes if contains comma/quote/newline
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',');
  }).join('\n');
  
  return `${header}\n${data}`;
}

export async function GET(req: NextRequest) {
  try {
    const format = req.nextUrl.searchParams.get('format') ?? 'json';
    const tablesParam = req.nextUrl.searchParams.get('tables') ?? '';
    
    // Parse selected tables
    const selectedTables = tablesParam 
      ? tablesParam.split(',').filter(t => ALL_TABLES.includes(t))
      : ALL_TABLES;
    
    if (selectedTables.length === 0) {
      return NextResponse.json({ error: 'No valid tables selected' }, { status: 400 });
    }

    // ดึง column list จริงจาก DB
    const colRows = await query(
      `SELECT table_name, column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = ANY($1)
       ORDER BY table_name, ordinal_position`,
      [selectedTables]
    );
    
    const tableColumns: Record<string, string[]> = {};
    const dateColumns: Record<string, Set<string>> = {};
    
    for (const { table_name, column_name, data_type } of colRows as { table_name: string; column_name: string; data_type: string }[]) {
      if (!tableColumns[table_name]) tableColumns[table_name] = [];
      tableColumns[table_name].push(column_name);
      
      // Track date/timestamp columns
      if (data_type === 'date' || data_type === 'timestamp without time zone' || data_type === 'timestamp with time zone') {
        if (!dateColumns[table_name]) dateColumns[table_name] = new Set();
        dateColumns[table_name].add(column_name);
      }
    }

    if (format === 'csv') {
      // CSV Export - one file per table in a ZIP
      const JSZip = require('jszip');
      const zip = new JSZip();
      
      for (const table of selectedTables) {
        const cols = tableColumns[table] ?? [];
        const dateCols = dateColumns[table] ?? new Set();
        const order = cols.includes('created_at') ? 'ORDER BY created_at NULLS LAST' : '';
        
        // Convert date columns to YYYY-MM-DD format
        const selectCols = cols.map(col => {
          if (dateCols.has(col)) {
            return `to_char("${col}", 'YYYY-MM-DD') AS "${col}"`;
          }
          return `"${col}"`;
        }).join(', ');
        
        const rows = await query(`SELECT ${selectCols} FROM "${table}" ${order}`, []);
        const csv = rowsToCSV(rows, cols);
        zip.file(`${table}.csv`, csv);
      }
      
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      
      return new NextResponse(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="kindergarten-backup-${new Date().toISOString().slice(0, 10)}.zip"`,
        },
      });
    } else if (format === 'sql') {
      // SQL Export - INSERT statements
      let sql = `-- Database Export\n-- Generated: ${new Date().toISOString()}\n-- Tables: ${selectedTables.join(', ')}\n\n`;
      
      for (const table of selectedTables) {
        const cols = tableColumns[table] ?? [];
        const order = cols.includes('created_at') ? 'ORDER BY created_at NULLS LAST' : '';
        
        const rows = await query(`SELECT * FROM "${table}" ${order}`, []);
        
        if (rows.length === 0) {
          sql += `-- Table: ${table} (no data)\n\n`;
          continue;
        }
        
        sql += `-- Table: ${table} (${rows.length} rows)\n`;
        sql += `TRUNCATE TABLE "${table}" CASCADE;\n`;
        
        for (const row of rows) {
          const values = cols.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'boolean') return val ? 'true' : 'false';
            if (val instanceof Date) return `'${val.toISOString()}'`;
            return String(val);
          }).join(', ');
          
          sql += `INSERT INTO "${table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${values});\n`;
        }
        
        sql += '\n';
      }
      
      return new NextResponse(sql, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="kindergarten-backup-${new Date().toISOString().slice(0, 10)}.sql"`,
        },
      });
    } else {
      // JSON Export
      const exported: Record<string, unknown[]> = {};
      
      for (const table of selectedTables) {
        const cols = tableColumns[table] ?? [];
        const dateCols = dateColumns[table] ?? new Set();
        const order = cols.includes('created_at') ? 'ORDER BY created_at NULLS LAST' : '';
        
        // Convert date columns to YYYY-MM-DD format
        const selectCols = cols.map(col => {
          if (dateCols.has(col)) {
            return `to_char("${col}", 'YYYY-MM-DD') AS "${col}"`;
          }
          return `"${col}"`;
        }).join(', ');
        
        const rows = await query(`SELECT ${selectCols} FROM "${table}" ${order}`, []);
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
    }
  } catch (err) {
    console.error('Export error:', err);
    const errorMessage = err instanceof Error ? err.message : 'An error occurred during export';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
