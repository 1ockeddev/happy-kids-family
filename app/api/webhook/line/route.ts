import { queryOne } from '@/lib/db';
import { serverError } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET ?? '';
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '';

// verify LINE signature
function verifySignature(body: string, signature: string): boolean {
  if (!CHANNEL_SECRET) return true; // dev mode: skip
  const hash = crypto
    .createHmac('SHA256', CHANNEL_SECRET)
    .update(body)
    .digest('base64');
  return hash === signature;
}

// ดึง profile จาก LINE API
async function getLineProfile(userId: string) {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
    });
    if (!res.ok) return null;
    return await res.json() as { userId: string; displayName: string; pictureUrl?: string };
  } catch { return null; }
}

// upsert user เข้า DB
async function upsertUser(userId: string, displayName: string, pictureUrl?: string) {
  return queryOne(
    `INSERT INTO app_user (id, line_user_id, role, status, display_name, picture_url)
     VALUES (gen_random_uuid(), $1, 'parent', 'active', $2, $3)
     ON CONFLICT (line_user_id) DO UPDATE SET
       display_name = COALESCE(EXCLUDED.display_name, app_user.display_name),
       picture_url  = COALESCE(EXCLUDED.picture_url,  app_user.picture_url)
     RETURNING id, display_name`,
    [userId, displayName, pictureUrl ?? null]
  );
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-line-signature') ?? '';

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const events = body.events ?? [];

    for (const event of events) {
      const userId = event.source?.userId;
      if (!userId) continue;

      if (event.type === 'follow') {
        // คน add OA → ดึง profile แล้วบันทึก
        const profile = await getLineProfile(userId);
        if (profile) {
          await upsertUser(profile.userId, profile.displayName, profile.pictureUrl);
          console.log(`[LINE OA] follow: ${profile.displayName} (${userId})`);
        }
      }

      if (event.type === 'unfollow') {
        // block OA → set inactive
        await queryOne(
          `UPDATE app_user SET status = 'inactive' WHERE line_user_id = $1`,
          [userId]
        );
        console.log(`[LINE OA] unfollow: ${userId}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}

// LINE webhook verification
export async function GET() {
  return NextResponse.json({ status: 'LINE Webhook OK' });
}
