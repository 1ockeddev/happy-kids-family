# วิธี Deploy ขึ้น Supabase

## ขั้นตอนที่ 1 — รัน Schema

เปิด **Supabase → SQL Editor** แล้วรันทีละขั้น:

### 1a. รัน Schema หลัก
paste ไฟล์ `db/migrations/001_initial.sql` ทั้งหมด → กด **Run**

> ถ้า DB local เก่ามี schema อยู่แล้ว ให้รัน `002_add_new_fields.sql` เพิ่มเติม

---

## ขั้นตอนที่ 2 — Export Data จาก Local

```bash
bash scripts/export-data.sh kindergarten postgres localhost
```

ได้ไฟล์ `local_data.sql` → paste ใน SQL Editor → Run

---

## ขั้นตอนที่ 3 — Connection String

Supabase → **Project Settings → Database → Connection string**

เลือก **Transaction pooler (port 6543)**:
```
postgresql://postgres.xxxx:[PASSWORD]@aws-0-xx.pooler.supabase.com:6543/postgres
```

---

## ขั้นตอนที่ 4 — Vercel Environment Variables

| Key | Value |
|-----|-------|
| `DATABASE_URL` | connection string ข้างบน |
| `ADMIN_USERNAME` | ชื่อ admin |
| `ADMIN_PASSWORD` | password |
| `AUTH_SECRET` | รัน `openssl rand -hex 32` |

---

## ตรวจสอบ

เปิด `https://your-app.vercel.app/api/health`

ต้องขึ้น: `{ "status": "ok", "database": "connected" }`

---

## ตั้งค่า Supabase Storage (สำหรับรูป Avatar)

### 1. สร้าง Bucket
Supabase → **Storage → New bucket**
- Name: `child-avatars`
- Public bucket: ✅ เปิด (เพื่อแสดงรูปได้โดยไม่ต้อง auth)

### 2. เพิ่ม env vars ใน Vercel
| Key | ที่มา |
|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role (secret) |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` ใช้ใน server-side เท่านั้น — **ห้าม** expose ฝั่ง client

### 3. ตั้งค่า local .env.local
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
