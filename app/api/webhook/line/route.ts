import { queryOne, query } from '@/lib/db';
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

// ── LINE: get group summary ───────────────────────────────────
async function getGroupSummary(groupId: string) {
  try {
    const r = await fetch(`https://api.line.me/v2/bot/group/${groupId}/summary`, {
      headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
    });
    if (!r.ok) return null;
    return await r.json() as { groupId: string; groupName: string; pictureUrl?: string };
  } catch { return null; }
}

// ── LINE: get group member profile ───────────────────────────
async function getGroupMemberProfile(groupId: string, userId: string) {
  try {
    const r = await fetch(`https://api.line.me/v2/bot/group/${groupId}/member/${userId}`, {
      headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
    });
    if (!r.ok) return null;
    return await r.json() as { userId: string; displayName: string; pictureUrl?: string };
  } catch { return null; }
}

// ── DB: upsert user ───────────────────────────────────────────
async function upsertUser(userId: string, displayName: string, pictureUrl?: string) {
  return queryOne(
    `INSERT INTO app_user (id, line_user_id, role, status, display_name, line_display_name, picture_url)
     VALUES (gen_random_uuid(), $1, 'parent', 'active', $2, $2, $3)
     ON CONFLICT (line_user_id) DO UPDATE SET
       line_display_name = $2,
       picture_url  = $3,
       status       = 'active',
       updated_at   = NOW()
     RETURNING id, display_name`,
    [userId, displayName, pictureUrl ?? null]
  );
}

// ── DB: upsert group ──────────────────────────────────────────
async function upsertGroup(groupId: string, groupName: string, groupType: string, pictureUrl?: string) {
  return queryOne(
    `INSERT INTO line_groups (id, line_group_id, group_name, group_type, status, picture_url, joined_at)
     VALUES (gen_random_uuid(), $1, $2, $3, 'active', $4, NOW())
     ON CONFLICT (line_group_id) DO UPDATE SET
       group_name = $2,
       picture_url = $4,
       status = 'active',
       joined_at = COALESCE(line_groups.joined_at, NOW()),
       updated_at = NOW()
     RETURNING id, line_group_id, group_name`,
    [groupId, groupName, groupType, pictureUrl ?? null]
  );
}

// ── DB: upsert group member ───────────────────────────────────
async function upsertGroupMember(groupDbId: string, lineUserId: string, displayName: string, pictureUrl?: string) {
  // Get user_id if exists
  const user = await queryOne(
    `SELECT id FROM app_user WHERE line_user_id = $1`,
    [lineUserId]
  ).catch(() => null);

  return queryOne(
    `INSERT INTO line_group_members (id, group_id, user_id, line_user_id, display_name, picture_url, status, joined_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'active', NOW())
     ON CONFLICT (group_id, line_user_id) DO UPDATE SET
       display_name = $4,
       picture_url = $5,
       status = 'active',
       left_at = NULL,
       updated_at = NOW()
     RETURNING id`,
    [groupDbId, user?.id ?? null, lineUserId, displayName, pictureUrl ?? null]
  );
}

// ── DB: mark group member left ────────────────────────────────
async function markGroupMemberLeft(groupDbId: string, lineUserId: string) {
  return queryOne(
    `UPDATE line_group_members 
     SET status = 'left', left_at = NOW(), updated_at = NOW()
     WHERE group_id = $1 AND line_user_id = $2
     RETURNING id`,
    [groupDbId, lineUserId]
  );
}

