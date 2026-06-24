# Avatar Fallback & Auto Profile Sync

## Overview
เพิ่มฟีเจอร์:
1. **Avatar Fallback** - แสดงตัวอักษรเมื่อรูปโหลดไม่ได้
2. **Auto Profile Sync** - Sync profile จาก LIFF เมื่อเปิด mini app

---

## Problem & Solution

### Problem 1: รูปโหลดไม่ได้
**ปัญหา:** เมื่อ `picture_url` expired หรือโหลดไม่ได้ → แสดงเป็นช่องว่าง

**แก้ไข:** 
- แสดง **avatar ตัวอักษร** แทน (ตัวแรกของชื่อ)
- ใช้สีสันสดใสที่ consistent (ชื่อเดียวกัน = สีเดียวกัน)
- Smooth transition จากตัวอักษร → รูป

### Problem 2: Profile ไม่อัปเดต
**ปัญหา:** User เปลี่ยนรูปใน LINE แต่ระบบไม่รู้

**แก้ไข:**
- **Auto-sync** เมื่อเปิด mini app (ผ่าน LIFF)
- Delay 1 วินาทีเพื่อไม่ block app loading
- Update database ในพื้นหลัง

---

## Changes Made

### 1. Avatar Component with Fallback

**File:** `components/AppHeader.tsx`

#### Features
- ✅ แสดงตัวอักษรเมื่อไม่มีรูปหรือโหลดไม่ได้
- ✅ Loading state - แสดงตัวอักษรขณะโหลด
- ✅ Error handling - fallback เมื่อ `onError`
- ✅ Smooth transition - fade in/out
- ✅ Color generation - สีตามชื่อ (consistent)

#### Before
```tsx
// ถ้าไม่มี src → แสดงตัวอักษร
// ถ้ามี src → แสดงรูป (แต่ถ้า error → broken image)
return src ? <img ... /> : <div>...</div>
```

#### After
```tsx
// State สำหรับ error และ loading
const [imageError, setImageError] = useState(false);
const [imageLoading, setImageLoading] = useState(true);

// แสดงตัวอักษรถ้า: ไม่มี src หรือ error
const showInitials = !src || imageError;

// onError → fallback to initials
onError={() => setImageError(true)}

// Loading state → แสดงตัวอักษรก่อน
{imageLoading && <div>...</div>}
```

### 2. Standalone Avatar Component

**File:** `components/UserAvatar.tsx` ⭐ NEW

สำหรับใช้ในที่อื่นๆ (ไม่ใช่แค่ header):

```tsx
<UserAvatar 
  src={user.picture_url}
  name={user.display_name}
  size={40}
  fontSize={16}
/>
```

**Features:**
- Reusable component
- Customizable size และ fontSize
- Same fallback logic
- Color generation based on name

### 3. Auto Profile Sync Hook

**File:** `lib/useProfileSync.ts` ⭐ NEW

#### How It Works
```typescript
1. เช็คว่า LIFF login แล้วหรือยัง
2. ดึง profile จาก LIFF: liff.getProfile()
3. ส่งไปยัง API: POST /api/line/sync-profile
4. API update database
5. Run once per session (useRef)
```

#### Usage
```tsx
import { useProfileSync } from '@/lib/useProfileSync';

export default function MyComponent() {
  useProfileSync(); // เพียงแค่นี้!
  // ...
}
```

#### Timing
- Delay **1 วินาที** หลังจาก mount
- ไม่ block UI rendering
- Run in background

### 4. Updated Sync API

**File:** `app/api/line/sync-profile/route.ts`

#### Enhanced POST Endpoint

**Before:**
```typescript
// รับเฉพาะ userId → เรียก LINE API
const { userId } = await req.json();
const profile = await getLineProfile(userId);
```

**After:**
```typescript
// รับข้อมูลจาก LIFF ได้ด้วย (ไม่ต้องเรียก LINE API)
const { userId, displayName, pictureUrl } = await req.json();

if (displayName !== undefined) {
  // ใช้ข้อมูลจาก LIFF
  profile = { userId, displayName, pictureUrl };
} else {
  // เรียก LINE API
  profile = await getLineProfile(userId);
}
```

