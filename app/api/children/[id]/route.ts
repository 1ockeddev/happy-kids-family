import { queryOne } from '@/lib/db';
import { ok, notFound, badRequest, noContent, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

// GET /api/children/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(
      `SELECT 
        id, name_en, name_th, 
        firstname_en, lastname_en, 
        firstname_th, lastname_th,
        nickname_en, nickname_th,
        birthdate::text as birthdate,
        photo_url, deleted_at, created_at
       FROM child WHERE id = $1 AND deleted_at IS NULL`, 
      [id]
    );
    if (!row) return notFound('ไม่พบนักเรียน');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

// PATCH /api/children/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { 
      name_en, name_th, 
      firstname_en, lastname_en, 
      firstname_th, lastname_th,
      nickname_en, nickname_th,
      birthdate,
      photo_url 
    } = body;
    
    const row = await queryOne(
      `UPDATE child SET
        name_en       = COALESCE($1, name_en),
        name_th       = COALESCE($2, name_th),
        firstname_en  = COALESCE($3, firstname_en),
        lastname_en   = COALESCE($4, lastname_en),
        firstname_th  = COALESCE($5, firstname_th),
        lastname_th   = COALESCE($6, lastname_th),
        nickname_en   = COALESCE($7, nickname_en),
        nickname_th   = COALESCE($8, nickname_th),
        birthdate     = COALESCE($9, birthdate),
        photo_url     = CASE WHEN $10::text IS NULL THEN photo_url ELSE $10 END
       WHERE id = $11 
       RETURNING 
        id, name_en, name_th, 
        firstname_en, lastname_en, 
        firstname_th, lastname_th,
        nickname_en, nickname_th,
        birthdate::text as birthdate,
        photo_url, deleted_at, created_at`,
      [
        name_en ?? null, 
        name_th ?? null, 
        firstname_en ?? null, 
        lastname_en ?? null,
        firstname_th ?? null,
        lastname_th ?? null,
        nickname_en ?? null,
        nickname_th ?? null,
        birthdate ?? null,
        photo_url ?? null, 
        id
      ]
    );
    if (!row) return notFound('ไม่พบนักเรียน');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

// DELETE /api/children/[id] — soft delete
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(
      `UPDATE child SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );
    if (!row) return notFound('ไม่พบนักเรียน');
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
