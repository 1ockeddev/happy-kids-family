-- ============================================================
-- Migration: Add super_admin and admin roles
-- วันที่: 2026-06-17
-- รายละเอียด: เพิ่ม super_admin และ admin ใน user_role enum
-- ============================================================

-- ⚠️ สำคัญ: PostgreSQL ไม่รองรับ IF NOT EXISTS สำหรับ ALTER TYPE ADD VALUE
-- ต้องรันแบบ conditional

-- Step 1: เช็คและเพิ่ม 'admin' role
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

-- Step 2: เช็คและเพิ่ม 'super_admin' role
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

-- ควรได้ผลลัพธ์:
-- teacher
-- parent
-- admin
-- super_admin

-- หมายเหตุสำคัญ:
-- 1. Super Admin ต้องมาจาก ADMIN_USERNAME และ ADMIN_PASSWORD ใน .env เท่านั้น
-- 2. ไม่สามารถสร้าง super_admin ผ่าน UI ได้ (ซ่อนจาก UI)
-- 3. Admin สามารถสร้างผ่าน UI ได้ แต่สิทธิ์น้อยกว่า Super Admin
-- 4. Role Hierarchy: super_admin > admin > teacher > parent
-- 5. ถ้ารันซ้ำจะไม่เกิด error (มี IF NOT EXISTS check)
-- 6. ต้องรันบน Supabase SQL Editor หรือ psql client
