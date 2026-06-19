import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { serverError } from '@/lib/api-helpers';

// Whitelist of tables that can be updated
const ALLOWED_TABLES = [
  'app_user',
  'child',
  'cohort',
  'parent_child',
  'teacher_permission',
  'enrollment',
  'daily',
  'attendance',
  'daily_report',
  'behavior_category',
  'behavior_item',
  'child_behavior_score',
  'child_excretion',
  'holidays',
  'user_analytics',
  'line_flex_templates',
  'line_groups',
  'line_group_members',
  'line_group_events',
];

// POST - Update record(s)
export async function POST(req: NextRequest) {
  try {
    const { table, id, updates, where } = await req.json();

    // Validate table
    if (!table || !ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { error: 'Invalid or missing table name' },
        { status: 400 }
      );
    }

    // Validate updates object
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'updates object is required and must have at least one field' },
        { status: 400 }
      );
    }

    // Validate WHERE clause: either id or custom where
    if (!id && !where) {
      return NextResponse.json(
        { error: 'Either id or where clause is required' },
        { status: 400 }
      );
    }

    // Build SET clause
    const setFields = Object.keys(updates);
    const setClause = setFields
      .map((field, idx) => `"${field}" = $${idx + 1}`)
      .join(', ');

    // Build WHERE clause
    let whereClause: string;
    let params: unknown[];

    if (id) {
      // Update by ID
      whereClause = `id = $${setFields.length + 1}`;
      params = [...Object.values(updates), id];
    } else {
      // Update by custom WHERE clause
      // Note: This is more dangerous, but useful for batch updates
      whereClause = where;
      params = Object.values(updates);
    }

    // Add updated_at if table has it (not for all tables)
    const hasUpdatedAt = [
      'daily', 
      'attendance', 
      'daily_report', 
      'holidays', 
      'line_flex_templates',
      'line_groups',
      'line_group_members',
    ].includes(table);
    const updatedAtField = hasUpdatedAt ? ', updated_at = NOW()' : '';

    // Execute UPDATE
    const sql = `
      UPDATE "${table}"
      SET ${setClause}${updatedAtField}
      WHERE ${whereClause}
      RETURNING *
    `;

    console.log('[DB-UPDATE] SQL:', sql);
    console.log('[DB-UPDATE] Params:', params);

    const results = await query(sql, params);

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'No records found to update' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (err) {
    console.error('[DB-UPDATE] Error:', err);
    return serverError(err);
  }
}

// GET - Get single record by ID for editing
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table');
    const id = searchParams.get('id');

    // Validate table
    if (!table || !ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { error: 'Invalid or missing table name' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Get record
    const record = await queryOne(
      `SELECT * FROM "${table}" WHERE id = $1`,
      [id]
    );

    if (!record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: record });
  } catch (err) {
    console.error('[DB-UPDATE] GET Error:', err);
    return serverError(err);
  }
}
