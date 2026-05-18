import { getSupabase, BUCKET } from '@/lib/storage';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// POST /api/upload
// Body: multipart/form-data  { file: File (webp), child_id: string }
// Returns: { url: string }
export async function POST(req: NextRequest) {
  try {
    const form     = await req.formData();
    const file     = form.get('file') as File | null;
    const child_id = form.get('child_id') as string | null;

    if (!file)     return badRequest('ไม่พบไฟล์');
    if (!child_id) return badRequest('ไม่พบ child_id');
    if (!file.type.includes('webp') && !file.type.includes('image')) return badRequest('ต้องเป็นไฟล์รูปภาพ');

    // path: avatars/{child_id}.webp  — overwrite ถ้ามีอยู่แล้ว
    const path   = `${child_id}.webp`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await getSupabase().storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType:  'image/webp',
        upsert:       true,   // overwrite existing
        cacheControl: '3600',
      });

    if (error) throw error;

    // public URL
    const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(path);
    // เพิ่ม cache-bust query string เพื่อ force refresh หลัง re-upload
    const url = `${data.publicUrl}?t=${Date.now()}`;

    return ok({ url });
  } catch (err) {
    return serverError(err);
  }
}

// DELETE /api/upload?child_id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const child_id = req.nextUrl.searchParams.get('child_id');
    if (!child_id) return badRequest('ไม่พบ child_id');
    await getSupabase().storage.from(BUCKET).remove([`${child_id}.webp`]);
    return ok({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