**Benefits:**
- ✅ รวดเร็วกว่า (ไม่ต้องเรียก LINE API)
- ✅ ได้ข้อมูล real-time จาก LIFF
- ✅ ลด API calls
- ✅ รองรับทั้ง 2 วิธี (LIFF & LINE API)

### 5. Integrated in UserLayout

**File:** `components/UserLayout.tsx`

เพิ่ม hook:
```tsx
export default function UserLayout({ children }) {
  // Auto-sync profile when app opens
  useProfileSync();
  
  // ... rest of code
}
```

**ผลลัพธ์:**
- ทุกหน้าที่ใช้ `UserLayout` จะ sync profile อัตโนมัติ
- Run once per session
- ไม่กระทบ performance

---

## User Experience Flow

### Scenario 1: รูปโหลดได้
```
1. User เปิด app
2. แสดงตัวอักษร (instant)
3. โหลดรูป... (background)
4. รูปโหลดเสร็จ → fade in
5. Sync profile ใน background (1s delay)
```

### Scenario 2: รูปโหลดไม่ได้
```
1. User เปิด app
2. แสดงตัวอักษร (instant)
3. พยายามโหลดรูป...
4. onError → กลับมาแสดงตัวอักษร (smooth)
5. Sync profile ใน background → อัปเดต URL ใหม่
6. ครั้งต่อไปจะได้รูปใหม่
```

### Scenario 3: ไม่มี picture_url
```
1. User เปิด app
2. แสดงตัวอักษร (ทันที)
3. Sync profile ใน background
4. ได้ picture_url ใหม่จาก LIFF
5. บันทึก database
6. Refresh หรือเปิดครั้งต่อไป → แสดงรูป
```

---

## Avatar Initials Logic

### Thai Names
```typescript
"สมชาย" → "ส"
"ประยุทธ์" → "ป"
"ก." → "ก"
```

### English Names
```typescript
"John Doe" → "JD" (2 ตัวแรก)
"Alice" → "A"
"Bob" → "B"
```

### Fallback
```typescript
null → "?"
"" → "?"
undefined → "?"
```

---

## Color Palette

Avatar ใช้สี 8 สี rotated by character code:

```typescript
const colors = [
  '#E8754A', // Orange
  '#6366f1', // Indigo
  '#4A90B8', // Blue
  '#4CAF76', // Green
  '#F5A623', // Amber
  '#E85C5C', // Red
  '#ec4899', // Pink
  '#34d399', // Emerald
];

const bg = colors[(initial.charCodeAt(0)) % colors.length];
```

**ตัวอย่าง:**
- "ส" (Thai) → สีตาม charCodeAt
- "A" → สีตาม charCodeAt
- ชื่อเดียวกัน = สีเดียวกัน (consistent)

---

## API Request/Response

### LIFF Sync (Recommended)
```bash
POST /api/line/sync-profile
Content-Type: application/json

{
  "userId": "U1234567890...",
  "displayName": "สมชาย ใจดี",
  "pictureUrl": "https://profile.line-scdn.net/...",
  "statusMessage": "Hello!"
}
```

### LINE API Sync (Fallback)
```bash
POST /api/line/sync-profile
Content-Type: application/json

{
  "userId": "U1234567890..."
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "line_user_id": "U1234...",
    "display_name": "สมชาย",
    "line_display_name": "สมชาย ใจดี",
    "picture_url": "https://..."
  },
  "synced": {
    "displayName": "สมชาย ใจดี",
    "pictureUrl": "https://..."
  }
}
```

---

## Performance

### Avatar Component
- **Instant render** - ตัวอักษรแสดงทันที (no loading)
- **Lazy image load** - รูปโหลดในพื้นหลัง
- **Small state** - 2 booleans only
- **No re-render** - pure CSS transitions

### Profile Sync
- **1 second delay** - ไม่ block initial render
- **One-time per session** - useRef prevents re-run
- **Background API call** - ไม่รอ response
- **Minimal payload** - userId + profile data only

