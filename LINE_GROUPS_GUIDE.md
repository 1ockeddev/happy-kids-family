# LINE Groups Management - คู่มือการใช้งาน

## ✅ สถานะการติดตั้ง

**Database:** ✅ สำเร็จ - สร้าง 3 ตารางแล้ว  
**Webhook:** ✅ สำเร็จ - รองรับ group events  
**API Routes:** ✅ สำเร็จ - 3 endpoints พร้อมใช้  
**Admin UI:** ✅ สำเร็จ - หน้าจัดการ groups พร้อมแล้ว  
**Navigation:** ✅ สำเร็จ - เพิ่มเมนูแล้ว

---

## 📋 ภาพรวม

ระบบจัดการ LINE Groups ช่วยให้:
- ✅ เชิญบอทเข้ากลุ่ม LINE
- ✅ ติดตามสมาชิกในกลุ่ม
- ✅ เก็บ log events ทั้งหมด (ข้อความ, เข้า-ออก)
- ✅ ดูสถิติและข้อมูลกลุ่ม
- ✅ ส่งข้อความไปกลุ่มได้

---

## 🚀 การใช้งาน

### 1. เชิญบอทเข้ากลุ่ม

**ใน LINE App:**
1. เปิดกลุ่ม LINE ที่ต้องการ
2. กดที่เมนู (≡) → เพิ่มเพื่อน
3. ค้นหา Official Account ของคุณ
4. เลือกเชิญเข้ากลุ่ม
5. บอทจะทักทายใน��ลุ่ม

**อัตโนมัติ:**
- ✅ บอทบันทึกข้อมูลกลุ่มลง database
- ✅ ดึงชื่อกลุ่มและรูปภาพ
- ✅ สร้าง record ใน `line_groups` table

### 2. ดูข้อมูลกลุ่มใน Admin

**เข้าหน้าจัดการ:**
```
http://localhost:3000/admin/line-groups
```

**Tab 1: กลุ่มทั้งหมด**
- ✅ ดูรายการกลุ่มที่บอทเข้าร่วม
- ✅ กรองตามสถานะ (Active/Inactive/All)
- ✅ ดูจำนวนสมาชิกและ events
- ✅ ดูวันที่บอทเข้าร่วม

**Tab 2: สมาชิก**
- ✅ ดูรายชื่อสมาชิกในกลุ่ม
- ✅ ดูสถานะ (Active/Left)
- ✅ เช็คว่าใครลงทะเบียนแล้ว (✓ badge)
- ✅ ดูวันเวลาเข้า-ออก

**Tab 3: Events**
- ✅ ดู log ข้อความทั้งหมด
- ✅ กรองตามประเภท (Message/Join/Leave)
- ✅ เห็นใครส่งข้อความอะไร
- ✅ ดู timestamp แต่ละ event

---

## 📊 Database Schema

### 1. `line_groups` - ตารางกลุ่ม

```sql
- id (UUID)
- line_group_id (string, unique) - Group ID จาก LINE
- group_name (string) - ชื่อกลุ่ม
- group_type ('group' | 'room')
- status ('active' | 'inactive')
- picture_url (text) - รูปโปรไฟล์กลุ่ม
- joined_at (timestamp) - เมื่อไหร่ที่บอทเข้า
- left_at (timestamp) - เมื่อไหร่ที่บอทออก
- created_at, updated_at
```

### 2. `line_group_members` - ตารางสมาชิก

```sql
- id (UUID)
- group_id (UUID, FK) - อ้างอิง line_groups
- user_id (UUID, FK) - อ้างอิง app_user (ถ้าลงทะเบียนแล้ว)
- line_user_id (string) - User ID จาก LINE
- display_name (string) - ชื่อที่แสดง
- picture_url (text) - รูปโปรไฟล์
- role ('member' | 'admin' | 'owner')
- joined_at (timestamp) - เมื่อไหร่เข้ากลุ่ม
- left_at (timestamp) - เมื่อไหร่ออกกลุ่ม
- status ('active' | 'left')
- created_at, updated_at
```

### 3. `line_group_events` - ตาราง Events

```sql
- id (UUID)
- group_id (UUID, FK) - อ้างอิง line_groups
- line_user_id (string) - ใครทำ action
- event_type (string) - 'message', 'join', 'leave', 'memberJoined', 'memberLeft'
- message_type (string) - 'text', 'image', 'video', etc.
- message_text (text) - ข้อความ (ถ้าเป็น text)
- message_data (JSONB) - ข้อมูล event ทั้งหมด
- created_at (timestamp)
```

---

## 🎯 Webhook Events ที่รองรับ

### 1. `join` - บอทเข้ากลุ่ม

**เกิดเมื่อ:** Admin เชิญบอทเข้ากลุ่ม

