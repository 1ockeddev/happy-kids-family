import { query, queryOne } from '@/lib/db';
import { ok, created, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// GET /api/children — list (supports ?search=)
export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') ?? '';
    const rows = await query(
      `SELECT * FROM child
       WHERE deleted_at IS NULL
         AND ($1 = '' OR name_th ILIKE $2 OR name_en ILIKE $2)
       ORDER BY name_th`,
      [search, `%${search}%`]
    );
    return ok(rows);
  } catch (err) {
    return serverError(err);
  }
}

// POST /api/children — create
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name_en, name_th } = body;
    if (!name_th && !name_en) return badRequest('name_th หรือ name_en ต้องกรอกอย่างน้อยหนึ่งช่อง');
    const row = await queryOne(
      `INSERT INTO child (name_en, name_th) VALUES ($1, $2) RETURNING *`,
      [name_en ?? null, name_th ?? null]
    );
    return created(row);
  } catch (err) {
    return serverError(err);
  }
}
