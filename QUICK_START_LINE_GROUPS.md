# 🚀 Quick Start: LINE Groups

**Status:** ✅ Ready to use  
**Time to Test:** 10 minutes

---

## Prerequisites

- ✅ Migration 004 รันแล้ว
- ✅ Dev server running
- ✅ LINE Official Account มีสิทธิ์เข้ากลุ่ม

---

## 1️⃣ เปิดสิทธิ์ Group Chat (2 นาที)

**ใน LINE Developers Console:**
1. ไปที่ https://developers.line.biz/console/
2. เลือก Channel ของคุณ
3. ไปที่ **Messaging API** tab
4. หา **"Allow bot to join group chats"**
5. เปิดเป็น **ON** ✅

---

## 2️⃣ เชิญบอทเข้ากลุ่ม (2 นาที)

**ใน LINE App:**
1. เปิดกลุ่ม LINE (หรือสร้างกลุ่มทดสอบ)
2. กดเมนู **≡** → **เพิ่มเพื่อน**
3. ค้นหา LINE Official Account ของคุณ
4. เชิญเข้ากลุ่ม
5. บอทจะส่งข้อความทักทาย 👋

**Expected:**
```
สวัสดีค่ะทุกคน! 👋
ขอบคุณที่เชิญบอทเข้ากลุ่ม Happy Kids

พิมพ์ "Activity" เพื่อดูตารางกิจกรรมประจำสัปดาห์ได้เลยค่ะ 🎨
```

---

## 3️⃣ เช็คข้อมูลใน Admin (3 นาที)

### Tab 1: กลุ่มทั้งหมด

1. เปิด http://localhost:3000/admin/line-groups
2. เลือก status = **Active**

**Should see:**
- ✅ กลุ่มที่เชิญบอทเข้า
- ✅ ชื่อกลุ่ม
- ✅ สถานะ 🟢 Active
- ✅ จำนวนสมาชิก
- ✅ วันที่เข้าร่วม

### Tab 2: สมาชิก

1. คลิกปุ่ม **👥 ดูสมาชิก**
2. ดูรายชื่อ

**Should see:**
- ✅ รายชื่อสมาชิกในกลุ่ม
- ✅ รูปโปรไฟล์
- ✅ สถานะ 🟢 Active
- ✅ ถ้าลงทะเบียนแล้ว → มี ✓ badge

### Tab 3: Events

1. กลับไป Tab กลุ่ม
2. คลิกปุ่ม **📋 ดู Events**

**Should see:**
- ✅ Event "join" (บอทเข้ากลุ่ม)
- ✅ Event "memberJoined" (ถ้ามีคนเข้าหลังบอท)

---

## 4️⃣ ทดสอบส่งข้อความ (2 นาที)

**ในกลุ่ม LINE:**
1. พิมพ์ข้อความอะไรก็ได้
2. ลองพิมพ์ **"activity"**

**Expected:**
- ✅ ข้อความปกติ → บอทเงียบ (แต่เก็บ log)
- ✅ ข้อความ "activity" → บอทส่งรูปตารางกิจกรรม

### เช็คใน Admin:

1. Refresh Tab **Events**
2. กรอง: **Message**

**Should see:**
- ✅ ข้อความที่ส่งทั้งหมด
- ✅ ชื่อผู้ส่ง
- ✅ เวลาที่ส่ง

---

## 5️⃣ ทดสอบสมาชิกเข้า-ออก (1 นาที)

### เชิญคนใหม่:

1. ในกลุ่ม LINE → เชิญคนใหม่เข้ากลุ่ม
2. Refresh Tab **สมาชิก** ใน Admin

**Should see:**
- ✅ สมาชิกใหม่ปรากฏ
- ✅ วันเวลาเข้า

### Tab Events:
- ✅ Event "memberJoined" ปรากฏ

---

## ✅ Success!

ถ้าทุกขั้นตอนทำงาน คุณพร้อมใช้งาน:
- ✅ เชิญบอทเข้ากลุ่มได้
- ✅ ติดตามสมาชิก
- ✅ เก็บ log ข้อความ
- ✅ ส่งข้อความไปกลุ่มได้

---

## 🎯 ขั้นตอนถัดไป

### สำหรับ Production:

1. **ทดสอบกับกลุ่มจริง:**
   - เชิญบอทเข้ากลุ่มผู้ปกครอง
   - ตรวจสอบว่าข้อมูลถูกต้อง

2. **ส่งข้อความไปกลุ่ม:**
   - ใช้ API `/api/line/send-flex`
   - ระบุ `groupId` แทน `userId`

3. **Analytics:**
   - ดูจำนวนข้อความต่อวัน
   - ดูว่ากลุ่มไหนคุยเยอะ
   - ดูว่าใครส่งข้อความบ่อย

---

## 🛠️ Troubleshooting

### บอทไม่บันทึกกลุ่ม

**เช็ค:**
```bash
# 1. Webhook URL ถูกต้องหรือไม่
curl https://your-domain.com/api/webhook/line
# Should return: {"status":"LINE Webhook OK"}

# 2. "Allow bot to join group chats" เปิดหรือไม่
# ไปเช็คใน LINE Developers Console

# 3. Database ถูกต้องหรือไม่
export DATABASE_URL="postgresql://postgres:0000@localhost:5432/school_attendance"
psql "$DATABASE_URL" -c "SELECT * FROM line_groups;"
```

### สมาชิกไม่แสดง

**เช็ค:**
```bash
# Database มีข้อมูลหรือไม่
psql "$DATABASE_URL" -c "SELECT * FROM line_group_members LIMIT 5;"

# Logs มี error หรือไม่
# ดูใน terminal ที่รัน dev server
```

### Events ไม่เก็บ

**เช็ค:**
```bash
# Database
psql "$DATABASE_URL" -c "SELECT * FROM line_group_events ORDER BY created_at DESC LIMIT 10;"

# Webhook logs
# ดูใน LINE Developers Console → Messaging API → Webhook
```

---

## 📚 เอกสารเพิ่มเติม

- **คู่มือครบถ้วน:** `LINE_GROUPS_GUIDE.md`
- **รายละเอียดเทคนิค:** `LINE_GROUPS_IMPLEMENTATION_SUMMARY.md`
- **LINE Messages:** `LINE_MESSAGES_GUIDE.md`

---

## 🎓 Tips

### 1. ใช้กลุ่มทดสอบ
สร้างกลุ่มเล็กๆ สำหรับทดสอบก่อนใช้กับกลุ่มจริง

### 2. ตรวจสอบ Logs
ดู console logs เป็นประจำเพื่อเช็คว่ามี error หรือไม่

### 3. Backup Database
ก่อน deploy production ควร backup data

### 4. Test Webhook
ใช้ ngrok ทดสอบ webhook บนเครื่อง local:
```bash
ngrok http 3000
# Copy ngrok URL ไปตั้งใน LINE Console
```

---

**Happy grouping!** 👥✨

Time elapsed: ~10 minutes ⏱️

---

## 🎉 What's Next?

- ส่ง flex message ไปกลุ่ม
- วิเคราะห์ข้อความในกลุ่ม
- ตั้ง auto-reply ตาม keyword
- Export chat logs

**ระบบพร้อมใช้งานแล้ว!** 🚀