**การทำงาน:**
1. ดึงข้อมูลกลุ่มจาก LINE API
2. บันทึกลง `line_groups`
3. ส่งข้อความทักทาย

**ตัวอย่าง:**
```
สวัสดีค่ะทุกคน! 👋
ขอบคุณที่เชิญบอทเข้ากลุ่ม Happy Kids

พิมพ์ "Activity" เพื่อดูตารางกิจกรรมประจำสัปดาห์ได้เลยค่ะ 🎨
```

### 2. `leave` - บอทออกจากกลุ่ม

**เกิดเมื่อ:** Admin เตะบอทออกหรือบอทออกเอง

**การทำงาน:**
1. อัปเดต `status = 'inactive'`
2. บันทึก `left_at = NOW()`
3. กลุ่มจะยังอยู่ใน database แต่เป็น inactive

### 3. `memberJoined` - สมาชิกเข้ากลุ่ม

**เกิดเมื่อ:** มีคนใหม่เข้ากลุ่ม

**การทำงาน:**
1. ดึงข้อมูลสมาชิกจาก LINE API
2. บันทึกลง `line_group_members`
3. เก็บ log ใน `line_group_events`

### 4. `memberLeft` - สมาชิกออกกลุ่ม

**เกิดเมื่อ:** มีคนออกหรือถูกเตะออก

**การทำงาน:**
1. อัปเดต `status = 'left'`
2. บันทึก `left_at = NOW()`
3. เก็บ log ใน `line_group_events`

### 5. `message` - ข้อความในกลุ่ม

**เกิดเมื่อ:** มีคนส่งข้อความในกลุ่ม

**การทำงาน:**
1. เก็บข้อความลง `line_group_events`
2. ถ้าข้อความมีคำว่า "activity" → ส่งรูปตารางกิจกรรม

**รองรับ:**
- ✅ Text messages
- ✅ Images, videos, audio
- ✅ Stickers
- ✅ Files

---

## 🔌 API Endpoints

### 1. GET `/api/line/groups`

ดึงรายการกลุ่มทั้งหมด

**Query Parameters:**
- `status` - 'active', 'inactive', 'all' (default: 'active')

**Response:**
```json
{
  "groups": [
    {
      "id": "uuid",
      "line_group_id": "C1234567890abcdef...",
      "group_name": "ห้องผู้ปกครองดาวเหลือง",
      "group_type": "group",
      "status": "active",
      "picture_url": "https://...",
      "joined_at": "2026-06-19T10:00:00Z",
      "member_count": 25,
      "event_count": 150
    }
  ]
}
```

### 2. GET `/api/line/groups/[groupId]/members`

ดึงรายชื่อสมาชิกในกลุ่ม

**Query Parameters:**
- `status` - 'active', 'left', 'all' (default: 'active')

**Response:**
```json
{
  "members": [
    {
      "id": "uuid",
      "line_user_id": "U1234567890abcdef...",
      "display_name": "คุณสมชาย",
      "picture_url": "https://...",
      "role": "member",
      "joined_at": "2026-06-19T10:05:00Z",
      "status": "active",
      "app_user_id": "uuid",
      "app_user_role": "parent"
    }
  ]
}
```

### 3. GET `/api/line/groups/[groupId]/events`

ดึง events/messages ในกลุ่ม

**Query Parameters:**
- `eventType` - 'message', 'memberJoined', 'memberLeft', 'all'
- `limit` - จำนวน records (default: 100)
- `offset` - เริ่มจาก record ที่ (default: 0)

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "line_user_id": "U1234...",
      "event_type": "message",
      "message_type": "text",
      "message_text": "สวัสดีครับ",
      "created_at": "2026-06-19T10:10:00Z",
      "user_display_name": "คุณสมชาย"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## 🎨 Use Cases

### Use Case 1: แจ้งข่าวสารไปกลุ่มผู้ปกครอง

**สถานการณ์:** โรงเรียนต้องการแจ้งข่าวฉุกเฉินไปกลุ่มแต่ละห้อง

**วิธีทำ:**
1. ดูรายการกลุ่มที่ `/admin/line-groups`
2. เลือกกลุ่มที่ต้องการส่ง
3. ใช้ API `/api/line/send-flex` ส่งข้อความ
4. ระบุ `groupId` แทน `userId`

### Use Case 2: ตรวจสอบว่าผู้ปกครองอยู่กลุ่มไหนบ้าง

**สถานการณ์:** ต้องการรู้ว่าผู้ปกครองคนหนึ่งอยู่กลุ่มไหนบ้าง

**วิธีทำ:**
1. ไปที่ Admin → LINE Groups
2. ดูรายการกลุ่ม
3. คลิกดูสมาชิกในแต่ละกลุ่ม
4. ค้นหาชื่อหรือ User ID

