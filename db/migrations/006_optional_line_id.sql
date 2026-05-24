-- Migration 006: ทำให้ line_user_id เป็น optional
-- ผู้ใช้ที่เพิ่มโดย admin เองไม่จำเป็นต้องมี LINE ID
ALTER TABLE app_user ALTER COLUMN line_user_id DROP NOT NULL;

-- เพิ่ม display_name field สำหรับแสดงชื่อในระบบ
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS display_name_th TEXT;
