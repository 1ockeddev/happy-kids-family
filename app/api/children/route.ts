import { query, queryOne } from '@/lib/db';
import { ok, created, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// GET /api/children — list (supports ?search=)
export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') ?? '';
    const rows = await query(
      `SELECT 
        id, name_en, name_th, 
        firstname_en, lastname_en, 
        firstname_th, lastname_th,
        nickname_en, nickname_th,
        birthdate::text as birthdate,
        photo_url, deleted_at, created_at
       FROM child
       WHERE deleted_at IS NULL
         AND ($1 = '' OR 
              name_th ILIKE $2 OR 
              name_en ILIKE $2 OR
              firstname_th ILIKE $2 OR
              lastname_th ILIKE $2 OR
              firstname_en ILIKE $2 OR
              lastname_en ILIKE $2 OR
              nickname_th ILIKE $2 OR
              nickname_en ILIKE $2)
       ORDER BY name_th, firstname_th, nickname_th`,
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
    const { 
      name_en, name_th, 
      firstname_en, lastname_en, 
      firstname_th, lastname_th,
      nickname_en, nickname_th,
      birthdate,
      photo_url 
    } = body;
    
    // ตรวจสอบว่ามีชื่ออย่างน้อย 1 ฟิลด์
    if (!name_th && !name_en && !firstname_th && !lastname_th && !firstname_en && !lastname_en && !nickname_th && !nickname_en) {
      return badRequest('กรุณากรอกชื่ออย่างน้อยหนึ่งช่อง');
    }
    
    const row = await queryOne(
      `INSERT INTO child (
        name_en, name_th, 
        firstname_en, lastname_en, 
        firstname_th, lastname_th,
        nickname_en, nickname_th,
        birthdate,
        photo_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
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
        photo_url ?? null
      ]
    );
    return created(row);
  } catch (err) {
    return serverError(err);
  }
}
