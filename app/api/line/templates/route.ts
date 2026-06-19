import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { serverError } from '@/lib/api-helpers';

// GET - List all templates
export async function GET() {
  try {
    const templates = await query(
      `SELECT id, name, description, template, created_at 
       FROM line_flex_templates 
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ templates });
  } catch (err) {
    return serverError(err);
  }
}

// POST - Create new template
export async function POST(req: NextRequest) {
  try {
    const { name, description, template } = await req.json();

    if (!name || !template) {
      return NextResponse.json(
        { error: 'name and template are required' },
        { status: 400 }
      );
    }

    const result = await queryOne(
      `INSERT INTO line_flex_templates (id, name, description, template, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       RETURNING id, name, description, template, created_at`,
      [name, description || null, JSON.stringify(template)]
    );

    return NextResponse.json({ template: result });
  } catch (err) {
    return serverError(err);
  }
}

// PUT - Update template
export async function PUT(req: NextRequest) {
  try {
    const { id, name, description, template } = await req.json();

    if (!id || !name || !template) {
      return NextResponse.json(
        { error: 'id, name and template are required' },
        { status: 400 }
      );
    }

    const result = await queryOne(
      `UPDATE line_flex_templates 
       SET name = $1, description = $2, template = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, description, template, created_at`,
      [name, description || null, JSON.stringify(template), id]
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template: result });
  } catch (err) {
    return serverError(err);
  }
}

// DELETE - Remove template
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    await queryOne(
      `DELETE FROM line_flex_templates WHERE id = $1`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err);
  }
}
