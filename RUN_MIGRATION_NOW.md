# 🚨 ต้องรัน Migration ก่อนใช้งาน Admin Role

## ⚠️ Error ที่เกิด
```
invalid input value for enum user_role: "admin"
```

**สาเหตุ:** Database enum `user_role` ยังไม่มี `admin` และ `super_admin` values

---

## ✅ วิธีแก้ไข (ง่ายมาก!)

### Option 1: Supabase Dashboard (แนะนำ)

1. **เปิด Supabase Dashboard**
   - ไปที่ https://supabase.com/dashboard
   - เลือก Project: `happy kids family`

2. **เปิด SQL Editor**
   - คลิกที่ **SQL Editor** ในเมนูซ้าย
   - หรือกด URL: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql/new

3. **Copy & Paste SQL นี้:**

```sql
-- เช็คและเพิ่ม 'admin' role
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'admin' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'admin';
    END IF;
END $$;

-- เช็คและเพิ่ม 'super_admin' role
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'super_admin' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'super_admin';
    END IF;
END $$;

-- ตรวจสอบว่าเพิ่มสำเร็จ
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;
```

4. **กด RUN** (หรือ Ctrl/Cmd + Enter)

5. **ตรวจสอบผลลัพธ์** ควรเห็น:
   ```
   teacher
   parent
   admin
   super_admin
   ```

---

### Option 2: Command Line (ถ้าชอบใช้ Terminal)

```bash
# เข้าถึง Supabase database
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Paste SQL จาก db/migrations/002_add_admin_roles.sql
# กด Enter
```

---

### Option 3: Local Development Database

ถ้าใช้ local PostgreSQL:

```bash
# เข้า psql
psql -U postgres -d school_attendance

# รัน migration
\i db/migrations/002_add_admin_roles.sql
```

---

## 🎯 หลังรัน Migration

### ทดสอบว่าสำเร็จ:

1. **ลองสร้าง Admin user ใหม่:**
   - เปิด `/admin/users`
   - คลิก "+ เพิ่มผู้ใช้"
   - เลือก Role = "⚙️ Admin"
   - กรอกชื่อ, กด "บันทึก"
   - **ควรสำเร็จไม่มี error**

2. **ลองแก้ไข role เป็น admin:**
   - เลือก user ที่มีอยู่
   - คลิก แก้ไข (ปากกา)
   - เปลี่ยน Role เป็น "⚙️ Admin"
   - กด "บันทึก"
   - **ควรสำเร็จไม่มี error**

3. **เช็ค tabs:**
   - ควรเห็น tab "Admin" ใน users page
   - จำนวนใน badge ต้องถูกต้อง

---

## 🔍 Troubleshooting

### ถ้ายังเจอ error "invalid input value"

1. **เช็คว่ารัน migration จริงๆ:**
   ```sql
   SELECT enumlabel 
   FROM pg_enum 
   WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
   ORDER BY enumsortorder;
   ```
   
   ถ้าไม่เห็น `admin` และ `super_admin` แสดงว่ายังไม่ได้รัน

2. **เช็ค connection string:**
   - ใน `.env.local` ต้องชี้ไปที่ database ที่ถูกต้อง
   - Supabase Transaction Pooler: `postgres.xxx.pooler.supabase.com:6543`

3. **Restart dev server:**
   ```bash
   # หยุด server (Ctrl+C)
   npm run dev
   ```

4. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) หรือ Cmd+Shift+R (Mac)

---

## 📚 Migration File Location

ไฟล์ migration อยู่ที่:
```
db/migrations/002_add_admin_roles.sql
```

เปิดไฟล์แล้ว copy ทั้งหมดไปรันใน Supabase SQL Editor

---

## 💡 Tips

1. **ปลอดภัย:** Script มี `IF NOT EXISTS` check ดังนั้นรันซ้ำก็ไม่เป็นไร
2. **Production:** รันบน production database ด้วยเช่นกัน
3. **Backup:** Supabase มี automatic backups อยู่แล้ว
4. **Testing:** ลองบน development database ก่อนถ้ากังวล

---

## ✅ เสร็จแล้ว!

หลังรัน migration แล้ว:
- ✅ สามารถสร้าง Admin user ได้
- ✅ สามารถเปลี่ยน role เป็น admin ได้
- ✅ Tab "Admin" แสดงใน users page
- ✅ Role hierarchy ทำงานถูกต้อง

---

**ใช้เวลาแค่ 1-2 นาที!** 🚀