### Network
- **LIFF data** - already in memory (no API call)
- **Single API call** - POST /api/line/sync-profile
- **Small request** - ~200 bytes
- **Fast response** - database UPDATE only

---

## Testing

### Test Avatar Fallback

1. **No picture_url:**
```tsx
<Avatar src={null} name="สมชาย" />
// → แสดง "ส" สีสัน
```

2. **Invalid URL:**
```tsx
<Avatar src="https://invalid.url/image.jpg" name="John Doe" />
// → แสดง "JD" สีสัน
```

3. **Loading state:**
```tsx
<Avatar src="https://slow-server.com/image.jpg" name="Alice" />
// → แสดง "A" ก่อน → จากนั้นรูป
```

### Test Profile Sync

1. **Check console logs:**
```
[Profile Sync] Got LIFF profile: { userId: "U...", displayName: "...", hasPicture: true }
[Profile Sync] Success: { success: true, ... }
```

2. **Check database:**
```sql
SELECT line_user_id, line_display_name, picture_url, updated_at
FROM app_user
WHERE line_user_id = 'YOUR_USER_ID'
ORDER BY updated_at DESC;
```

3. **Test timing:**
```
- App opens at 0s
- Profile sync starts at 1s
- API completes at ~1.2s
```

---

## Troubleshooting

### Avatar ไม่แสดง
**Check:**
1. `name` prop มีค่าหรือไม่
2. Console มี errors หรือไม่
3. CSS conflicts หรือไม่

**Debug:**
```tsx
<Avatar src={user.picture_url} name={user.display_name} />
console.log({ src: user.picture_url, name: user.display_name });
```

### Profile ไม่ sync
**Check:**
1. LIFF initialized แล้วหรือยัง
2. User logged in หรือไม่
3. Console logs มีหรือไม่
4. API response อะไร

**Debug:**
```tsx
// Add to useProfileSync.ts
console.log('LIFF isLoggedIn:', liff.isLoggedIn());
console.log('LIFF profile:', await liff.getProfile());
```

### รูปยังไม่อัปเดต
**Solution:**
1. รอ 1-2 วินาที (sync delay)
2. Refresh app
3. Check database ว่า update แล้วหรือยัง
4. Manual sync: `curl -X POST .../api/line/sync-profile -d '{"userId":"..."}'`

---

## Files Summary

### New Files
1. `components/UserAvatar.tsx` - Reusable avatar component
2. `lib/useProfileSync.ts` - Auto-sync hook
3. `AVATAR_FALLBACK_AND_SYNC.md` - This documentation

### Modified Files
1. `components/AppHeader.tsx` - Enhanced Avatar with error handling
2. `components/UserLayout.tsx` - Added useProfileSync()
3. `app/api/line/sync-profile/route.ts` - Support LIFF data

---

## Future Enhancements

### Nice to Have
1. **Retry logic** - ลองโหลดรูปใหม่ถ้า fail
2. **Cache** - เก็บรูปใน localStorage
3. **CDN** - host รูปเอง แทน LINE servers
4. **Compress** - resize/compress รูปก่อนเก็บ
5. **Skeleton** - animated loading placeholder
6. **Badge** - online/offline indicator
7. **Upload** - ให้ user upload รูปเอง

---

## Summary

✅ **Avatar Fallback**
- แสดงตัวอักษรเมื่อรูปไม่ได้
- Loading state smooth
- Error handling ครบถ้วน
- Color generation consistent

✅ **Auto Profile Sync**
- Sync เมื่อเปิด app
- ใช้ LIFF data (fast)
- Background operation
- One-time per session

✅ **User Experience**
- Instant feedback (ไม่ต้องรอ)
- Smooth transitions
- No blocking
- Always shows something

---

**Status:** ✅ Complete  
**Components:** Avatar (AppHeader), UserAvatar (standalone)  
**Hook:** useProfileSync  
**API:** Enhanced POST /api/line/sync-profile  
**Integration:** UserLayout (auto-run)
