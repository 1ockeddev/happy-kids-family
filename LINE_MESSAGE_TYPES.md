# LINE Message Types Support

## Overview
ระบบรองรับการส่ง **2 ประเภทข้อความ** หลักของ LINE:
1. **Flex Message** - ข้อความที่ปรับแต่งได้อย่างอิสระ
2. **Template Message** - ข้อความแบบ template (buttons, confirm, carousel)

## ✅ สิ่งที่อัปเดต

### 1. API Route: `/api/line/send-flex`
- ✅ Auto-detect ประเภทข้อความ
- ✅ รองรับ Flex Message (type: bubble, carousel)
- ✅ รองรับ Template Message (type: template)

### 2. Migration File
- ✅ เพิ่ม sample templates สำหรับ Template Messages
- 📁 `db/migrations/003_add_line_flex_templates_buttons_sample.sql`

---

## Message Type Detection

API จะตรวจสอบ `type` ของ message แล้วส่งในรูปแบบที่ถูกต้อง:

### Flex Message
```typescript
// Input
{
  "type": "bubble",
  "body": { ... }
}

// ส่งไปเป็น
{
  "type": "flex",
  "altText": "Flex Message",
  "contents": { type: "bubble", body: {...} }
}
```

### Template Message
```typescript
// Input
{
  "type": "template",
  "altText": "...",
  "template": { ... }
}

// ส่งไปเป็น (ตรงตามที่ส่งมา)
{
  "type": "template",
  "altText": "...",
  "template": { ... }
}
```

---

## 1. Flex Message

### ลักษณะ
- ยืดหยุ่น ปรับแต่งได้ทุกส่วน
- Layout แบบ box model
- รองรับ responsive design

### Types
- **bubble** - ข้อความเดี่ยว 1 bubble
- **carousel** - หลาย bubbles เลื่อนได้

### ตัวอย่าง JSON

