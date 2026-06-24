# LINE Profile Sync - Auto Update Picture URL

## Problem
เมื่อ user LINE เปลี่ยนรูปโปรไฟล์ ระบบไม่ได้อัปเดต `picture_url` ใน database ทำให้แสดงรูปไม่ได้

## Solution
สร้างระบบอัปเดตรูปโปรไฟล์อัตโนมัติ 3 วิธี:
1. **Auto-sync ผ่าน Webhook** - อัปเดตทันทีเมื่อมี event
2. **Manual sync (single user)** - อัปเดตทีละคน
3. **Batch sync (all users)** - อัปเดตทุกคนพร้อมกัน

---

## Changes Made

### 1. เพิ่ม API: `/api/line/sync-profile`

**File:** `app/api/line/sync-profile/route.ts`

#### POST - Sync Single User
อัปเดตโปรไฟล์ของ user คนเดียว

**Request:**
```json
{
  "userId": "U1234567890abcdef..."
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "line_user_id": "U1234567890...",
    "display_name": "สมชาย",
    "line_display_name": "สมชาย ใจดี",
    "picture_url": "https://profile.line-scdn.net/..."
  },
  "synced": {
    "displayName": "สมชาย ใจดี",
    "pictureUrl": "https://profile.line-scdn.net/..."
  }
}
```

#### GET - Sync All Users
อัปเดตโปรไฟล์ของ users ทั้งหมด

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 50,
    "updated": 48,
    "failed": 2
  },
  "details": [
    {
      "userId": "U1234...",
      "status": "updated",
      "displayName": "สมชาย ใจดี"
    },
    {
      "userId": "U5678...",
      "status": "failed",
      "error": "Failed to get profile from LINE"
    }
  ]
}
```

**Features:**
- ✅ Rate limiting (100ms delay between requests)
- ✅ Error handling per user
- ✅ Detailed results with status

### 2. แก้ไข Webhook: Auto-Update

**File:** `app/api/webhook/line/route.ts`

#### Changed Behavior

**Before (ปัญหา):**
```sql
-- ใช้ COALESCE = ถ้ามีค่าเดิมแล้วไม่อัปเดต
picture_url = COALESCE(EXCLUDED.picture_url, app_user.picture_url)
```

**After (แก้แล้ว):**
```sql
-- อัปเดตทุกครั้ง = ได้รูปใหม่เสมอ
picture_url = $3
line_display_name = $2
updated_at = NOW()
```

#### Auto-Sync Events

**1. Follow Event (1:1 chat)**
```typescript
// เมื่อ user add เพื่อน → sync profile
const profile = await getLineProfile(userId);
await upsertUser(profile.userId, profile.displayName, profile.pictureUrl);
```

**2. Join Event (group chat)**
```typescript
// เมื่อ bot เข้ากลุ่ม → sync group info
const groupSummary = await getGroupSummary(groupId);
await upsertGroup(groupId, groupSummary.groupName, 'group', groupSummary.pictureUrl);
```

**3. MemberJoined Event**
```typescript
// เมื่อ user เข้ากลุ่ม → sync member profile
const memberProfile = await getGroupMemberProfile(groupId, userId);
await upsertGroupMember(groupId, userId, memberProfile.displayName, memberProfile.pictureUrl);
```

**4. Message Event**
```typescript
// (ไม่ sync ทุก message เพราะจะช้า)
// แต่ถ้าต้องการก็เพิ่มได้
```

### 3. Database Migration

**File:** `db/migrations/013_add_app_user_updated_at.sql`

เพิ่ม field `updated_at` ใน `app_user` table:
```sql
ALTER TABLE app_user 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_app_user_updated_at ON app_user(updated_at DESC);
```

**Purpose:**
- ติดตามว่าอัปเดตล่าสุดเมื่อไหร่
- ใช้สำหรับ sync batch (เรียงตามเวลา)
- Query users ที่นานไม่ได้อัปเดต

---

## Usage Examples

### 1. Auto-Sync (Automatic)

**Trigger:** ทุกครั้งที่มี LINE event
- User add เพื่อน → รูปและชื่ออัปเดตอัตโนมัติ
- Bot เข้ากลุ่ม → รูปกลุ่มอัปเดตอัตโนมัติ
- User เข้ากลุ่ม → รูป member อัปเดตอัตโนมัติ

**ไม่ต้องทำอะไร** - ระบบทำให้อัตโนมัติ!

### 2. Manual Sync (Single User)

เมื่อต้องการอัปเดตโปรไฟล์ของ user คนใดคนหนึ่ง:

```bash
curl -X POST https://your-domain.com/api/line/sync-profile \
  -H "Content-Type: application/json" \
  -d '{"userId": "U1234567890abcdef..."}'
```

**Use Case:**
- User บอกว่ารูปไม่ขึ้น
- Admin ต้องการอัปเดตทันที
- Testing

### 3. Batch Sync (All Users)

อัปเดตโปรไฟล์ของทุกคนพร้อมกัน:

```bash
curl https://your-domain.com/api/line/sync-profile
```

**Use Case:**
- ครั้งแรกหลัง deploy
- Maintenance รายเดือน
- หลังจากมี users เยอะแล้ว

**Warning:**
- ⚠️ ใช้เวลานาน (50 users ≈ 5-10 วินาที)
- ⚠️ Rate limited (100ms per user)
- ⚠️ ควรรันนอกเวลา peak

---

## Database Schema Changes

### app_user Table

**New Field:**
```sql
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**Updated Fields (behavior):**
- `line_display_name` - อัปเดตทุกครั้ง (ไม่ใช้ COALESCE)
- `picture_url` - อัปเดตทุกครั้ง (ไม่ใช้ COALESCE)

### line_groups Table

