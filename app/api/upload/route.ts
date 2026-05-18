import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const IS_LOCAL = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                  process.env.NODE_ENV === 'development';

// local: เก็บไว้ที่ public/uploads/avatars/
const LOCAL_DIR     = path.join(process.cwd(), 'public', 'uploads', 'avatars');
const LOCAL_URL_BASE = '/uploads/avatars';

/* ── POST /api/upload ──────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const form     = await req.formData();
    const file     = form.get('file') as File | null;
    const child_id = form.get('child_id') as string | null;

    if (!file)     return badRequest('ไม่พบไฟล์');
    if (!child_id) return badRequest('ไม่พบ child_id');

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${child_id}.webp`;

    if (IS_LOCAL) {
      /* ── Local filesystem ── */
      await fs.mkdir(LOCAL_DIR, { recursive: true });
      await fs.writeFile(path.join(LOCAL_DIR, filename), buffer);
      const url = `${LOCAL_URL_BASE}/${filename}?t=${Date.now()}`;
      return ok({ url, storage: 'local' });

    } else {
      /* ── Supabase Storage ── */
      const { getSupabase, BUCKET } = await import('@/lib/storage');
      const { error } = await getSupabase().storage
        .from(BUCKET)
        .upload(filename, buffer, { contentType: 'image/webp', upsert: true, cacheControl: '3600' });
      if (error) throw error;
      const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(filename);
      return ok({ url: `${data.publicUrl}?t=${Date.now()}`, storage: 'supabase' });
    }
  } catch (err) {
    return serverError(err);
  }
}

/* ── DELETE /api/upload?child_id=xxx ──────────────────────── */
export async function DELETE(req: NextRequest) {
  try {
    const child_id = req.nextUrl.searchParams.get('child_id');
    if (!child_id) return badRequest('ไม่พบ child_id');
    const filename = `${child_id}.webp`;

    if (IS_LOCAL) {
      await fs.unlink(path.join(LOCAL_DIR, filename)).catch(() => {});
    } else {
      const { getSupabase, BUCKET } = await import('@/lib/storage');
      await getSupabase().storage.from(BUCKET).remove([filename]);
    }
    return ok({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}

/* ── GET /uploads/avatars/:filename (local dev server) ─────── */
// Next.js serve ไฟล์ใน public/ อัตโนมัติ ไม่ต้องทำอะไรเพิ่ม
// แต่ถ้าต้องการ stream โดยตรงก็ทำได้แบบนี้:
export async function GET(req: NextRequest) {
  const child_id = req.nextUrl.searchParams.get('child_id');
  if (!child_id) return badRequest('ไม่พบ child_id');
  try {
    const filePath = path.join(LOCAL_DIR, `${child_id}.webp`);
    const buf = await fs.readFile(filePath);
    return new NextResponse(buf, { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=3600' } });
  } catch {
    return NextResponse.json({ error: 'ไม่พบรูปภาพ' }, { status: 404 });
  }
}