#### Simple Bubble
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
        "size": "xl",
        "color": "#6366F1"
      },
      {
        "type": "text",
        "text": "ยินดีต้อนรับสู่ Happy Kids Family",
        "size": "md",
        "color": "#64748B",
        "margin": "md",
        "wrap": true
      }
    ]
  }
}
```

#### With Hero Image
```json
{
  "type": "bubble",
  "hero": {
    "type": "image",
    "url": "https://via.placeholder.com/1040x1040",
    "size": "full",
    "aspectRatio": "20:13",
    "aspectMode": "cover"
  },
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
          "uri": "https://miniapp.line.me/YOUR-LIFF-ID"
        },
        "style": "primary",
        "color": "#6366F1"
      }
    ]
  }
}
```

---

## 2. Template Message

### ลักษณะ
- รูปแบบกำหนดไว้แล้ว
- ใช้งานง่ายกว่า
- เหมาะกับการใช้งานทั่วไป

### Types
- **buttons** - รูป + ข้อความ + ปุ่ม (สูงสุด 4 ปุ่ม)
- **confirm** - ข้อความ + 2 ปุ่ม (Yes/No)
- **carousel** - หลายการ์ดเลื่อนได้ (สูงสุด 10 การ์ด)
- **image_carousel** - รูปภาพหลายรูปเลื่อนได้

### ตัวอย่าง JSON

#### Buttons Template ⭐ (ที่คุณใช้)
```json
{
  "type": "template",
  "altText": "กดเพื่อดู Daily Report",
  "template": {
    "type": "buttons",
    "thumbnailImageUrl": "https://happy-kids-family.vercel.app/favicon.png",
    "imageAspectRatio": "square",
    "imageSize": "contain",
    "imageBackgroundColor": "#F6B1F3",
    "title": "Happy Kids Family",
    "text": "ดูรายงานประจำวันของลูกน้อย",
    "actions": [
      {
        "type": "uri",
        "label": "Daily Report",
        "uri": "https://miniapp.line.me/2009973794-LiM7FUcn"
      },
      {
        "type": "message",
        "label": "ถามคำถาม",
        "text": "มีคำถามค่ะ"
      }
    ]
  }
}
```

#### Confirm Template
```json
{
  "type": "template",
  "altText": "กรุณายืนยัน",
  "template": {
    "type": "confirm",
    "text": "ต้องการดูรายงานประจำวันหรือไม่?",
    "actions": [
      {
        "type": "uri",
        "label": "ดูรายงาน",
        "uri": "https://miniapp.line.me/2009973794-LiM7FUcn"
      },
      {
        "type": "message",
        "label": "ไว้ทีหลัง",
        "text": "ขอบคุณค่ะ"
      }
    ]
  }
}
```

#### Carousel Template
```json
{
  "type": "template",
  "altText": "เลือกเมนู",
  "template": {
    "type": "carousel",
    "columns": [
      {
        "thumbnailImageUrl": "https://via.placeholder.com/1040x1040/4F46E5/FFFFFF?text=Daily+Report",
        "imageBackgroundColor": "#4F46E5",
        "title": "Daily Report",
        "text": "ดูรายงานประจำวัน",
        "actions": [
          {
            "type": "uri",
            "label": "เปิดดู",
            "uri": "https://miniapp.line.me/2009973794-LiM7FUcn"
          }
        ]
      },
      {
        "thumbnailImageUrl": "https://via.placeholder.com/1040x1040/10B981/FFFFFF?text=Attendance",
        "imageBackgroundColor": "#10B981",
        "title": "Attendance",
        "text": "เช็คการเข้าเรียน",
        "actions": [
          {
            "type": "uri",
            "label": "เปิดดู",
            "uri": "https://miniapp.line.me/2009973794-LiM7FUcn"
          }
        ]
      },
      {
        "thumbnailImageUrl": "https://via.placeholder.com/1040x1040/F59E0B/FFFFFF?text=Behavior",
        "imageBackgroundColor": "#F59E0B",
        "title": "Behavior Score",
        "text": "ดูคะแนนพฤติกรรม",
        "actions": [
          {
            "type": "uri",
            "label": "เปิดดู",
            "uri": "https://miniapp.line.me/2009973794-LiM7FUcn"
          }
        ]
      }
    ]
  }
}
```

---

## การใช้งานใน Admin Panel

### วิธีส่งข้อความ

1. ไปที่ `/admin/line-messages`
2. Tab **"ส่งข้อความ"**
3. ใส่ **User ID** หรือ **Group ID** (C...)
4. เลือกวิธีหนึ่ง:
   - **เลือก Template** (ถ้าบันทึกไว้แล้ว)
   - **Custom JSON** (paste JSON ของคุณ)
5. กด **ส่งข้อความ**

### วิธีบันทึก Template

1. Tab **"Templates"**
2. กรอก:
   - **ชื่อ Template**: เช่น "Daily Report Button"
   - **คำอธิบาย**: เช่น "ปุ่มเปิด Daily Report"
   - **Template JSON**: paste JSON ของคุณ
3. กด **บันทึก Template**

---

## Buttons Template Fields

### Required Fields
```json
{
  "type": "template",           // ✅ ต้องมี
  "altText": "...",             // ✅ ต้องมี (แสดงใน notification)
  "template": {
    "type": "buttons",          // ✅ ต้องมี
    "text": "...",              // ✅ ต้องมี (ข้อความหลัก, max 160 chars)
    "actions": [...]            // ✅ ต้องมี (1-4 actions)
  }
}
```

### Optional Fields
```json
{
  "template": {
    "thumbnailImageUrl": "...",      // รูปภาพ (aspect ratio: 1:1.51 หรือ 1:1)
    "imageAspectRatio": "rectangle", // "rectangle" หรือ "square"
    "imageSize": "cover",            // "cover" หรือ "contain"
    "imageBackgroundColor": "#FFFFFF", // สีพื้นหลัง (hex)
    "title": "...",                  // หัวข้อ (max 40 chars)
    "text": "..."                    // ข้อความ (max 160 chars)
  }
}
```

### Actions (ปุ่ม)

#### URI Action - เปิด URL
```json
{
  "type": "uri",
  "label": "ดูรายงาน",
  "uri": "https://miniapp.line.me/YOUR-LIFF-ID"
}
```

#### Message Action - ส่งข้อความ
```json
{
  "type": "message",
  "label": "ถามคำถาม",
  "text": "มีคำถามค่ะ"
}
```

#### Postback Action - ส่ง data กลับ webhook
```json
{
  "type": "postback",
  "label": "เลือก",
  "data": "action=select&itemId=123"
}
```

#### Datetimepicker Action - เลือกวันเวลา
```json
{
  "type": "datetimepicker",
  "label": "เลือกวันที่",
  "data": "action=selectDate",
  "mode": "date"
}
```

---

## Limitations

### Buttons Template
- **Title**: สูงสุด 40 characters
- **Text**: สูงสุด 160 characters (ไม่มี title) หรือ 60 characters (มี title)
- **Actions**: 1-4 ปุ่ม
- **Image**: แนะนำ 1024x1024px (square) หรือ 1024x547px (rectangle)

### Confirm Template
- **Text**: สูงสุด 240 characters
- **Actions**: ต้องมี 2 ปุ่มเท่านั้น

### Carousel Template
- **Columns**: สูงสุด 10 cards
- **Text per card**: สูงสุด 60 characters (มี title) หรือ 120 characters (ไม่มี title)
- **Actions per card**: 1-3 ปุ่ม

### Flex Message
- **Size**: สูงสุด 50 KB ต่อข้อความ
- **Bubbles in carousel**: สูงสุด 12 bubbles

---

## Testing Tools

### LINE Flex Simulator
- URL: https://developers.line.biz/flex-simulator/
- ใช้สำหรับ: Flex Messages เท่านั้น

### LINE Bot Designer
- URL: https://manager.line.biz/account/YOUR-ACCOUNT-ID/richmenu
- ใช้สำหรับ: Rich Menus

### ทดสอบจริง
1. ใช้ LINE Official Account ของคุณ
2. ส่งข้อความผ่าน `/admin/line-messages`
3. ดูผลลัพธ์บนมือถือ

---

## Comparison: Flex vs Template

| Feature | Flex Message | Template Message |
|---------|--------------|------------------|
| ความยืดหยุ่น | สูงมาก | จำกัด |
| การใช้งาน | ยาก (ต้องเขียน JSON ซับซ้อน) | ง่าย |
| รูปแบบ | กำหนดเองได้ทุกอย่าง | มี template ให้เลือก |
| ขนาดไฟล์ | ใหญ่กว่า (สูงสุด 50KB) | เล็กกว่า |
| เหมาะกับ | การ์ด, ใบเสนอราคา, menu | ปุ่มเปิด URL, ยืนยัน, เลือก |
| ตัวอย่าง | bubble, carousel | buttons, confirm, carousel |

---

## Migration to Run

เพิ่ม sample templates:
```bash
psql "$DATABASE_URL" -f db/migrations/003_add_line_flex_templates_buttons_sample.sql
```

จะได้ templates:
1. ✅ **Daily Report Button** - Buttons template
2. ✅ **Confirm Template** - Confirm template
3. ✅ **Menu Carousel** - Carousel template

---

## API Usage Examples

### ส่ง Buttons Template
```bash
curl -X POST https://your-domain.com/api/line/send-flex \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "U1234567890abcdef...",
    "flexMessage": {
      "type": "template",
      "altText": "กดเพื่อดู Daily Report",
      "template": {
        "type": "buttons",
        "text": "ดูรายงานประจำวัน",
        "actions": [
          {
            "type": "uri",
            "label": "เปิดดู",
            "uri": "https://miniapp.line.me/YOUR-LIFF-ID"
          }
        ]
      }
    }
  }'
