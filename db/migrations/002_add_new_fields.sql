-- ============================================================
-- Migration 002: เพิ่ม fields ใหม่
-- รัน: psql $DATABASE_URL -f db/migrations/002_add_new_fields.sql
-- ============================================================

-- 1) daily_report: เพิ่ม food_amount, fruit_amount
ALTER TABLE daily_report
  ADD COLUMN IF NOT EXISTS food_amount  milk_status DEFAULT 'skip',
  ADD COLUMN IF NOT EXISTS fruit_amount milk_status DEFAULT 'skip';

-- 2) child_excretion: เปลี่ยน type/action เป็น enum
DO $$ BEGIN
  CREATE TYPE excretion_type AS ENUM ('pee','poo');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE excretion_action AS ENUM ('diaper','potty');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE child_excretion
  ALTER COLUMN type   TYPE excretion_type   USING type::excretion_type,
  ALTER COLUMN action TYPE excretion_action USING action::excretion_action;

-- 3) behavior_category: เพิ่ม cohort_ids
ALTER TABLE behavior_category
  ADD COLUMN IF NOT EXISTS cohort_ids UUID[] DEFAULT '{}';

COMMENT ON COLUMN behavior_category.cohort_ids IS
  'ห้องเรียนที่ใช้หมวดหมู่นี้ — ว่างหมายถึงใช้ทุกห้อง';
