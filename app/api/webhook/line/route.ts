import { queryOne } from '@/lib/db';
import { serverError } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CHANNEL_SECRET       = process.env.LINE_CHANNEL_SECRET        ?? '';
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN  ?? '';
const GDRIVE_FOLDER_ID     = process.env.GDRIVE_ACTIVITY_FOLDER_ID  ?? '';
const GDRIVE_API_KEY       = process.env.GDRIVE_API_KEY              ?? '';

// ── Keywords ──────────────────────────────────────────────────
const ACTIVITY_KEYWORDS = [
  'activity', 'ตารางกิจกรรม', 'กิจกรรมประจำสัปดาห์',
  'activity ตารางกิจกรรมประจำสัปดาห์',
];

// ── Signature verify ─────────────────────────────────────────
function verifySignature(body: string, sig: string) {
  if (!CHANNEL_SECRET) return true;
  const hash = crypto.createHmac('SHA256', CHANNEL_SECRET).update(body).digest('base64');
  return hash === sig;
}

// ── LINE: reply message ───────────────────────────────────────
async function replyMessage(replyToken: string, messages: object[]) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
}

// ── LINE: get profile ─────────────────────────────────────────
async function getLineProfile(userId: string) {
  try {
    const r = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
    });
    if (!r.ok) return null;
    return await r.json() as { userId: string; displayName: string; pictureUrl?: string };
  } catch { return null; }
}

// ── DB: upsert user ───────────────────────────────────────────
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

// ── Google Drive: ดึงไฟล์ล่าสุดใน folder ─────────────────────
async function getLatestFileFromDrive(): Promise<{ id: string; name: string; mimeType: string } | null> {
  if (!GDRIVE_FOLDER_ID || !GDRIVE_API_KEY) return null;
  try {
    const q = encodeURIComponent(
      `'${GDRIVE_FOLDER_ID}' in parents and trashed = false and mimeType contains 'image/'`
    );
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&pageSize=1&fields=files(id,name,mimeType)&key=${GDRIVE_API_KEY}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    return data.files?.[0] ?? null;
  } catch { return null; }
}

// ── Build LINE image message from Drive file ──────────────────
function buildDriveImageMessage(fileId: string) {
  // Google Drive direct image URL (ต้องเป็น public folder)
  const imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
  return {
    type: 'image',
    originalContentUrl: imageUrl,
    previewImageUrl:    imageUrl,
  };
}

// ── Webhook POST ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const rawBody  = await req.text();
    const sig      = req.headers.get('x-line-signature') ?? '';

    if (!verifySignature(rawBody, sig)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { events = [] } = JSON.parse(rawBody);

    for (const event of events) {
      const userId     = event.source?.userId;
      const replyToken = event.replyToken;

      // ── follow ─────────────────────────────────────────────
      if (event.type === 'follow' && userId) {
        const profile = await getLineProfile(userId);
        if (profile) {
          await upsertUser(profile.userId, profile.displayName, profile.pictureUrl);
          console.log(`[LINE OA] follow: ${profile.displayName}`);

          // ส่งข้อความต้อนรับ
          await replyMessage(replyToken, [{
            type: 'text',
            text: `สวัสดีค่ะ ${profile.displayName} 👋\nยินดีต้อนรับสู่ Happy Kids!\n\nพิมพ์ "Activity" เพื่อดูตารางกิจกรรมประจำสัปดาห์ได้เลยค่ะ 🎨`,
          }]);
        }
      }

      // ── unfollow ────────────────────────────────────────────
      if (event.type === 'unfollow' && userId) {
        await queryOne(
          `UPDATE app_user SET status = 'inactive' WHERE line_user_id = $1`,
          [userId]
        );
      }

      // ── message ─────────────────────────────────────────────
      if (event.type === 'message' && event.message?.type === 'text' && replyToken) {
        const text = (event.message.text as string).trim().toLowerCase();
        const isActivityKeyword = ACTIVITY_KEYWORDS.some(k => text.includes(k.toLowerCase()));

        if (isActivityKeyword) {
          const file = await getLatestFileFromDrive();

          if (!file) {
            await replyMessage(replyToken, [{
              type: 'text',
              text: 'ขออภัยค่ะ ยังไม่มีตารางกิจกรรมในขณะนี้ กรุณาติดต่อคุณครูโดยตรงค่ะ 🙏',
            }]);
          } else {
            await replyMessage(replyToken, [
              {
                type: 'text',
                text: `📅 ตารางกิจกรรมประจำสัปดาห์ล่าสุด\n📎 ${file.name}`,
              },
              buildDriveImageMessage(file.id),
            ]);
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}

export async function GET() {
  return NextResponse.json({ status: 'LINE Webhook OK' });
}