```

### ส่ง Flex Message
```bash
curl -X POST https://your-domain.com/api/line/send-flex \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "U1234567890abcdef...",
    "flexMessage": {
      "type": "bubble",
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "text",
            "text": "สวัสดีค่ะ!"
          }
        ]
      }
    }
  }'
```

---

## Resources

### LINE Official Documentation
- [Template Messages](https://developers.line.biz/en/docs/messaging-api/message-types/#template-messages)
- [Flex Messages](https://developers.line.biz/en/docs/messaging-api/using-flex-messages/)
- [Actions](https://developers.line.biz/en/docs/messaging-api/actions/)

### Tools
- [Flex Simulator](https://developers.line.biz/flex-simulator/)
- [LINE Developers Console](https://developers.line.biz/console/)

---

## Summary

✅ **ระบบรองรับทั้ง 2 ประเภท:**
1. Flex Message (bubble, carousel) - สำหรับความยืดหยุ่นสูง
2. Template Message (buttons, confirm, carousel) - สำหรับใช้งานง่าย

✅ **API auto-detect** ประเภทข้อความจาก `type` field

✅ **Template ของคุณจะใช้งานได้ทันที** - ไม่ต้องแก้ไขอะไร

✅ **Sample templates** พร้อมใช้งานหลังรัน migration

---

**Status:** ✅ Complete  
**Files Modified:** `app/api/line/send-flex/route.ts`  
**New Migration:** `003_add_line_flex_templates_buttons_sample.sql`  
**Documentation:** `LINE_MESSAGE_TYPES.md`
