import { query } from '@/lib/db';
import { ok, badRequest, serverError, notFound } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// GET /api/holidays/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT 
         id, 
         to_char(date, 'YYYY-MM-DD') AS date,
         name_th, 
         name_en, 
         type, 
         cohort_id
       FROM holidays 
       WHERE id = $1`,
      [id]
    );
    if (!rows.length) return notFound('ไม่พบวันหยุด');
    return ok(rows[0]);
  } catch (err) {
    console.error('GET holiday error:', err);
    return serverError(err);
  }
}

// PUT /api/holidays/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { date, name_th, name_en, type, cohort_id } = body;

    // Convert empty string to null for cohort_id
    const cohortIdValue = cohort_id && cohort_id.trim() !== '' ? cohort_id : null;

    const rows = await query(
      `UPDATE holidays 
       SET date = COALESCE($1, date),
           name_th = COALESCE($2, name_th),
           name_en = COALESCE($3, name_en),
           type = COALESCE($4, type),
           cohort_id = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING 
         id, 
         to_char(date, 'YYYY-MM-DD') AS date,
         name_th, 
         name_en, 
         type, 
         cohort_id`,
      [date, name_th, name_en, type, cohortIdValue, id]
    );

    if (!rows.length) return notFound('ไม่พบวันหยุด');
    return ok(rows[0]);
  } catch (err) {
    console.error('PUT holiday error:', err);
    return serverError(err);
  }
}

// DELETE /api/holidays/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query('DELETE FROM holidays WHERE id = $1 RETURNING id', [id]);
    if (!rows.length) return notFound('ไม่พบวันหยุด');
    return ok({ message: 'ลบวันหยุดสำเร็จ' });
  } catch (err) {
    console.error('DELETE holiday error:', err);
    return serverError(err);
  }
}
