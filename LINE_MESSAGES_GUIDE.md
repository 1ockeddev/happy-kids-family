# LINE Flex Messages Management

## ✅ สถานะการติดตั้ง

**Database:** ✅ สำเร็จ - ตาราง `line_flex_templates` ถูกสร้างแล้ว พร้อม sample template  
**Frontend:** ✅ สำเร็จ - หน้า admin พร้อมใช้งานที่ `/admin/line-messages`  
**API Routes:** ✅ สำเร็จ - ทุก endpoints ทำงานพร้อม  
**Navigation:** ✅ สำเร็จ - เพิ่มเมนูใน admin sidebar แล้ว  
**Webhook:** ✅ มีอยู่แล้ว - `/api/webhook/line` รองรับ follow, unfollow, message events

## 🎯 ขั้นตอนถัดไป

1. **ทดสอบหน้า Admin:**
   - เปิด dev server: `npm run dev`
   - เข้า http://localhost:3000/admin/line-messages
   - ลองสร้าง template ใหม่
   - ดู template ที่มีอยู่

2. **ทดสอบส่ง Flex Message:**
   - ต้องมี LINE User ID ของผู้ทดสอบ
   - วิธีได้ User ID: ดูจาก webhook logs เมื่อมีคนส่งข้อความมา
   - หรือใช้ LINE Developer tools

3. **ตรวจสอบ Webhook:**
   - ไปที่ LINE Developers Console
   - ตรวจสอบ Webhook URL ถูกต้อง
   - ทดสอบส่งข้อความไปที่ LINE Official Account

4. **Deploy to Production:**
   - อัปเดต Webhook URL ใน LINE Console เป็น production URL
   - ตรวจสอบ Environment Variables บน production

---

## ภาพรวม

ระบบจัดการ LINE Flex Messages สำหรับ Happy Kids Family - ช่วยให้ admin สามารถ:
- ส่ง Flex Message ทดสอบไปยังผู้ใช้
- จัดการ Templates สำหรับข้อความที่ใช้บ่อย
- ดูข้อมูล Webhook configuration

## การติดตั้ง

### 1. สร้าง Database Table ✅ เสร็จแล้ว

รัน migration:
```bash
export DATABASE_URL="postgresql://postgres:0000@localhost:5432/school_attendance"
psql "$DATABASE_URL" -f db/migrations/003_add_line_flex_templates.sql
```

**สถานะ:** ✅ ทำแล้ว - มี 1 sample template (Welcome Message)

### 2. ตั้งค่า Environment Variables ✅ ตั้งค่าแล้ว

ใน `.env.local`:
```env
LINE_CHANNEL_SECRET=YOUR_CHANNEL_SECRET
LINE_CHANNEL_ACCESS_TOKEN=YOUR_CHANNEL_ACCESS_TOKEN
```

**สถานะ:** ✅ มีอยู่แล้วใน `.env.local`

### 3. ตั้งค่า LINE Developers Console ⚠️ ต้องทำ

1. ไปที่ https://developers.line.biz/console/
2. เลือก Channel ของคุณ
3. ไปที่ **Messaging API** tab
4. ตั้งค่า **Webhook URL**:
   ```
   https://your-domain.com/api/webhook/line
   ```
5. เปิด **Use webhook**: ON
6. เปิด **Allow bot to join group chats**: ตามต้องการ

**สถานะ:** ⚠️ ต้องตรวจสอบว่า Webhook URL ตั้งค่าถูกต้อง

## การใช้งาน

### เข้าหน้าจัดการ

ไปที่: `/admin/line-messages`

### Tab: ส่งข้อความ

1. **ใส่ LINE User ID** - User ID ของผู้รับ (เช่น `U1234567890abcdef...`)
2. **เลือก Template** - เลือกจาก templates ที่บันทึกไว้ หรือ
3. **ใส่ Custom JSON** - สร้าง Flex Message เอง

