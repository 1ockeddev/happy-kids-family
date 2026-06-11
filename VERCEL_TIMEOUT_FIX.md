# Fix: Failed to Fetch on Vercel Production

## ปัญหา
- ใน production (Vercel) เกิด "Failed to fetch" error
- Local development ทำงานปกติ
- เกิดจากการ timeout ของ Vercel serverless functions

## สาเหตุ
1. **Vercel Timeout Limits**:
   - Hobby plan: 10 seconds default
   - Pro plan: 60 seconds max (with config)
2. **Database Query Execution Time**: การ export/import ข้อมูลขนาดใหญ่ใช้เวลานาน
3. **No Client-Side Timeout**: Frontend ไม่มี timeout handling

## การแก้ไข

### 1. API Route Configuration (`/app/api/db-export/route.ts`, `/app/api/db-import/route.ts`)

เพิ่ม route segment config:

```typescript
// Vercel timeout configuration - extend to 60 seconds
export const maxDuration = 60; // Maximum execution time in seconds
export const dynamic = 'force-dynamic'; // Disable caching
```

### 2. Vercel Configuration (`vercel.json`)

สร้างไฟล์ `vercel.json` เพื่อกำหนด timeout per route:

```json
{
  "functions": {
    "app/api/db-export/route.ts": {
      "maxDuration": 60
    },
    "app/api/db-import/route.ts": {
      "maxDuration": 60
    },
    "app/api/db-import-batch/route.ts": {
      "maxDuration": 60
    }
  }
}
```

### 3. Frontend Timeout Handling (`/app/admin/database/page.tsx`)

เพิ่ม AbortController และ timeout สำหรับ fetch requests:

```typescript
// Add 60 second timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000);

const res = await fetch('/api/db-export?format=...', {
  signal: controller.signal,
});

clearTimeout(timeoutId);
```

### 4. Error Handling

เพิ่ม user-friendly error messages สำหรับ timeout:

```typescript
catch (e) {
  if (e instanceof Error && e.name === 'AbortError') {
    alert('การ export ใช้เวลานานเกินไป (timeout 60 วินาที)\nลองเลือกตารางน้อยลง หรือ export ทีละส่วน');
  } else {
    alert(e instanceof Error ? e.message : 'export ไม่สำเร็จ');
  }
}
```

## 🚀 Batch Import (สำหรับไฟล์ขนาดใหญ่)

### สร้าง Batch Import API (`/app/api/db-import-batch/route.ts`)

สำหรับไฟล์ที่ใหญ่เกิน 60 วินาที ให้ใช้ Batch Import:

**วิธีทำงาน:**
1. แบ่ง import เป็น table-by-table
2. แต่ละ table ทำงานใน 1 API call แยกกัน
3. แสดง progress bar แบบ real-time

**ข้อดี:**
- ✅ แต่ละ request ใช้เวลาน้อยกว่า 60 วินาที
- ✅ แสดง progress ให้เห็นว่าทำงานอยู่
- ✅ ถ้า table ใดล้มเหลว table อื่นยังทำงานต่อได้

**Frontend Implementation:**

```typescript
const handleBatchImport = async () => {
  const tables = Object.keys(json.tables);
  
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    setBatchProgress({ current: i + 1, total: tables.length, table });
    
    await fetch('/api/db-import-batch', {
      method: 'POST',
      body: JSON.stringify({
        table,
        rows: json.tables[table],
        overwrite: overwriteTables.has(table),
      }),
    });
  }
};
```

**UI Features:**
- Progress bar แสดงความคืบหน้า
- แสดงชื่อ table ที่กำลัง import
- แสดงจำนวน table ที่เสร็จ / ทั้งหมด

## ข้อควรระวัง

1. **Vercel Plan Limits**:
   - Hobby: maxDuration สูงสุด 10 วินาที
   - Pro: maxDuration สูงสุด 60 วินาที
   - Enterprise: สามารถเพิ่มได้มากกว่า

2. **เมื่อไหร่ควรใช้ Batch Import**:
   - ไฟล์มีข้อมูลมากกว่า 10,000 records
   - Import ธรรมดาใช้เวลาเกิน 60 วินาที
   - ต้องการเห็น progress ระหว่าง import

3. **Database Connection**:
   - ตรวจสอบ connection pool settings
   - อาจต้องเพิ่ม query timeout ใน database

## การใช้งาน

### Import ธรรมดา (< 60 วินาที)
1. เลือกไฟล์ JSON
2. กด "วิเคราะห์ Conflict"
3. เลือก tables ที่ต้องการเขียนทับ
4. กด "ยืนยัน Import"

### Batch Import (> 60 วินาที)
1. เลือกไฟล์ JSON
2. กด "วิเคราะห์ Conflict"
3. เลือก tables ที่ต้องการเขียนทับ
4. **กด "Batch Import (สำหรับไฟล์ใหญ่)"**
5. รอดู progress bar จนเสร็จ

## การ Deploy

1. Commit และ push changes:
   ```bash
   git add vercel.json app/api/db-*/route.ts app/admin/database/page.tsx
   git commit -m "feat: Add batch import for large files"
   git push
   ```

2. Vercel จะ auto-deploy และใช้ configuration ใหม่

3. ตรวจสอบใน Vercel Dashboard:
   - Functions → ดู timeout settings
   - Logs → ตรวจสอบว่า function ทำงานภายใน 60 วินาที

## Files Changed

- ✅ `vercel.json` - สร้างใหม่ (timeout config)
- ✅ `app/api/db-export/route.ts` - เพิ่ม maxDuration และ dynamic config
- ✅ `app/api/db-import/route.ts` - เพิ่ม maxDuration และ dynamic config
- ✅ `app/api/db-import-batch/route.ts` - สร้างใหม่ (batch import API)
- ✅ `app/admin/database/page.tsx` - เพิ่ม batch import UI และ progress bar
