# แก้ปัญหา Supabase Connection Limit บน Vercel

## ปัญหา
```
(EMAXCONN) max client connections reached, limit: 200
```

## สาเหตุ
- Vercel serverless functions สร้าง connection pool ใหม่ในแต่ละ instance
- หลาย instances + หลาย connections ต่อ instance = เกิน Supabase limit (200)

## วิธีแก้ (แนะนำ): ใช้ Supabase Connection Pooler

### 1. หา Connection String แบบ Pooler

ใน Supabase Dashboard:
1. ไปที่ **Project Settings** → **Database**
2. มองหาส่วน **Connection string** → เลือก **Transaction pooler** หรือ **Session pooler**
3. เลือก **URI** และ copy connection string

ตัวอย่าง:
```
# Direct (เดิม - จะเกิน limit)
postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Transaction Pooler (แนะนำ - ใช้ port 6543)
postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true

# Session Pooler (ทางเลือก - ใช้ port 5432 แต่ผ่าน pooler)
postgresql://postgres:[PASSWORD]@pooler.[PROJECT].supabase.co:5432/postgres
```

### 2. อัปเดต Environment Variable บน Vercel

1. ไปที่ Vercel Project → **Settings** → **Environment Variables**
2. แก้ไข `DATABASE_URL` เป็น Pooler URL ที่ได้จากข้างบน
3. **Redeploy** project

### 3. ตรวจสอบว่าใช้ Pooler แล้ว

URL ต้องมีอย่างใดอย่างหนึ่ง:
- มี `pooler.supabase.com` ในชื่อ host
- มี `:6543` (transaction pooler port)
- มี `?pgbouncer=true` ใน query string

## การทำงานของโค้ดที่แก้แล้ว

```typescript
// lib/db.ts ตรวจสอบอัตโนมัติว่าใช้ pooler หรือไม่
const usePooler = process.env.DATABASE_URL.includes('pooler.supabase.com') || 
                  process.env.DATABASE_URL.includes(':6543');

// ถ้าใช้ pooler: max = 10 connections
// ถ้าใช้ direct: max = 3 connections (เพื่อป้องกันเกิน limit)
const maxConnections = usePooler ? 10 : 3;
```

## เปรียบเทียบ Connection Modes

| Mode | Port | Pros | Cons | Use Case |
|------|------|------|------|----------|
| **Direct** | 5432 | รองรับ feature ทั้งหมด | จำกัด 200 connections | Local development |
| **Transaction Pooler** | 6543 | จำนวน connections เยอะ | ไม่รองรับ prepared statements | **Production (Vercel) ✅** |
| **Session Pooler** | 5432 (via pooler) | รองรับ feature มากขึ้น | connections น้อยกว่า transaction | Apps ที่ต้องใช้ advanced features |

## วิธีเช็คว่าแก้แล้ว

1. Deploy แล้วเปิด Vercel Function Logs
2. ดูว่ายังมี `EMAXCONN` error หรือไม่
3. หรือเข้า Supabase Dashboard → **Database** → **Connection pooling** ดูจำนวน active connections

## Additional: เพิ่ม Connection Pooling Statistics

ถ้าต้องการเช็คว่า connection pool ทำงานดีไหม:

```typescript
// เพิ่มใน lib/db.ts
pool.on('connect', () => {
  console.log('New client connected to pool');
});

pool.on('remove', () => {
  console.log('Client removed from pool');
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});
```

## ทางเลือกอื่น (ถ้ายังไม่ได้)

### 1. Upgrade Supabase Plan
- Free tier: 200 connections
- Pro tier: 500 connections
- Team/Enterprise: configurable

### 2. ใช้ Supabase Realtime/REST API แทน Direct SQL
- ไม่ต้องใช้ connection pool เลย
- เหมาะกับ simple queries

### 3. ใช้ Edge Functions แทน Serverless Functions
- Deno Deploy มี connection pooling ที่ดีกว่า
- แต่ต้องเขียนโค้ดใหม่

## สรุป

**แนะนำ**: ใช้ **Transaction Pooler** (port 6543) บน Vercel เพราะ:
- ✅ แก้ปัญหาได้ทันที
- ✅ ไม่ต้องเปลี่ยนโค้ด (มากนัก)
- ✅ Performance ดีขึ้น
- ✅ ไม่ต้องจ่ายเพิ่ม

**แค่เปลี่ยน `DATABASE_URL` บน Vercel เป็น pooler URL แล้ว redeploy!** 🚀
