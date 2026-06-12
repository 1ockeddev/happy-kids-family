import { queryOne } from '@/lib/db';
import { ok, notFound, noContent, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(
      `SELECT 
         d.id,
         d.cohort_id,
         to_char(d.date, 'YYYY-MM-DD') AS date,
         d.activity,
         d.food,
         d.fruit,
         d.note,
         d.created_by,
         d.updated_by,
         d.created_at,
         d.updated_at,
         json_build_object('id', co.id, 'name', co.name, 'level', co.level) AS cohort
       FROM daily d
       JOIN cohort co ON co.id = d.cohort_id
       WHERE d.id = $1`,
      [id]
    );
    if (!row) return notFound('ไม่พบบันทึก');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { cohort_id, date, activity, food, fruit, note, updated_by } = body;
    
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (cohort_id !== undefined) {
      updates.push(`cohort_id = $${paramCount++}`);
      values.push(cohort_id);
    }
    if (date !== undefined) {
      updates.push(`date = $${paramCount++}`);
      values.push(date);
    }
    if (activity !== undefined) {
      updates.push(`activity = $${paramCount++}`);
      values.push(activity || null);
    }
    if (food !== undefined) {
      updates.push(`food = $${paramCount++}`);
      values.push(food || null);
    }
    if (fruit !== undefined) {
      updates.push(`fruit = $${paramCount++}`);
      values.push(fruit || null);
    }
    if (note !== undefined) {
      updates.push(`note = $${paramCount++}`);
      values.push(note || null);
    }
    if (updated_by !== undefined) {
      updates.push(`updated_by = $${paramCount++}`);
      values.push(updated_by || null);
    }
    
    if (updates.length === 0) {
      return ok({ message: 'No fields to update' });
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(id); // For WHERE clause
    
    const row = await queryOne(
      `UPDATE daily SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    if (!row) return notFound('ไม่พบบันทึก');
    return ok(row);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const row = await queryOne(`DELETE FROM daily WHERE id = $1 RETURNING id`, [id]);
    if (!row) return notFound('ไม่พบบันทึก');
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