**Updated Fields (behavior):**
- `group_name` - อัปเดตทุกครั้ง
- `picture_url` - อัปเดตทุกครั้ง

### line_group_members Table

**Updated Fields (behavior):**
- `display_name` - อัปเดตทุกครั้ง
- `picture_url` - อัปเดตทุกครั้ง

---

## Technical Details

### LINE API Endpoints Used

1. **Get Profile (1:1 chat)**
```
GET https://api.line.me/v2/bot/profile/{userId}
```

2. **Get Group Summary**
```
GET https://api.line.me/v2/bot/group/{groupId}/summary
```

3. **Get Group Member Profile**
```
GET https://api.line.me/v2/bot/group/{groupId}/member/{userId}
```

### Rate Limiting

**Batch Sync:**
- 100ms delay between requests
- 10 requests per second
- Safe for LINE API rate limits (1000 requests/minute)

**Auto-Sync:**
- No delay (ตาม event เข้ามา)
- LINE controls rate via webhook

### Error Handling

**API Errors:**
- 404: User not found in LINE → skip
- 401: Invalid access token → return error
- 429: Rate limit → should not happen (we have delay)

**Database Errors:**
- User not found → return 404
- Connection error → return 500

---

## Migration Steps

### 1. Run Database Migration
```bash
psql "$DATABASE_URL" -f db/migrations/013_add_app_user_updated_at.sql
```

### 2. Deploy Code
```bash
git add .
git commit -m "feat: auto-sync LINE profile pictures"
git push
```

### 3. Initial Sync (Optional)
```bash
# Sync all existing users
curl https://your-domain.com/api/line/sync-profile
```

---

## Testing

### Test Auto-Sync

1. เปลี่ยนรูปโปรไฟล์ใน LINE
2. ส่งข้อความไปที่ bot
3. ตรวจสอบ database:
```sql
SELECT line_user_id, line_display_name, picture_url, updated_at 
FROM app_user 
WHERE line_user_id = 'YOUR_USER_ID';
```

### Test Manual Sync

```bash
# Sync single user
curl -X POST http://localhost:3000/api/line/sync-profile \
  -H "Content-Type: application/json" \
  -d '{"userId": "U1234567890abcdef..."}'
```

### Test Batch Sync

```bash
# Sync all users
curl http://localhost:3000/api/line/sync-profile
```

---

## Monitoring

### Check Sync Status

```sql
-- Users ที่อัปเดตล่าสุด
SELECT 
  line_user_id,
  display_name,
  line_display_name,
  picture_url IS NOT NULL as has_picture,
  updated_at
FROM app_user
WHERE line_user_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- Users ที่นานไม่ได้อัปเดต (> 30 วัน)
SELECT 
  line_user_id,
  display_name,
  updated_at,
  NOW() - updated_at as time_since_update
FROM app_user
WHERE line_user_id IS NOT NULL
  AND updated_at < NOW() - INTERVAL '30 days'
ORDER BY updated_at ASC;

-- Users ที่ไม่มีรูป
SELECT 
  line_user_id,
  display_name,
  picture_url
FROM app_user
WHERE line_user_id IS NOT NULL
  AND picture_url IS NULL;
```

---

## Performance Considerations

### Webhook Auto-Sync
- **Fast:** อัปเดตทันทีตาม event
- **No overhead:** ไม่มีการ poll
- **Reliable:** LINE รับประกันการส่ง event

### Manual Sync
- **Instant:** 1 user ≈ 100-200ms
- **On-demand:** ใช้เมื่อจำเป็น

### Batch Sync
- **Slow:** 50 users ≈ 5-10 วินาที
- **Safe:** มี rate limiting
- **Scalable:** รองรับ users ได้หลายร้อยคน

---

## Future Enhancements

### Nice to Have

1. **Scheduled Sync**
   - Cron job รันทุกวัน/สัปดาห์
   - Auto-sync users ที่นานไม่ได้อัปเดต

2. **Webhook Fallback**
   - ถ้า webhook ไม่ส่ง event → manual sync

3. **Image Caching**
   - Cache รูปใน CDN
   - ลด load จาก LINE servers

4. **Sync History**
   - เก็บประวัติการอัปเดต
   - Track รูปเก่าๆ

5. **Admin UI**
   - ปุ่ม "Sync Profile" ในหน้า admin
   - แสดงสถานะการ sync

---

## Troubleshooting

### รูปยังไม่อัปเดต

**Check 1:** ตรวจสอบว่า webhook ทำงาน
```bash
# ส่งข้อความไปที่ bot
# ดู logs ว่ามี event เข้ามาไหม
```

**Check 2:** Manual sync
```bash
curl -X POST https://your-domain.com/api/line/sync-profile \
  -H "Content-Type: application/json" \
  -d '{"userId": "U..."}'
```

**Check 3:** ตรวจสอบ database
```sql
SELECT picture_url, updated_at 
FROM app_user 
WHERE line_user_id = 'U...';
```

### Batch sync ล้มเหลว

**Issue:** Rate limit หรือ timeout

**Solution:**
- รันครั้งละน้อยๆ
- เพิ่ม delay เป็น 200ms
- แบ่งเป็น batch เล็กๆ

---

## Summary

✅ **Auto-sync** ผ่าน webhook - ทันทีเมื่อมี event  
✅ **Manual sync** - อัปเดตทีละคน  
✅ **Batch sync** - อัปเดตทุกคนพร้อมกัน  
✅ **Rate limiting** - ป้องกัน API abuse  
✅ **Error handling** - รองรับ edge cases  
✅ **Migration** - เพิ่ม updated_at field  

---

**Status:** ✅ Complete  
**API:** `POST/GET /api/line/sync-profile`  
**Webhook:** Auto-update on events  
**Migration:** `013_add_app_user_updated_at.sql`
