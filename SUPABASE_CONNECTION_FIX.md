# แก้ปัญหา Supabase Connection Limit บน Vercel

## ปัญหา
```
(EMAXCONN) max client connections reached, limit: 200
password authentication failed for user "postgres"
```

## สาเหตุ
- Vercel serverless functions สร้าง connection pool ใหม่ในแต่ละ instance
- หลาย instances + หลาย connections ต่อ instance = เกิน Supabase limit (200)
- Transaction Pooler ใช้ **database password** แทน service role key
- **Admin pages ที่โหลดข้อมูลหลาย records** แล้วทำ API calls เพิ่มเติม (เช่น report counts)

## วิธีแก้ (แนะนำ): ใช้ Supabase Connection Pooler

### 1. หา Database Password

⚠️ **สำคัญ**: Transaction Pooler ไม่ใช้ service role key แต่ใช้ **database password**

ใน Supabase Dashboard:
1. ไปที่ **Project Settings** → **Database**
2. ส่วน **Connection string** → เลือก **Transaction pooler**
3. คลิก **Reset database password** ถ้าลืม password
4. Copy **Connection string** (จะมี `[YOUR-PASSWORD]` อยู่)

⚠️ **ระวัง Special Characters ใน Password**:
ถ้า password มี special characters (`!@#$%^&*()` ฯลฯ) ต้อง **URL encode** ก่อน:

```bash
# Password เดิม: MyP@ss123!
# URL encoded: MyP%40ss123%21

# ตัวอย่าง encoding:
@ → %40
! → %21
# → %23
$ → %24
% → %25
^ → %5E
& → %26
* → %2A
```

### 2. สร้าง Connection String ที่ถูกต้อง

รูปแบบ:
```
postgresql://postgres:[URL_ENCODED_PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true
```

ตัวอย่าง:
```bash
# ❌ ผิด - password ไม่ได้ encode
postgresql://postgres:MyP@ss123!@db.abc.supabase.co:6543/postgres

# ✅ ถูก - password ถูก encode แล้ว
postgresql://postgres:MyP%40ss123%21@db.abc.supabase.co:6543/postgres?pgbouncer=true
```

### 3. เครื่องมือ URL Encode Password

**วิธีที่ 1: ใช้ Node.js/Browser Console**
```javascript
encodeURIComponent('MyP@ss123!')
// Output: 'MyP%40ss123%21'
```

**วิธีที่ 2: ใช้ Online Tool**
- https://www.urlencoder.org/
- ใส่ password → กด Encode

**วิธีที่ 3: ใช้ Python**
```python
from urllib.parse import quote_plus
print(quote_plus('MyP@ss123!'))
```

### 4. อัปเดต Environment Variable บน Vercel

1. Encode password ก่อน (ตามวิธีข้างบน)
2. สร้าง connection string ที่ถูกต้อง
3. ไปที่ Vercel Project → **Settings** → **Environment Variables**
4. แก้ไข `DATABASE_URL` เป็น Pooler URL พร้อม encoded password
5. **Redeploy** project

### 5. ตรวจสอบว่า URL ถูกต้อง

URL ต้องมี:
- ✅ `postgres` เป็น username (ไม่ใช่ service role)
- ✅ Password ที่ถูก URL encode
- ✅ Port `:6543` (transaction pooler)
- ✅ `?pgbouncer=true` (optional แต่แนะนำ)

ตัวอย่างที่ถูกต้อง:
```
postgresql://postgres:encoded_password_here@db.xyz.supabase.co:6543/postgres?pgbouncer=true
```

## ทางเลือก: ใช้ Session Pooler แทน

ถ้า Transaction Pooler ยังมีปัญหา ให้ลอง **Session Pooler**:

1. ใน Supabase Dashboard → **Connection string** → เลือก **Session pooler**
2. URL จะเป็น: `postgresql://postgres.[PROJECT]@pooler.[PROJECT].supabase.co:5432/postgres`
3. Password เดียวกัน แต่ไม่ต้อง encode (ส่วนใหญ่)