// ── DB: mark group left ───────────────────────────────────────
async function markGroupLeft(groupDbId: string) {
  return queryOne(
    `UPDATE line_groups 
     SET status = 'inactive', left_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [groupDbId]
  );
}

// ── DB: log group event ───────────────────────────────────────
async function logGroupEvent(groupDbId: string, lineUserId: string | null, eventType: string, messageType: string | null, messageText: string | null, messageData: any) {
  return queryOne(
    `INSERT INTO line_group_events (id, group_id, line_user_id, event_type, message_type, message_text, message_data, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
     RETURNING id`,
    [groupDbId, lineUserId, eventType, messageType, messageText, JSON.stringify(messageData)]
  );
}

// ── Google Drive: ดึงไฟล์ล่าสุดใน folder ─────────────────────
async function getLatestFileFromDrive(): Promise<{ id: string; name: string; mimeType: string } | null> {
  if (!GDRIVE_FOLDER_ID || !GDRIVE_API_KEY) {
    console.error('[Drive] Missing env: GDRIVE_FOLDER_ID or GDRIVE_API_KEY');
    return null;
  }
  try {
    const q = encodeURIComponent(
      `'${GDRIVE_FOLDER_ID}' in parents and trashed = false and mimeType contains 'image/'`
    );
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&pageSize=1&fields=files(id,name,mimeType)&key=${GDRIVE_API_KEY}`;
    console.log('[Drive] fetching:', url.replace(GDRIVE_API_KEY, '***'));
    const r = await fetch(url);
    const data = await r.json();
    console.log('[Drive] response status:', r.status, JSON.stringify(data).slice(0, 300));
    if (!r.ok) return null;
    return data.files?.[0] ?? null;
  } catch (e) {
    console.error('[Drive] error:', e);
    return null;
  }
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
      const groupId    = event.source?.groupId;
      const roomId     = event.source?.roomId;
      const replyToken = event.replyToken;
      const sourceType = event.source?.type; // 'user', 'group', 'room'

      // ─────────────────────────────────────────────────────────
      // 1:1 CHAT EVENTS
      // ─────────────────────────────────────────────────────────
      
      // ── follow (1:1) ──────────────────────────────────────────
      if (event.type === 'follow' && userId && sourceType === 'user') {
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

      // ── unfollow (1:1) ────────────────────────────────────────
      if (event.type === 'unfollow' && userId && sourceType === 'user') {
        await queryOne(
          `UPDATE app_user SET status = 'inactive' WHERE line_user_id = $1`,
          [userId]
        );
        console.log(`[LINE OA] unfollow: ${userId}`);
      }

      // ─────────────────────────────────────────────────────────
      // GROUP CHAT EVENTS
      // ─────────────────────────────────────────────────────────

      // ── join (bot joins group) ────────────────────────────────
      if (event.type === 'join' && (groupId || roomId)) {
        const targetId = groupId || roomId;
        const targetType = groupId ? 'group' : 'room';
        
        // Get group summary
        let groupName = 'Unknown Group';
        let pictureUrl: string | undefined;
        
        if (groupId) {
          const groupSummary = await getGroupSummary(groupId);
          if (groupSummary) {
            groupName = groupSummary.groupName;
            pictureUrl = groupSummary.pictureUrl;
          }
        }

        // Save group to database
        const group = await upsertGroup(targetId, groupName, targetType, pictureUrl);
        console.log(`[LINE OA] Bot joined ${targetType}: ${groupName} (${targetId})`);

        // ส่งข้อความทักทาย
        await replyMessage(replyToken, [{
          type: 'text',
          text: `สวัสดีค่ะทุกคน! 👋\nขอบคุณที่เชิญบอทเข้ากลุ่ม Happy Kids\n\nพิมพ์ "Activity" เพื่อดูตารางกิจกรรมประจำสัปดาห์ได้เลยค่ะ 🎨`,
        }]);
      }

      // ── leave (bot leaves group) ──────────────────────────────
      if (event.type === 'leave' && (groupId || roomId)) {
        const targetId = groupId || roomId;
        
        // Get group from database
        const group = await queryOne<{ id: string }>(
          `SELECT id FROM line_groups WHERE line_group_id = $1`,
          [targetId]
        ).catch(() => null);

        if (group) {
          await markGroupLeft(group.id);
          console.log(`[LINE OA] Bot left group: ${targetId}`);
        }
      }

      // ── memberJoined (user joins group) ───────────────────────
      if (event.type === 'memberJoined' && (groupId || roomId)) {
        const targetId = groupId || roomId;
        const targetType = groupId ? 'group' : 'room';
        const joinedMembers = event.joined?.members || [];

        // Ensure group exists in database
        let group: { id: string } | null = await queryOne<{ id: string }>(
          `SELECT id FROM line_groups WHERE line_group_id = $1`,
          [targetId]
        ).catch(() => null);

        if (!group) {
          // Create group if not exists
          const newGroup = await upsertGroup(targetId, 'Unknown Group', targetType);
          group = newGroup as { id: string };
        }

        // Add each member
        for (const member of joinedMembers) {
          const memberUserId = member.userId;
          if (!memberUserId) continue;

          // Get member profile
          let displayName = 'Unknown';
          let memberPictureUrl: string | undefined;

          if (groupId) {
            const memberProfile = await getGroupMemberProfile(groupId, memberUserId);
            if (memberProfile) {
              displayName = memberProfile.displayName;
              memberPictureUrl = memberProfile.pictureUrl;
            }
          }

          // Save member
          await upsertGroupMember(group.id, memberUserId, displayName, memberPictureUrl);
          
          // Log event
          await logGroupEvent(group.id, memberUserId, 'memberJoined', null, null, event);
          
          console.log(`[LINE OA] Member joined ${targetType}: ${displayName} (${memberUserId})`);
        }
      }

      // ── memberLeft (user leaves group) ────────────────────────
      if (event.type === 'memberLeft' && (groupId || roomId)) {
        const targetId = groupId || roomId;
        const leftMembers = event.left?.members || [];

        // Get group from database
        const group = await queryOne<{ id: string }>(
          `SELECT id FROM line_groups WHERE line_group_id = $1`,
          [targetId]
        ).catch(() => null);

        if (group) {
          for (const member of leftMembers) {
            const memberUserId = member.userId;
            if (!memberUserId) continue;

            // Mark as left
            await markGroupMemberLeft(group.id, memberUserId);
            
            // Log event
            await logGroupEvent(group.id, memberUserId, 'memberLeft', null, null, event);
            
            console.log(`[LINE OA] Member left: ${memberUserId}`);
          }
        }
      }

      // ─────────────────────────────────────────────────────────
      // MESSAGE EVENTS (both 1:1 and group)
      // ─────────────────────────────────────────────────────────
      
      // ── message ───────────────────────────────────────────────
      if (event.type === 'message' && replyToken) {
        const messageType = event.message?.type;
        const messageText = event.message?.type === 'text' ? event.message.text : null;

        // Log group message
        if ((groupId || roomId) && messageText) {
          const targetId = groupId || roomId;
          
          // Get or create group
          let group: { id: string } | null = await queryOne<{ id: string }>(
            `SELECT id FROM line_groups WHERE line_group_id = $1`,
            [targetId]
          ).catch(() => null);

          if (!group) {
            const targetType = groupId ? 'group' : 'room';
            const newGroup = await upsertGroup(targetId, 'Unknown Group', targetType);
            group = newGroup as { id: string };
          }

          // Log message event
          await logGroupEvent(
            group.id,
            userId ?? null,
            'message',
            messageType,
            messageText,
            event
          );
        }

        // Handle text messages (both 1:1 and group)
        if (messageType === 'text' && messageText) {
          const text = messageText.trim().toLowerCase();
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
                  text: `📅 ตารางกิจกรรมประจำสัปดาห์ล่าสุด`,
                },
                buildDriveImageMessage(file.id),
              ]);
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[LINE Webhook] Error:', err);
    return serverError(err);
  }
}

export async function GET() {
  return NextResponse.json({ status: 'LINE Webhook OK' });
}