### Use Case 3: ดู Analytics ข้อความในกลุ่ม

**สถานการณ์:** ต้องการดูว่ามีคนคุยกันในกลุ่มมั้ย

**วิธีทำ:**
1. ไปที่ Tab "Events"
2. เลือกกลุ่มที่ต้องการ
3. ดูจำนวน events และข้อความ
4. กรองเฉพาะ "message" type

### Use Case 4: ตรวจสอบว่าบอทถูกเตะออกหรือเปล่า

**สถานการณ์:** บอทหายไปจากกลุ่ม ต้องการตรวจสอบ

**วิธีทำ:**
1. ดูรายการกลุ่มโดยเลือก status = "inactive"
2. เช็ค `left_at` เพื่อดูว่าบอทออกเมื่อไหร่
3. ดู events log เพื่อดูสาเหตุ

---

## 🔧 Configuration

### ใน LINE Developers Console

**เปิด Group Chat:**
1. ไปที่ LINE Developers Console
2. เลือก Channel ของคุณ
3. ไปที่ **Messaging API** tab
4. เปิด **Allow bot to join group chats**: **ON**

**Webhook URL:**
```
https://your-domain.com/api/webhook/line
```

### Environment Variables

ต้องตั้งค่าเหมือน LINE Messages:
```env
LINE_CHANNEL_SECRET=xxx
LINE_CHANNEL_ACCESS_TOKEN=xxx
```

---

## 📈 Analytics Ideas

คุณสามารถวิเคราะห์ข้อมูลจาก database:

### 1. กลุ่มที่มีการใช้งานมากที่สุด
```sql
SELECT 
  g.group_name,
  COUNT(e.id) as message_count
FROM line_groups g
JOIN line_group_events e ON g.id = e.group_id
WHERE e.event_type = 'message'
GROUP BY g.id, g.group_name
ORDER BY message_count DESC;
```

### 2. สมาชิกที่ส่งข้อความมากที่สุด
```sql
SELECT 
  m.display_name,
  COUNT(e.id) as message_count
FROM line_group_members m
JOIN line_group_events e ON m.line_user_id = e.line_user_id
WHERE e.event_type = 'message'
GROUP BY m.id, m.display_name
ORDER BY message_count DESC;
```

### 3. เวลาที่มีคนคุยเยอะที่สุด
```sql
SELECT 
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as message_count
FROM line_group_events
WHERE event_type = 'message'
GROUP BY hour
ORDER BY hour;
```

---

## 🛠️ Troubleshooting

### บอทไม่บันทึกข้อมูลกลุ่ม

**เช็ค:**
1. Webhook URL ตั้งค่าถูกหรือไม่
2. "Allow bot to join group chats" เปิดหรือไม่
3. Database migration รันแล้วหรือไม่
4. ดู server logs

### สมาชิกไม่แสดง

**เช็ค:**
1. LINE API permissions ครบหรือไม่
2. กลุ่มเป็น "room" หรือ "group"
3. Bot มี permission ดึงข้อมูลสมาชิกหรือไม่

### Events ไม่เก็บ

**เช็ค:**
1. Webhook events ส่งมาจริงหรือไม่ (ดู logs)
2. Database connection
3. ตาราง `line_group_events` มีหรือไม่

---

## 🔐 Privacy & Security

### การเก็บข้อมูล:
- ✅ เก็บเฉพาะข้อมูลที่จำเป็น
- ✅ User IDs encrypted ไว้ปลอดภัย
- ✅ ข้อความเก็บใน JSONB ควบคุม access ได้

### ข้อควรระวัง:
- ⚠️ **อย่าแชร์ User IDs หรือ Group IDs ออกนอกระบบ**
- ⚠️ **อย่าเปิดเผยข้อความส่วนตัว**
- ⚠️ **ควบคุม access ให้เฉพาะ admin**
- ⚠️ **Backup database เป็นประจำ**

---

## 📚 Resources

- [LINE Messaging API - Groups](https://developers.line.biz/en/docs/messaging-api/group-chats/)
- [Webhook Events](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects)
- [LINE Bot Permissions](https://developers.line.biz/en/docs/messaging-api/permissions/)

---

## ✨ สรุป

ระบบ LINE Groups ให้คุณ:
- ✅ เชิญบอทเข้ากลุ่ม LINE
- ✅ ติดตามสมาชิกและ events
- ✅ เก็บ log ข้อความทั้งหมด
- ✅ วิเคราะห์ข้อมูลและสถิติ
- ✅ ส่งข้อความไปกลุ่มได้

**พร้อมใช้งานแล้ว!** 🎉

---

*Last updated: June 19, 2026*  
*Status: Production Ready*