ข้อแตกต่าง:
- Transaction Pooler (port 6543): เร็วกว่า แต่จำกัด features
- Session Pooler (port 5432): ช้ากว่านิดหน่อย แต่รองรับ features เต็ม

## การทำงานของโค้ดที่แก้แล้ว

```typescript
// lib/db.ts ตรวจสอบอัตโนมัติว่าใช้ pooler หรือไม่
const usePooler = process.env.DATABASE_URL.includes('pooler.supabase.com') || 
                  process.env.DATABASE_URL.includes(':6543');

// ถ้าใช้ pooler: max = 10 connections
// ถ้าใช้ direct: max = 3 connections (เพื่อป้องกันเกิน limit)
const maxConnections = usePooler ? 10 : 3;
```

## Troubleshooting

### ปัญหา 1: "password authentication failed"
**สาเหตุ**: 
- ใช้ service role key แทน database password
- Password ไม่ได้ URL encode
- Password ผิด

**แก้**:
1. ไปที่ Supabase → Settings → Database
2. Copy connection string จาก "Transaction pooler" หรือ "Session pooler"
3. URL encode password ก่อนใช้
4. อัปเดตใน Vercel

### ปัญหา 2: "EMAXCONN" ยังเกิดอยู่
**สาเหตุ**: ยังใช้ Direct connection (port 5432 แบบธรรมดา)

**แก้**: 
- ตรวจสอบว่า URL มี `:6543` หรือ `pooler.` ใน hostname
- ถ้าไม่มี ให้เปลี่ยนเป็น pooler URL

### ปัญหา 3: "Connection timeout"
**สาเหตุ**: Firewall หรือ network issue

**แก้**:
- ลอง Session Pooler (port 5432) แทน
- ตรวจสอบ Supabase service status

## เปรียบเทียบ Connection Modes

| Mode | Port | Username | Password | Use Case |
|------|------|----------|----------|----------|
| **Direct** | 5432 | postgres | DB Password | Local dev |
| **Transaction Pooler** | 6543 | postgres | DB Password | **Vercel Production ✅** |
| **Session Pooler** | 5432 (via pooler) | postgres | DB Password | Advanced features needed |

## วิธีเช็คว่าแก้แล้ว

1. Deploy แล้วเปิด Vercel Function Logs
2. ดูว่ายังมี `EMAXCONN` หรือ `password authentication failed` error หรือไม่
3. เข้า Supabase Dashboard → **Database** → **Connection pooling** ดูจำนวน active connections

## ตัวอย่างที่สมบูรณ์

```bash
# 1. Password เดิม
MySecretP@ss!2024

# 2. URL Encode (ใน browser console)
encodeURIComponent('MySecretP@ss!2024')
# Result: MySecretP%40ss%212024

# 3. Connection String สำหรับ Vercel
postgresql://postgres:MySecretP%40ss%212024@db.abcxyz.supabase.co:6543/postgres?pgbouncer=true
```

## Additional: รีเซ็ต Database Password

ถ้าลืม password หรือต้องการเปลี่ยน:

1. Supabase Dashboard → **Settings** → **Database**
2. หาส่วน **Database password**
3. คลิก **Reset Database Password**
4. Supabase จะสร้าง password ใหม่ให้
5. Copy และ URL encode password นั้น
6. อัปเดตใน Vercel Environment Variables

⚠️ **คำเตือน**: การรีเซ็ต password จะทำให้ connections เก่าหมดใช้ไปทันที!

## สรุป

**ขั้นตอนแก้ปัญหา**:
1. ✅ หา **database password** (ไม่ใช่ service role key)
2. ✅ **URL encode** password ถ้ามี special characters
3. ✅ ใช้ **Transaction Pooler URL** (port 6543)
4. ✅ อัปเดต `DATABASE_URL` บน Vercel
5. ✅ Redeploy

**Connection String Template**:
```
postgresql://postgres:[URL_ENCODED_PASSWORD]@db.[PROJECT_ID].supabase.co:6543/postgres?pgbouncer=true
```

แค่นี้ก็แก้ปัญหา connection limit และ authentication ได้แล้ว! 🚀