**Tips:**
- ใช้ [LINE Flex Message Simulator](https://developers.line.biz/flex-simulator/) สร้าง JSON
- Copy JSON แล้ว paste ลงช่อง Custom Flex Message JSON

### Tab: Templates

**สร้าง Template:**
1. กรอก **ชื่อ Template** (เช่น "Weekly Schedule")
2. กรอก **คำอธิบาย** (optional)
3. Paste **Flex Message JSON**
4. กด **บันทึก Template**

**ใช้ Template:**
- กดปุ่ม 📤 เพื่อไปหน้าส่งข้อความพร้อม template ที่เลือก

**ลบ Template:**
- กดปุ่ม 🗑️ แล้วยืนยัน

### Tab: Webhook Info

ดูข้อมูล:
- Webhook URL
- Environment variables ที่ต้องการ
- Events ที่รองรับ
- ลิงก์ไปยัง documentation

## API Endpoints

### POST `/api/line/send-flex`

ส่ง Flex Message ไปยังผู้ใช้

**Request:**
```json
{
  "userId": "U1234567890abcdef...",
  "flexMessage": {
    "type": "bubble",
    "body": { ... }
  }
}
```

**Response:**
```json
{
  "success": true
}
```

### GET `/api/line/templates`

ดึงรายการ templates ทั้งหมด

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Welcome Message",
      "description": "ข้อความต้อนรับ",
      "template": { ... },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/line/templates`

สร้าง template ใหม่

**Request:**
```json
{
  "name": "Welcome Message",
  "description": "ข้อความต้อนรับ",
  "template": {
    "type": "bubble",
    "body": { ... }
  }
}
```

### DELETE `/api/line/templates?id=<uuid>`

ลบ template

## Webhook Events

Webhook อยู่ที่ `/api/webhook/line` รองรับ:

### 1. Follow Event

เมื่อผู้ใช้ add เพื่อน:
- บันทึกข้อมูลผู้ใช้ลง database
- ส่งข้อความต้อนรับ

### 2. Unfollow Event

เมื่อผู้ใช้บล็อกหรือลบเพื่อน:
- Update status เป็น 'inactive'

### 3. Message Event

เมื่อได้รับข้อความ:
- ถ้าข้อความมีคำว่า "activity" → ส่งตารางกิจกรรมจาก Google Drive

## ตัวอย่าง Flex Message

### Simple Text Bubble

```json
{
  "type": "bubble",
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "text",
        "text": "สวัสดีค่ะ!",
        "weight": "bold",
        "size": "xl"
      },
      {
        "type": "text",
        "text": "ยินดีต้อนรับสู่ Happy Kids",
        "size": "md",
        "margin": "md"
      }
    ]
  }
}
```

### With Button

```json
{
  "type": "bubble",
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "text",
        "text": "รายงานประจำวัน",
        "weight": "bold",
        "size": "xl"
      }
    ]
  },
  "footer": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "button",
        "action": {
          "type": "uri",
          "label": "ดูรายงาน",
          "uri": "https://your-liff-url"
        },
        "style": "primary"
      }
    ]
  }
}
```

## Troubleshooting

### ส่งข้อความไม่ได้

1. ตรวจสอบ `LINE_CHANNEL_ACCESS_TOKEN` ถูกต้อง
2. ตรวจสอบ User ID ถูกต้อง
3. ตรวจสอบ JSON format ถูกต้อง (ใช้ Flex Simulator)
4. ดู console logs ใน browser

### Webhook ไม่ทำงาน

1. ตรวจสอบ Webhook URL ใน LINE Console
2. ตรวจสอบ `LINE_CHANNEL_SECRET`
3. ตรวจสอบ SSL certificate (ต้องเป็น HTTPS)
4. ดู logs ใน server

### Template ไม่แสดง

1. ตรวจสอบ database connection
2. ตรวจสอบว่ารัน migration แล้ว
3. Refresh หน้าใหม่

## Resources

- [LINE Messaging API Documentation](https://developers.line.biz/en/docs/messaging-api/)
- [Flex Message Simulator](https://developers.line.biz/flex-simulator/)
- [Flex Message Specification](https://developers.line.biz/en/docs/messaging-api/using-flex-messages/)
- [LINE Developers Console](https://developers.line.biz/console/)

## Security Notes

- ⚠️ **User IDs เป็นข้อมูลส่วนตัว** - ใช้ระมัดระวัง
- ⚠️ **Access Token เป็นความลับ** - อย่า commit ลง git
- ⚠️ **Webhook ต้องใช้ HTTPS** - HTTP ไม่ได้
- ⚠️ **Verify signature** - ตรวจสอบ webhook signature เสมอ
